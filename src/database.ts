import vm from "node:vm";
import { resolve } from "./path";
import path from "node:path";
import fs from "node:fs";
import * as esbuild from 'esbuild';

export interface DatabaseConfig {
    dir?: string;
    language?: 'ts' | 'js';
    registerModules?: { [key: string]: any };
}

export class Database {
    private _ctx: vm.Context;
    private _registerModules: { [key: string]: any };
    private _config: DatabaseConfig = {
        dir: resolve(process.cwd(), 'databases'),
    };

    constructor(config: DatabaseConfig) {
        this._config = { ...this._config, ...config };
        this._registerModules = config.registerModules || {};
        this._ctx = vm.createContext(this._registerModules);
    }

    set config(config: DatabaseConfig) {
        this._config = { ...this._config, ...config };
    }

    private register(context: { [key: string]: any }) {
        this._registerModules = { ...this._registerModules, ...context };
        // Register any custom modules or plugins here if needed
        this._ctx = vm.createContext(this._registerModules);
    }

    plugin(moduleName: string, moduleContent: any) {
        this.register({ [moduleName]: moduleContent });
    }

    private resolvePath(fileList: any[], query: string) {
        const aliases = { '@db': this._config.dir || resolve(process.cwd(), 'databases') };

        let resolvedPath = query;
        for (const [alias, target] of Object.entries(aliases)) {
            if (resolvedPath.startsWith(alias + '/')) {
                resolvedPath = resolvedPath.replace(alias, target);
                break;
            }
        }

        // Normalize path separators for cross-platform compatibility
        resolvedPath = path.normalize(resolvedPath);

        return fileList.find(file => {
            const normalizedFile = path.normalize(file);
            const fileWithoutExt = normalizedFile.replace(/\.[^/.]+$/, "");
            return normalizedFile === resolvedPath ||
                fileWithoutExt === resolvedPath ||
                normalizedFile === resolvedPath + '.ts' ||
                normalizedFile === resolvedPath + '.js';
        });
    }

    private async moduleLinker(specifier: any, referencingModule: any) {
        // Try database files first
        const dbFiles = fs.readdirSync(this._config.dir || resolve(process.cwd(), 'databases'))
            .filter(f => f.endsWith(".ts"))
            .map(f => path.join(this._config.dir || resolve(process.cwd(), 'databases'), f));

        const dbResult = this.resolvePath(dbFiles, specifier);
        if (dbResult) {
            try {
                const actualModule = await import(dbResult);
                const exportNames = Object.keys(actualModule);
                return new vm.SyntheticModule(
                    exportNames,
                    function () {
                        exportNames.forEach(key => {
                            this.setExport(key, actualModule[key]);
                        });
                    },
                    { identifier: specifier, context: referencingModule.context }
                );
            } catch (err) {
                console.error(`Failed to load database module ${specifier}:`, err);
                throw err;
            }
        }

        throw new Error(`Module ${specifier} is not allowed or not found.`);
    }

