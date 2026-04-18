import type { BuildOptions } from '../build/contracts';
import type { PreviewOptions } from '../server/types';

export interface StandalonePreviewClientPlan {
    basePath: string;
    index?: string;
    rootRelativePath: string;
}

export interface StandalonePreviewBuildPlan {
    clients?: StandalonePreviewClientPlan[];
    index?: string;
    outputPath: string;
    outputRoot: string;
    packageJsonPath: string;
    rootRelativePath?: string;
    usesClientArray: boolean;
}

export interface StandalonePreviewBuildOptions {
    allBuilds: BuildOptions[];
    buildConfig: BuildOptions;
    configPath?: string | null;
    cwd?: string;
    logging?: boolean;
    previewConfig?: PreviewOptions | null;
    outFile?: string;
}