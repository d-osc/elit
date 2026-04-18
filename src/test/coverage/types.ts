import type { TestCoverageReporter } from '../contracts';

export interface CoverageOptions {
    reportsDirectory: string;
    include?: string[];
    exclude?: string[];
    reporter?: TestCoverageReporter[];
    coveredFiles?: Set<string>;
}

export interface FileCoverage {
    path: string;
    statements: number;
    coveredStatements: number;
    branches: number;
    coveredBranches: number;
    functions: number;
    coveredFunctions: number;
    lines: number;
    coveredLines: number;
    uncoveredLines?: number[];
}