    private async vmRun(code: string | Function, _options?: vm.RunningCodeOptions | string) {
        const logs: any[] = [];

        const customConsole = ['log', 'error', 'warn', 'info', 'debug', 'trace'].reduce((acc: any, type: any) => {
            acc[type] = (...args: any[]) => logs.push({ type, args });
            return acc;
        }, {});

        const systemBase = {
            update: update,
            remove: remove,
            rename: rename,
            read: read,
            create: create,
            save: save
        }



        this.register({
            dbConsole: { ...customConsole, ...systemBase }
        });

        let stringCode: string;
        if (typeof code === 'function') {
            const funcStr = code.toString();

            // ตัด arrow function หรือ function keyword และ opening brace ออก
            // ใช้ string methods แทน regex เพื่อหลีด ReDoS vulnerability

            // Check for arrow function first
            if (funcStr.includes('=>')) {
                const arrowIndex = funcStr.indexOf('=>');
                // Find opening brace after =>
                let start = arrowIndex + 2;
                while (start < funcStr.length && funcStr[start] === ' ') start++;
                if (funcStr[start] === '{') start++;

                // Find closing brace
                let end = funcStr.lastIndexOf('}');

                if (start < end) {
                    stringCode = funcStr.substring(start, end);
                } else {
                    stringCode = funcStr.substring(start);
                }
            } else if (funcStr.includes('function')) {
                const funcIndex = funcStr.indexOf('function');
                // Find opening parenthesis after function
                let start = funcIndex + 8; // 'function'.length
                while (start < funcStr.length && funcStr[start] === ' ') start++;
                if (funcStr[start] === '(') start++;

                // Skip function name if exists
                if (start < funcStr.length && funcStr[start] !== '(') {
                    while (start < funcStr.length && funcStr[start] !== ' ' && funcStr[start] !== '(') start++;
                }
                if (funcStr[start] === '(') start++;

                // Find opening brace
                while (start < funcStr.length && funcStr[start] === ' ') start++;
                if (funcStr[start] === '{') start++;

                // Find closing brace
                const end = funcStr.lastIndexOf('}');

                if (start < end) {
                    stringCode = funcStr.substring(start, end);
                } else {
                    stringCode = funcStr.substring(start);
                }
            } else {
                stringCode = funcStr;
            }

            // Trim leading newline, spaces, and trailing
            stringCode = stringCode.trim();

            // Transform import(aa).from("module") to import aa from "module"
            // ใช้ string methods แทน regex เพื่อหลีด ReDoS vulnerability
            let importPos = 0;
            while ((importPos = stringCode.indexOf('import(', importPos)) !== -1) {
                const fromPos = stringCode.indexOf('.from(', importPos);
                if (fromPos === -1) break;

                const quoteStart = stringCode.indexOf('(', fromPos + 7) + 1;
                if (quoteStart === -1) break;

                const quoteChar = stringCode[quoteStart];
                if (quoteChar !== '"' && quoteChar !== "'") break;

                const quoteEnd = stringCode.indexOf(quoteChar, quoteStart + 1);
                if (quoteEnd === -1) break;

                const modulePath = stringCode.substring(quoteStart + 1, quoteEnd);
                const importArgEnd = fromPos - 1;
                const importArgStart = importPos + 7;

                const trimmed = stringCode.substring(importArgStart, importArgEnd).trim();

                let replacement: string;
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                    // Destructuring: import({bb}) -> import { bb }
                    const inner = trimmed.slice(1, -1).trim();
                    replacement = `import { ${inner} } from "${modulePath}"`;
                } else {
                    // Default: import(aa) -> import aa
                    replacement = `import ${trimmed} from "${modulePath}"`;
                }

                const before = stringCode.substring(0, importPos);
                const after = stringCode.substring(quoteEnd + 2);
                stringCode = before + replacement + after;
            }

            // Trim leading whitespace from each line
            const lines = stringCode.split('\n');
            const trimmedLines = lines.map(line => line.trim());
            stringCode = trimmedLines.join('\n').trim();
        } else {
            stringCode = code;
        }

        // Transpile using esbuild
        const result = await esbuild.build({
            stdin: {
                contents: stringCode,
                loader: this._config.language || 'ts',
            },
            format: 'esm',
            target: 'es2020',
            write: false,
            bundle: false,
            sourcemap: false,
        });
        const js = result.outputFiles[0].text;

        const mod = new vm.SourceTextModule(js, { context: this._ctx, identifier: path.join(this._config.dir || resolve(process.cwd(), 'databases'), 'virtual-entry.js') });
        await mod.link(this.moduleLinker.bind(this));
        await mod.evaluate();
        return {
            namespace: mod.namespace,
            logs: logs
        }
    }

    /**
     * Execute database code and return results
     */
    async execute(code: string | Function, options?: vm.RunningCodeOptions | string) {
        return await this.vmRun(code, options);
    }

}

function create(dbName: string, code: string | Function): void {
    const DIR = "databases";
    const basePath = process.cwd();
    const baseDir: string = path.resolve(basePath, DIR);
    const dbPath = path.join(baseDir, `${dbName}.ts`);
    // Prepare the export line
    fs.appendFileSync(dbPath, code.toString(), 'utf8');
}

