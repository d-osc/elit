import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { transformSync } from 'esbuild';

interface VMOptions {
    language?: 'ts' | 'js';
    registerModules?: { [key: string]: any };
    dir?: string;
}

class VM {
    private transpiler: typeof transformSync;
    private ctx: vm.Context;
    private registerModules: { [key: string]: any };
    private DATABASE_DIR: string;
    private SCRIPTDB_DIR: string;
    private pkgScriptDB: { dependencies?: Record<string, string> } = {};
    private language: 'ts' | 'js';
    private _registerModules: { [key: string]: any };
    private options: VMOptions;
    constructor(options?: VMOptions) {
        this.options = options || {};
        // Set directories based on options or defaults
        this.DATABASE_DIR = options?.dir || path.join(process.cwd(), 'databases');
        this.SCRIPTDB_DIR = process.cwd();

        // Ensure directories exist
        if (!fs.existsSync(this.DATABASE_DIR)) {
            fs.mkdirSync(this.DATABASE_DIR, { recursive: true });
        }
        if (!fs.existsSync(this.SCRIPTDB_DIR)) {
            fs.mkdirSync(this.SCRIPTDB_DIR, { recursive: true });
        }

        // Load scriptdb workspace package.json if it exists
        const pkgPath = path.join(this.SCRIPTDB_DIR, 'package.json');
        if (fs.existsSync(pkgPath)) {
            this.pkgScriptDB = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        }
        this.language = options?.language || 'ts';
        this.transpiler = transformSync;

        this.registerModules = options?.registerModules || {};
        this._registerModules = { ...this.registerModules };

        // Add require function to initial context for fallback path
        this._registerModules.require = ((moduleId: string) => this.createRequire(moduleId)).bind(this);

        this.ctx = vm.createContext(this._registerModules);


    }

    register(context: { [key: string]: any }) {
        this.registerModules = { ...this.registerModules, ...context };
        this._registerModules = { ...this._registerModules, ...context };
        // Always ensure our custom require function is present (with @db alias support)
        // Store the original require if it exists in context
        const originalRequire = context.require;
        this._registerModules.require = ((moduleId: string) => {
            // Try custom require first (handles @db aliases and database files)
            try {
                return this.createRequire(moduleId);
            } catch (e) {
                // Fall back to original require for node_modules
                if (originalRequire) {
                    return originalRequire(moduleId);
                }
                throw e;
            }
        }).bind(this);
        // Update context with all modules including require
        this.ctx = vm.createContext(this._registerModules);
    }

    private createRequire(moduleId: string): any {
        // Validate moduleId
        if (!moduleId) {
            console.error('[createRequire] moduleId is undefined');
            return {};
        }

        console.log('[createRequire] Loading module:', moduleId, 'from DATABASE_DIR:', this.DATABASE_DIR);

        // Handle @db/ path alias
        if (moduleId.startsWith('@db/')) {
            const relativePath = moduleId.substring(4); // Remove '@db/'
            moduleId = './' + relativePath;
            console.log('[createRequire] Resolved @db/ alias to:', moduleId);
        }

        // Handle relative paths (e.g., './users')
        if (moduleId.startsWith('./') || moduleId.startsWith('../')) {
            const dbDir = this.DATABASE_DIR || process.cwd();
            const fullPath = path.join(dbDir, moduleId);

            console.log('[createRequire] Full path:', fullPath);

            // Try to find the file with an extension
            let actualPath: string | undefined = fullPath;
            if (fs.existsSync(fullPath)) {
                actualPath = fullPath;
            } else {
                const extensions = ['.ts', '.tsx', '.js', '.mjs'];
                for (const ext of extensions) {
                    if (fs.existsSync(fullPath + ext)) {
                        actualPath = fullPath + ext;
                        break;
                    }
                }
            }

            console.log('[createRequire] Actual path:', actualPath);

            if (!actualPath || !fs.existsSync(actualPath)) {
                console.log('[createRequire] File not found, throwing error');
                throw new Error(`Module '${moduleId}' not found at ${fullPath}`);
            }

            // For TypeScript files, read and transpile the content
            if (actualPath.endsWith('.ts') || actualPath.endsWith('.tsx')) {
                const content = fs.readFileSync(actualPath, 'utf8');
                const js = this.transpiler(content, { loader: 'ts', format: 'cjs' }).code;

                // Create a wrapper object to capture the final exports
                const moduleWrapper = { exports: {} };
                const originalModule = this._registerModules.module;
                const originalExports = this._registerModules.exports;

                this._registerModules.module = moduleWrapper;
                this._registerModules.exports = moduleWrapper.exports;

                try {
                    vm.runInContext(js, this.ctx, { filename: actualPath });
                } finally {
                    if (originalModule) {
                        this._registerModules.module = originalModule;
                    } else {
                        delete this._registerModules.module;
                    }
                    if (originalExports) {
                        this._registerModules.exports = originalExports;
                    } else {
                        delete this._registerModules.exports;
                    }
                }

                console.log('[createRequire] Returning exports:', moduleWrapper.exports);
                return moduleWrapper.exports;
            }

            // For JS files, use standard require
            const result = require(actualPath);
            console.log('[createRequire] Returning (JS):', result);
            return result;
        }

        // For node_modules, use standard require
        return require(moduleId);
    }

