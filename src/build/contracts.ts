export interface BuildOptions {
    entry: string;
    outDir?: string;
    outFile?: string;
    minify?: boolean;
    sourcemap?: boolean;
    target?: 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext';
    format?: 'esm' | 'cjs' | 'iife';
    globalName?: string;
    platform?: 'browser' | 'node' | 'neutral';
    basePath?: string;
    external?: string[];
    resolve?: {
        alias?: Record<string, string>;
    };
    treeshake?: boolean;
    logging?: boolean;
    env?: Record<string, string>;
    copy?: Array<{ from: string; to: string; transform?: (content: string, config: BuildOptions) => string }>;
    onBuildEnd?: (result: BuildResult) => void | Promise<void>;
    standalonePreview?: boolean;
    standaloneDev?: boolean;
    standaloneDevOutFile?: string;
    standalonePreviewOutFile?: string;
}

export interface BuildResult {
    outputPath: string;
    buildTime: number;
    size: number;
}