function read(dbName: string): string {
    const DIR = "databases";
    const basePath = process.cwd();
    const baseDir: string = path.resolve(basePath, DIR);
    const dbPath = path.join(baseDir, `${dbName}.ts`);

    if (!fs.existsSync(dbPath)) {
        throw new Error(`Database '${dbName}' not found`);
    }

    return fs.readFileSync(dbPath, 'utf8');
}

function remove(dbName: string, fnName: string) {
    const DIR = "databases";
    const basePath = process.cwd();
    const baseDir: string = path.resolve(basePath, DIR); // โฟลเดอร์ที่อนุญาต   
    const dbPath = path.join(baseDir, `${dbName}.ts`);
    if (!fs.existsSync(dbPath)) return false;

    // if no functionName provided -> remove the whole file (after backup)
    if (!fnName) {
        const bak = `${dbPath}.bak`;
        try {
            fs.copyFileSync(dbPath, bak);
        } catch (e) {
            // ignore backup errors
        }
        try {
            fs.unlinkSync(dbPath);
            return "Removed successfully";
        } catch (e) {
            return "Removed failed";
        }
    }

    // create a backup before editing the file in-place
    const bak = `${dbPath}.bak`;
    try {
        fs.copyFileSync(dbPath, bak);
    } catch (e) {
        // ignore backup errors but continue carefully
    }

    let src = fs.readFileSync(dbPath, "utf8");
    const escaped = fnName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    // regex to find a declaration of the named symbol (function, class, or var/const/let assignment)
    const startRe = new RegExp(
        `function\\s+${escaped}\\s*\\(|\\bclass\\s+${escaped}\\b|\\b(?:const|let|var)\\s+${escaped}\\s*=\\s*(?:function\\b|class\\b|\\(|\\{|\\[)`,
        "m"
    );

    const startMatch = src.match(startRe);

    if (startMatch) {
        const startIdx = startMatch.index;

        // find the first meaningful character after startIdx: {, [, or ; or newline
        const len = src.length;
        const idxCurly = src.indexOf("{", startIdx);
        const idxBracket = src.indexOf("[", startIdx);
        let braceOpen = -1;
        if (idxCurly === -1) braceOpen = idxBracket;
        else if (idxBracket === -1) braceOpen = idxCurly;
        else braceOpen = Math.min(idxCurly, idxBracket);

        if (braceOpen !== -1) {
            const openingChar = src[braceOpen];
            const closingChar = openingChar === "[" ? "]" : "}";
            let i = braceOpen + 1;
            let depth = 1;
            while (i < len && depth > 0) {
                const ch = src[i];
                if (ch === openingChar) depth++;
                else if (ch === closingChar) depth--;
                i++;
            }
            let braceClose = i;
            let endIdx = braceClose;
            if (src.slice(braceClose, braceClose + 1) === ";")
                endIdx = braceClose + 1;

            const before = src.slice(0, startIdx);
            const after = src.slice(endIdx);
            src = before + after;
        } else {
            // fallback: remove until next semicolon or a blank line
            const semi = src.indexOf(";", startIdx);
            let endIdx = semi !== -1 ? semi + 1 : src.indexOf("\n\n", startIdx);
            if (endIdx === -1) endIdx = len;
            src = src.slice(0, startIdx) + src.slice(endIdx);
        }
    }

    // remove any export const <name>: any = <name>; lines
    const exportRe = new RegExp(
        `export\\s+const\\s+${escaped}\\s*:\\s*any\\s*=\\s*${escaped}\\s*;?`,
        "g"
    );
    src = src.replace(exportRe, "");

    // tidy up multiple blank lines
    src = src.replace(/\n{3,}/g, "\n\n");

    fs.writeFileSync(dbPath, src, "utf8");

    return `Removed ${fnName} from database ${dbName}.`;
}

