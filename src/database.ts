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
            const arrowMatch = funcStr.match(/^[\s]*\(?\s*\)?\s*=>\s*{?/);
            const functionMatch = funcStr.match(/^[\s]*function\s*\(?[\w\s]*\)?\s*{/);
            const match = arrowMatch || functionMatch;
            const start = match ? match[0].length : 0;
            const end = funcStr.lastIndexOf('}');
            stringCode = funcStr.substring(start, end);
            // Trim leading newline, spaces, and trailing
            stringCode = stringCode.replace(/^[\s\r\n]+/, '').replace(/[\s\r\n]+$/, '');

            // Transform import(aa).from("module") to import aa from "module"
            stringCode = stringCode.replace(
                /import\s*\(\s*([^)]+?)\s*\)\s*\.from\s*\(\s*(['"])([^'"]+)\2\s*\)/g,
                (_, importArg, quote, modulePath) => {
                    // Check if importArg is wrapped in braces (destructuring)
                    const trimmed = importArg.trim();
                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                        // Destructuring: import({bb}) -> import { bb }
                        const inner = trimmed.slice(1, -1).trim();
                        return `import { ${inner} } from ${quote}${modulePath}${quote}`;
                    } else {
                        // Default: import(aa) -> import aa
                        return `import ${trimmed} from ${quote}${modulePath}${quote}`;
                    }
                }
            );

            // Trim leading whitespace from each line
            stringCode = stringCode.split('\n').map(line => line.trim()).join('\n').trim();
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