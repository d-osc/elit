import vm from "node:vm";
import { resolve } from "./path";
import path from "node:path";
import fs from "node:fs";
import { serverDatabase } from "./server"
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

        this.register({
            console: customConsole
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

export const database = serverDatabase.database;

export default database;