function rename(oldName: string, newName: string): string {
    const DIR = "databases";
    const basePath = process.cwd();
    const baseDir: string = path.resolve(basePath, DIR); // โฟลเดอร์ที่อนุญาต   
    const oldPath = path.join(baseDir, `${oldName}.ts`);
    const newPath = path.join(baseDir, `${newName}.ts`);

    // Check if the source file exists
    if (!fs.existsSync(oldPath)) {
        return `Error: File '${oldName}.ts' does not exist in the database`;
    }

    // Check if the destination file already exists
    if (fs.existsSync(newPath)) {
        return `Error: File '${newName}.ts' already exists in the database`;
    }

    try {
        // Rename the file
        fs.renameSync(oldPath, newPath);
        return `Successfully renamed '${oldName}.ts' to '${newName}.ts'`;
    } catch (error) {
        return `Error renaming file: ${error instanceof Error ? error.message : String(error)}`;
    }
}

function save(dbName: string, code: string | Function | any): void {
    const DIR = "databases";
    const basePath = process.cwd();
    const baseDir: string = path.resolve(basePath, DIR); // โฟลเดอร์ที่อนุญาต   
    const dbPath = path.join(baseDir, `${dbName}.ts`);

    let fileContent = typeof code === 'function' ? code.toString() : code;

    fs.writeFileSync(dbPath, fileContent, 'utf8');
}