    resolvePath(fileList: any[], query: string) {
        const aliases = { '@db': this.DATABASE_DIR };

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

    async moduleLinker(specifier: any, referencingModule: any) {
        console.log('[moduleLinker] Loading specifier:', specifier, 'from DATABASE_DIR:', this.DATABASE_DIR);

        // Try database files first
        const dbFiles = fs.readdirSync(this.DATABASE_DIR)
            .filter(f => f.endsWith(".ts"))
            .map(f => path.join(this.DATABASE_DIR, f));

        console.log('[moduleLinker] Database files:', dbFiles);

        const dbResult = this.resolvePath(dbFiles, specifier);
        console.log('[moduleLinker] Resolved path:', dbResult);

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

        // Try workspace packages
        const allowedPackages = Object.keys(this.pkgScriptDB.dependencies || {});
        if (allowedPackages.includes(specifier)) {
            try {
                // Import from scriptdb workspace node_modules
                const modulePath = path.join(this.SCRIPTDB_DIR, 'node_modules', specifier);
                const actualModule = await import(modulePath);
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
                console.error(`Failed to load workspace module ${specifier}:`, err);
                throw err;
            }
        }

        throw new Error(`Module ${specifier} is not allowed or not found.`);
    }

    async run(code: string) {
        const logs: any[] = [];

        const customConsole = ['log', 'error', 'warn', 'info', 'debug', 'trace'].reduce((acc: any, type: any) => {
            acc[type] = (...args: any[]) => logs.push({ type, args });
            return acc;
        }, {});

        this.register({
            console: customConsole
        });

        const systemModules = await SystemModuleResolver(this.options);
        this.register(systemModules);

        const js = this.transpiler(code, { loader: this.language, format: 'cjs' }).code;
        console.log('[run] Transpiled code:', js);

        // Try to use SourceTextModule if available (requires Node.js --experimental-vm-modules)
        try {
            const SourceTextModule = (vm as any).SourceTextModule;
            console.log('[run] SourceTextModule available:', typeof SourceTextModule === 'function');
            if (typeof SourceTextModule === 'function') {
                const mod = new SourceTextModule(js, { context: this.ctx, identifier: path.join(this.SCRIPTDB_DIR, 'virtual-entry.js') });
                await mod.link(this.moduleLinker.bind(this));
                await mod.evaluate();

                return {
                    namespace: mod.namespace,
                    logs: logs
                };
            }
        } catch (e) {
            console.log('[run] SourceTextModule failed, using fallback:', e);
            // SourceTextModule not available, fall through to alternative approach
        }

        // Fallback: Pre-process imports and use vm.runInContext
        let processedCode = js;

        console.log('[run] Original transpiled code:', processedCode);

        // esbuild converts: import { users } from './users'
        // to: var import_users = require("./users");
        // and uses: import_users.users
        // But our module exports: exports.users = []
        // So we need to convert import_users.users -> import_users

        // First, convert static imports to require calls
        processedCode = processedCode.replace(
            /var\s+(\w+)\s+=\s+require\((['"])([^'"]+)\2\);/g,
            (_match: string, varName: string, quote: string, modulePath: string) => {
                return `const ${varName} = require(${quote}${modulePath}${quote});`;
            }
        );

        // Convert any remaining static imports to require calls
        processedCode = processedCode.replace(
            /import\s+\{([^}]+)\}\s+from\s+(['"])([^'"]+)\2/g,
            (_match: string, imports: string, quote: string, modulePath: string) => {
                return `const { ${imports} } = require(${quote}${modulePath}${quote});`;
            }
        );

        processedCode = processedCode.replace(
            /import\s+(\w+)\s+from\s+(['"])([^'"]+)\2/g,
            (_match: string, name: string, quote: string, modulePath: string) => {
                return `const ${name} = require(${quote}${modulePath}${quote});`;
            }
        );

        // Convert dynamic import() to require()
        processedCode = processedCode.replace(/import\(([^)]+)\)/g, 'require($1)');

        console.log('[run] Processed code:', processedCode);

        console.log('[run] Context has require:', typeof this._registerModules.require);
        console.log('[run] DATABASE_DIR:', this.DATABASE_DIR);

        try {
            const result = vm.runInContext(processedCode, this.ctx, {
                filename: path.join(this.SCRIPTDB_DIR, 'virtual-entry.js')
            });

            return {
                namespace: result,
                logs: logs
            };
        } catch (e) {
            console.log('[run] Error executing code:', e);
            throw e;
        }
    }
}

function create(dbName: string, code: string | Function, options?: VMOptions): void {
    const DIR = options?.dir || path.join(process.cwd(), 'databases');
    const dbPath = path.join(DIR, `${dbName}.ts`);
    // Prepare the export line
    fs.appendFileSync(dbPath, code.toString(), 'utf8');
}

function read(dbName: string, options?: VMOptions): string {
    const DIR = options?.dir || path.join(process.cwd(), 'databases');
    const dbPath = path.join(DIR, `${dbName}.ts`);

    if (!fs.existsSync(dbPath)) {
        throw new Error(`Database '${dbName}' not found`);
    }

    return fs.readFileSync(dbPath, 'utf8');
}

function remove(dbName: string, fnName: string, options?: VMOptions) {
    const DIR = options?.dir || path.join(process.cwd(), 'databases');
    const dbPath = path.join(DIR, `${dbName}.ts`);
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

function rename(oldName: string, newName: string, options?: VMOptions): string {
    const DIR = options?.dir || path.join(process.cwd(), 'databases');
    const oldPath = path.join(DIR, `${oldName}.ts`);
    const newPath = path.join(DIR, `${newName}.ts`);

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

function save(dbName: string, code: string | Function | any, options?: VMOptions): void {
    const DIR = options?.dir || path.join(process.cwd(), 'databases');
    const dbPath = path.join(DIR, `${dbName}.ts`);

    let fileContent = typeof code === 'function' ? code.toString() : code;

    fs.writeFileSync(dbPath, fileContent, 'utf8');
}

function update(dbName: string, fnName: string, code: string | Function, options?: VMOptions) {
    const DIR = options?.dir || path.join(process.cwd(), 'databases');
    const dbPath = path.join(DIR, `${dbName}.ts`);

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

async function SystemModuleResolver(customOptions?: VMOptions) {

    const moduleRegistry = new Map<string, any>();

    // Wrap functions to automatically pass customOptions when called from within VM
    moduleRegistry.set("update", (dbName: string, fnName: string, code: string | Function) =>
        update(dbName, fnName, code, customOptions));
    moduleRegistry.set("remove", (dbName: string, fnName: string) =>
        remove(dbName, fnName, customOptions));
    moduleRegistry.set("create", (dbName: string, code: string | Function) =>
        create(dbName, code, customOptions));
    moduleRegistry.set("save", (dbName: string, code: string | Function | any) =>
        save(dbName, code, customOptions));
    moduleRegistry.set("read", (dbName: string) =>
        read(dbName, customOptions));

    const context: Record<string, any> = {
        // Add require-like functionality
        require: (moduleName: string) => {
            const module = moduleRegistry.get(moduleName);
            if (!module) {
                throw new Error(`Module '${moduleName}' not found`);
            }
            // Return the default export if available, otherwise the module itself
            return module.default || module;
        },

        // Add import functionality (simulated)
        import: async (moduleName: string) => {
            const module = moduleRegistry.get(moduleName);
            if (!module) {
                throw new Error(`Module '${moduleName}' not found`);
            }
            return {
                default: module.default || module
            };
        }
    };

    for (const [name, moduleExports] of moduleRegistry) {
        context[name] = moduleExports.default || moduleExports;
    }

    return context;
}

export class Database {
    private vm: VM;
    private options: VMOptions;

    constructor(options?: VMOptions) {
        this.options = {
            language: 'ts',
            registerModules: {},
            ...options
        };
        this.vm = new VM(this.options);
    }

    register(context: { [key: string]: any }) {
        this.vm.register(context);
    }

    async execute(code: string) {
        return await this.vm.run(code);
    }

    // ===== Database Helper Methods =====

    /**
     * Create a new database file with the given code
     */
    create(dbName: string, code: string | Function): void {
        return create(dbName, code, this.options);
    }

    /**
     * Read the contents of a database file
     */
    read(dbName: string): string {
        return read(dbName, this.options);
    }

    /**
     * Remove a function or the entire database file
     */
    remove(dbName: string, fnName?: string): string | boolean {
       return remove(dbName, fnName || "", this.options);
    }

    /**
     * Rename a database file
     */
    rename(oldName: string, newName: string): string {
       return rename(oldName, newName, this.options);
    }

    /**
     * Save code to a database file (overwrites existing content)
     */
    save(dbName: string, code: string | Function | any): void {
       return save(dbName, code, this.options);
    }

    /**
     * Update a function in a database file
     */
    update(dbName: string, fnName: string, code: string | Function): string {
       return update(dbName, fnName, code, this.options);
    }
}

// Export Database class and keep helper functions for backward compatibility
export { create, read, remove, rename, save, update };