function update(dbName: string, fnName: string, code: string | Function) {
    const DIR = "databases";
    const basePath = process.cwd();
    const baseDir: string = path.resolve(basePath, DIR); // โฟลเดอร์ที่อนุญาต
    const dbPath = path.join(baseDir, `${dbName}.ts`);

    let src;

    if (!fs.existsSync(dbPath)) {
        // If dbPath doesn't exist, create an empty module file so we can insert into it.
        try {
            fs.writeFileSync(dbPath, "", "utf8");
            // console.log("Created new database file:", dbPath);
            return `Created new database file: ${dbPath}`;
        } catch (e) {
            // console.error("Failed to create dbPath file:", dbPath, e && e.message ? e.message : e);
            return `Failed to create dbPath file: ${dbPath}`;
        }
    }

    src = fs.readFileSync(dbPath, "utf8");

    const originalSrc = src;

    const escaped = fnName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const startRe = new RegExp(
        `function\\s+${escaped}\\s*\\(|\\bclass\\s+${escaped}\\b|\\b(?:const|let|var)\\s+${escaped}\\s*=\\s*(?:function\\b|class\\b|\\(|\\{|\\[)`,
        "m"
    );
    const startMatch = src.match(startRe);

    // determine declKind in the current file (if present)
    let declKind = null;

    if (startMatch) {
        let startIdx: any = startMatch.index;
        const snippet = src.slice(startIdx, startIdx + 80);
        if (/^function\b/.test(snippet)) declKind = "functionDecl";
        else if (/^class\b/.test(snippet)) declKind = "classDecl";
        else if (/^\b(?:const|let|var)\b/.test(snippet)) declKind = "varAssign";
    }

    // build replacement code for this value
    let newCode;
    if (typeof code === "function") {
        const fnStr = code.toString();
        // prefer const assignment for anonymous functions/classes or arrow functions
        if (declKind === "functionDecl") {
            if (/^function\s+\w+/.test(fnStr)) newCode = fnStr;
            else
                newCode = `function ${fnName}${fnStr.replace(
                    /^function\s*\(/,
                    "("
                )}`;
        } else if (declKind === "classDecl") {
            if (/^class\s+\w+/.test(fnStr)) newCode = fnStr;
            else if (/^class\s*\{/.test(fnStr))
                newCode = fnStr.replace(/^class\s*\{/, `class ${fnName} {`);
            else newCode = `const ${fnName} = ${fnStr};`;
        } else {
            newCode = `const ${fnName} = ${fnStr};`;
        }
    } else {
        newCode = `const ${fnName} = ${valueToCode(code, 0)};`;
    }

    // replacement: if found startMatch, find block and replace between startIdx and endIdx
    if (startMatch) {
        const startIdx = startMatch.index;
        // find first '{' or '[' after startIdx
        const idxCurly = src.indexOf("{", startIdx);
        const idxBracket = src.indexOf("[", startIdx);
        let braceOpen = -1;
        if (idxCurly === -1) braceOpen = idxBracket;
        else if (idxBracket === -1) braceOpen = idxCurly;
        else braceOpen = Math.min(idxCurly, idxBracket);

        if (braceOpen === -1) {
            // no block — fallback: replace export or append
            const exportRe = new RegExp(
                `export\\s+const\\s+${escaped}\\s*:\\s*any\\s*=\\s*${escaped}\\s*;?`,
                "m"
            );
            if (exportRe.test(src)) {
                src = src.replace(
                    exportRe,
                    `${newCode}\n\nexport const ${fnName}: any = ${fnName};`
                );
            } else {
                src =
                    src + `\n\n${newCode}\n\nexport const ${fnName}: any = ${fnName};`;
            }
        } else {
            const openingChar = src[braceOpen];
            const closingChar = openingChar === "[" ? "]" : "}";
            let i = braceOpen + 1;
            let depth = 1;
            const len = src.length;
            while (i < len && depth > 0) {
                const ch = src[i];
                if (ch === openingChar) depth++;
                else if (ch === closingChar) depth--;
                i++;
            }
            let braceClose = i;
            let endIdx = braceClose;
            if (src.slice(braceClose, braceClose + 1) === ";")
                endIdx = braceClose + 1;

            const before = src.slice(0, startIdx);
            const after = src.slice(endIdx);
            src = before + newCode + after;
        }
    } else {
        // not found — try to insert before existing export or append
        const exportRe = new RegExp(
            `export\\s+const\\s+${escaped}\\s*:\\s*any\\s*=\\s*${escaped}\\s*;?`,
            "m"
        );
        if (exportRe.test(src)) {
            src = src.replace(
                exportRe,
                `${newCode}\n\nexport const ${fnName}: any = ${fnName};`
            );
        } else {
            src =
                src + `\n\n${newCode}\n\nexport const ${fnName}: any = ${fnName};`;
        }
    }

    fs.writeFileSync(dbPath, src, "utf8");

    if (src === originalSrc) {
        return `Saved ${fnName} to database ${dbName}.`;
    } else {
        return `Updated ${dbName} with ${fnName}.`;
    }
}

function valueToCode(val: any, depth: number = 0): string {
    const indentUnit = "    ";
    const indent = indentUnit.repeat(depth);
    const indentInner = indentUnit.repeat(depth + 1);

    if (val === null) return "null";
    const t = typeof val;
    if (t === "string") return JSON.stringify(val);
    if (t === "number" || t === "boolean") return String(val);
    if (t === "function") return val.toString();
    if (Array.isArray(val)) {
        if (val.length === 0) return "[]";
        const items = val.map((v) => valueToCode(v, depth + 1));
        return (
            "[\n" +
            items.map((it) => indentInner + it).join(",\n") +
            "\n" +
            indent +
            "]"
        );
    }
    if (t === "object") {
        const keys = Object.keys(val);
        if (keys.length === 0) return "{}";
        const entries = keys.map((k) => {
            const keyPart = isIdentifier(k) ? k : JSON.stringify(k);
            const v = valueToCode(val[k], depth + 1);
            return indentInner + keyPart + ": " + v;
        });
        return "{\n" + entries.join(",\n") + "\n" + indent + "}";
    }
    return String(val);
}

function isIdentifier(key: any) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}


// Default database instance

export function database() {
    return new Database({
        dir: resolve(process.cwd(), 'databases')
    });
}

export interface DatabaseConsole extends Console {
    create?(dbName: string, code: string | Function): void;
    read(dbName: string): string;
    remove(dbName: string, fnName: string): any;
    rename(oldName: string, newName: string): string;
    save(dbName: string, code: string | Function | any): void;
    update(dbName: string, fnName: string, code: string | Function): any;
}

export const dbConsole: DatabaseConsole = {
    create: create,
    read: read,
    remove: remove,
    rename: rename,
    save: save,
    update: update,
    ...console
}
export default database;