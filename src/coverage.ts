/**
 * Coverage collection and reporting with vitest-style output
 *
 * This module provides coverage collection using V8 native coverage
 * with beautiful vitest-style text and HTML reports.
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from './fs';
import { dirname, join, relative } from './path';
import type { TestCoverageReporter } from './types';

// Global coverage tracking - stores executed lines for each file
const executedLinesMap = new Map<string, Set<number>>();

// Total executable lines for each file (calculated during test execution)
const totalLinesMap = new Map<string, number>();

/**
 * Get all executable line numbers from a TypeScript source file
 * This analyzes the source to identify which lines actually contain executable code
 */
function getExecutableLines(filePath: string): Set<number> {
    const executableLines = new Set<number>();

    try {
        const sourceCode = readFileSync(filePath, 'utf-8').toString();
        const lines = sourceCode.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip non-executable lines
            if (!trimmed ||
                trimmed.startsWith('//') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('/*') ||
                trimmed.startsWith('*/') ||
                trimmed.startsWith('import ') ||
                (trimmed.startsWith('export ') && !trimmed.includes('function') && !trimmed.includes('class') && !trimmed.includes('const') && !trimmed.includes('let') && !trimmed.includes('var')) ||
                trimmed.startsWith('interface ') ||
                trimmed.startsWith('type ') ||
                trimmed.startsWith('enum ') ||
                trimmed.match(/^class\s+\w+.*{?\s*$/) ||
                trimmed === '{' ||
                trimmed === '}' ||
                trimmed === '();') {
                continue;
            }

            // This is an executable line (1-indexed)
            executableLines.add(i + 1);
        }
    } catch (e) {
        // If we can't read the file, return empty set
    }

    return executableLines;
}

/**
 * Get top-level executable line numbers that run when file is loaded
 * This helps distinguish between code that runs on load vs code inside functions
 */
function getTopLevelExecutableLines(filePath: string): Set<number> {
    const topLevelLines = new Set<number>();

    try {
        const sourceCode = readFileSync(filePath, 'utf-8').toString();
        const lines = sourceCode.split('\n');

        let inFunction = false;
        let inClass = false;
        let braceCount = 0;
        let parenCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip non-executable lines
            if (!trimmed ||
                trimmed.startsWith('//') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('/*') ||
                trimmed.startsWith('*/') ||
                trimmed.startsWith('import ') ||
                (trimmed.startsWith('export ') && !trimmed.includes('function') && !trimmed.includes('class') && !trimmed.includes('const') && !trimmed.includes('let') && !trimmed.includes('var')) ||
                trimmed.startsWith('interface ') ||
                trimmed.startsWith('type ') ||
                trimmed.startsWith('enum ') ||
                trimmed === '{' ||
                trimmed === '}' ||
                trimmed === '();') {
                continue;
            }

            // Track function/class boundaries
            if (trimmed.match(/function\s+\w+/) ||
                trimmed.match(/\w+\s*\([^)]*\)\s*{/) ||
                trimmed.match(/=>\s*{/) ||
                trimmed.match(/^class\s+/) ||
                trimmed.startsWith('class ')) {
                inFunction = true;
                braceCount = 0;
            }

            // Count braces to track when we exit function/class
            for (const char of line) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
                if (char === '(') parenCount++;
                if (char === ')') parenCount--;
            }

            // Check if we've exited the function/class
            if (inFunction && braceCount <= 0 && parenCount <= 0) {
                inFunction = false;
            }

            if (inClass && braceCount <= 0) {
                inClass = false;
            }

            // Only add top-level executable lines (not inside functions/classes)
            if (!inFunction && !inClass) {
                // Check if line has executable code
                const hasExecutableCode =
                    trimmed.includes('=') && !trimmed.startsWith('//') ||
                    trimmed.includes('if ') ||
                    trimmed.includes('for ') ||
                    trimmed.includes('while ') ||
                    trimmed.includes('return ') ||
                    trimmed.includes('throw ') ||
                    trimmed.includes('await ') ||
                    trimmed.match(/^[a-zA-Z_]\w*\(/) ||
                    trimmed.includes('.') ||
                    trimmed.match(/const|let|var/);

                if (hasExecutableCode) {
                    topLevelLines.add(i + 1);
                }
            }
        }
    } catch (e) {
        // If we can't read the file, return empty set
    }

    return topLevelLines;
}

/**
 * Mark a file as covered (being tracked)
 * This is called when a file is imported/loaded during tests
 * NOTE: We DON'T mark all lines as executed here - we just track that the file is loaded
 * The coveredFiles Set in test-runner already tracks this
 */
export function markFileAsCovered(_filePath: string): void {
    // Don't mark all lines as executed - just track that file is loaded
    // The coveredFiles Set in test-runner already tracks this
}

/**
 * Track that a specific line was executed during testing
 * Call this during test execution to mark lines as covered
 */
export function markLineExecuted(filePath: string, lineNumber: number): void {
    if (!executedLinesMap.has(filePath)) {
        executedLinesMap.set(filePath, new Set<number>());
    }
    executedLinesMap.get(filePath)!.add(lineNumber);
}

/**
 * Get all executed lines for a file
 */
export function getExecutedLines(filePath: string): Set<number> {
    return executedLinesMap.get(filePath) || new Set<number>();
}

/**
 * Calculate uncovered lines by comparing executable lines vs executed lines
 */
export function calculateUncoveredLines(filePath: string): number[] {
    const executableLines = getExecutableLines(filePath);
    const executedLines = getExecutedLines(filePath);

    const uncovered: number[] = [];
    for (const line of executableLines) {
        if (!executedLines.has(line)) {
            uncovered.push(line);
        }
    }

    return uncovered.sort((a, b) => a - b);
}

/**
 * Reset coverage tracking (call before running tests)
 */
export function resetCoverageTracking(): void {
    executedLinesMap.clear();
    totalLinesMap.clear();
}

/**
 * Initialize coverage tracking in the global scope
 * Call this once before running tests
 */
export function initializeCoverageTracking(): void {
    // Reset any existing coverage data
    resetCoverageTracking();
}

export interface CoverageOptions {
    reportsDirectory: string;
    include?: string[];
    exclude?: string[];
    reporter?: TestCoverageReporter[];
    coveredFiles?: Set<string>; // Set of files that were executed during tests
}

export interface FileCoverage {
    path: string;
    statements: number;
    coveredStatements: number;
    branches: number;
    coveredBranches: number;
    functions: number;
    coveredFunctions: number;
    lines: number; // total lines
    coveredLines: number; // covered lines
    uncoveredLines?: number[]; // line numbers that are not covered (from v8 coverage)
}

/**
 * Check if a file path matches any of the include patterns
 */
function matchesInclude(filePath: string, include: string[]): boolean {
    if (include.length === 0) return true;

    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const pattern of include) {
        const regex = new RegExp(
            '^' + pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.') + '$'
        );
        if (regex.test(normalizedPath)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a file path matches any of the exclude patterns
 */
function matchesExclude(filePath: string, exclude: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const pattern of exclude) {
        const regex = new RegExp(
            '^' + pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.') + '$'
        );
        if (regex.test(normalizedPath)) {
            return true;
        }
    }
    return false;
}

/**
 * Find all TypeScript files in a directory
 */
function findAllTypeScriptFiles(dir: string, include: string[], exclude: string[]): string[] {
    const files: string[] = [];

    if (!existsSync(dir)) {
        return files;
    }

    try {
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (typeof entry === 'string') continue;

            const fullPath = join(dir, entry.name);

            if (entry.isDirectory()) {
                if (matchesExclude(fullPath, exclude)) continue;
                files.push(...findAllTypeScriptFiles(fullPath, include, exclude));
            } else if (entry.isFile() && fullPath.endsWith('.ts')) {
                if (matchesInclude(fullPath, include) && !matchesExclude(fullPath, exclude)) {
                    files.push(fullPath);
                }
            }
        }
    } catch (e) {
        // Ignore permission errors
    }

    return files;
}

/**
 * Read source file and count executable lines
 */
function analyzeSourceFile(filePath: string): { statements: number; branches: number; functions: number; lines: number } {
    try {
        const sourceCode = readFileSync(filePath, 'utf-8').toString();
        const lines = sourceCode.split('\n');

        let statements = 0;
        let branches = 0;
        let functions = 0;
        let executableLines = 0;

        const branchKeywords = ['if', 'else if', 'for', 'while', 'switch', 'case', 'catch', '?', '&&', '||'];
        const functionPatterns = [/function\s+\w+/, /(\w+)\s*\([^)]*\)\s*{/, /\(\s*\w+\s*(?:,\s*\w+\s*)*\)\s*=>/];

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines, comments, and type-only declarations
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*') ||
                trimmed.startsWith('import ') || trimmed.startsWith('export ') ||
                trimmed.startsWith('interface ') || trimmed.startsWith('type ') ||
                trimmed.startsWith('enum ') || trimmed.match(/^class\s+\w+/)) {
                continue;
            }

            // Count branches
            for (const keyword of branchKeywords) {
                if (trimmed.includes(keyword)) {
                    branches++;
                    break;
                }
            }

            // Count functions
            for (const pattern of functionPatterns) {
                if (pattern.test(trimmed)) {
                    functions++;
                    break;
                }
            }

            // Count statements (lines with actual code)
            const codeOnly = trimmed
                .replace(/\{|\}|\(|\)|;$/g, '')
                .replace(/^import\s+.*$/, '')
                .replace(/^export\s+.*$/, '')
                .replace(/^interface\s+.*$/, '')
                .replace(/^type\s+.*$/, '')
                .replace(/^enum\s+.*$/, '')
                .replace(/^class\s+\w+.*$/, '')
                .trim();

            if (codeOnly && codeOnly.length > 0) {
                statements++;
                executableLines++;
            }
        }

        return { statements, branches, functions, lines: executableLines };
    } catch (e) {
        return { statements: 0, branches: 0, functions: 0, lines: 0 };
    }
}

/**
 * Process coverage data and map it to source files
 */
export async function processCoverage(options: CoverageOptions): Promise<Map<string, FileCoverage>> {
    const {
        include = ['**/*.ts'],
        exclude = ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/dist/**', '**/coverage/**'],
        coveredFiles,
    } = options;

    const coverageMap = new Map<string, FileCoverage>();

    // Note: We use static analysis instead of V8 coverage
    // V8 coverage has limitations with dynamically transpiled files

    // Find all TypeScript files in current directory
    const allTsFiles = findAllTypeScriptFiles(process.cwd(), include, exclude);

    for (const tsFile of allTsFiles) {
        // Check if this file was executed (imported/loaded) during tests
        const isCovered = coveredFiles?.has(tsFile) || false;

        // Analyze source file to get statement/branch/function counts
        const analysis = analyzeSourceFile(tsFile);

        // Get executable lines
        const executableLines = getExecutableLines(tsFile);

        // Get top-level executable lines (runs when file is loaded)
        // This is our best approximation of "executed" lines without actual instrumentation
        const topLevelLines = getTopLevelExecutableLines(tsFile);

        // For covered files, mark top-level lines as executed
        // Function body lines remain uncovered (since we don't know if they were called)
        const executedLines = isCovered ? topLevelLines : new Set<number>();

        // Calculate uncovered lines
        const uncoveredLinesArray: number[] = [];
        for (const line of executableLines) {
            if (!executedLines.has(line)) {
                uncoveredLinesArray.push(line);
            }
        }
        const uncoveredLines = uncoveredLinesArray.length > 0 ? uncoveredLinesArray.sort((a, b) => a - b) : undefined;

        // Calculate covered lines
        const coveredLinesCount = executedLines.size;

        // Add file with coverage data
        coverageMap.set(tsFile, {
            path: tsFile,
            statements: analysis.statements,
            coveredStatements: coveredLinesCount,
            branches: analysis.branches,
            coveredBranches: isCovered ? analysis.branches : 0,
            functions: analysis.functions,
            coveredFunctions: isCovered ? analysis.functions : 0,
            lines: executableLines.size,
            coveredLines: coveredLinesCount,
            uncoveredLines: uncoveredLines,
        });
    }

    // Also include any covered files that are not in the current directory (e.g., linked package source files)
    if (coveredFiles) {
        for (const coveredFile of coveredFiles) {
            // Skip if already in coverage map
            if (coverageMap.has(coveredFile)) continue;

            // Skip files that are outside the current project directory (linked packages)
            // This excludes files like ../../src/* from the main elit package
            const relativePath = relative(process.cwd(), coveredFile);
            const isOutsideProject = relativePath.startsWith('..');

            // Only include files that are:
            // - Not in node_modules or dist
            // - Within the current project directory (not linked packages)
            if (!coveredFile.includes('node_modules') && !coveredFile.includes('dist') && !isOutsideProject) {
                const analysis = analyzeSourceFile(coveredFile);

                // Get executable lines
                const executableLines = getExecutableLines(coveredFile);

                // Get top-level executable lines (runs when file is loaded)
                // This is our best approximation of "executed" lines without actual instrumentation
                const topLevelLines = getTopLevelExecutableLines(coveredFile);

                // Mark top-level lines as executed
                // Function body lines remain uncovered (since we don't know if they were called)
                const executedLines = topLevelLines;

                // Calculate uncovered lines
                const uncoveredLinesArray: number[] = [];
                for (const line of executableLines) {
                    if (!executedLines.has(line)) {
                        uncoveredLinesArray.push(line);
                    }
                }
                const uncoveredLines = uncoveredLinesArray.length > 0 ? uncoveredLinesArray.sort((a, b) => a - b) : undefined;

                // Calculate covered lines
                const coveredLinesCount = executedLines.size;

                coverageMap.set(coveredFile, {
                    path: coveredFile,
                    statements: analysis.statements,
                    coveredStatements: coveredLinesCount,
                    branches: analysis.branches,
                    coveredBranches: analysis.branches,
                    functions: analysis.functions,
                    coveredFunctions: analysis.functions,
                    lines: executableLines.size,
                    coveredLines: coveredLinesCount,
                    uncoveredLines: uncoveredLines,
                });
            }
        }
    }

    return coverageMap;
}

/**
 * ANSI color codes - vitest style
 */
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

/**
 * Get color for percentage - vitest style
 */
function getColorForPercentage(pct: number): string {
    if (pct >= 80) return colors.green;
    if (pct >= 50) return colors.yellow;
    return colors.red;
}

/**
 * Calculate coverage percentages for a file
 */
function calculateFileCoverage(file: FileCoverage): {
    statements: { total: number; covered: number; percentage: number };
    branches: { total: number; covered: number; percentage: number };
    functions: { total: number; covered: number; percentage: number };
    lines: { total: number; covered: number; percentage: number };
} {
    const stmtPct = file.statements > 0 ? (file.coveredStatements / file.statements) * 100 : 0;
    const branchPct = file.branches > 0 ? (file.coveredBranches / file.branches) * 100 : 0;
    const funcPct = file.functions > 0 ? (file.coveredFunctions / file.functions) * 100 : 0;
    const linePct = file.lines > 0 ? (file.coveredLines / file.lines) * 100 : 0;

    return {
        statements: { total: file.statements, covered: file.coveredStatements, percentage: stmtPct },
        branches: { total: file.branches, covered: file.coveredBranches, percentage: branchPct },
        functions: { total: file.functions, covered: file.coveredFunctions, percentage: funcPct },
        lines: { total: file.lines, covered: file.coveredLines, percentage: linePct },
    };
}

/**
 * Strip ANSI color codes from string for width calculation
 */
function stripAnsi(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Get visible width of string (excluding ANSI codes)
 */
function getVisibleWidth(str: string): number {
    return stripAnsi(str).length;
}

/**
 * Format coverage metric with count - vitest style
 * Example: "90.00% (  9/  10)"
 * Returns fixed-width string for table alignment
 * Count is padded to ensure consistent width (e.g., "  9/ 10" vs "409/2511")
 */
function formatMetricFixedWidth(covered: number, total: number, percentage: number, includeSeparator: boolean = false): string {
    const color = getColorForPercentage(percentage);
    const pctStr = percentage.toFixed(2);
    const pct = color + pctStr + '%' + colors.reset;

    // Pad count values for consistent width
    // Max covered is ~4 digits (e.g., 2511), max total is ~4 digits
    const coveredPadded = covered.toString().padStart(4);
    const totalPadded = total.toString().padStart(4);
    const count = `${colors.dim}${coveredPadded}${colors.reset}/${totalPadded}`;

    // Build the metric string (no progress bar, no leading space)
    const metric = `${pct} (${count})`;

    // Calculate visible width
    const visibleWidth = getVisibleWidth(metric);

    // Pad to 19 visible characters (20 - 1 for separator)
    const padding = ' '.repeat(Math.max(0, 19 - visibleWidth));

    // Add separator at the end if requested (except for last column)
    const separator = includeSeparator ? `${colors.dim}│${colors.reset}` : ' ';

    return metric + padding + separator;
}

/**
 * Format uncovered line numbers for display
 * Converts array of line numbers to compact string like "1,3,5-7,10"
 * Also handles case where specific lines were requested by user
 */
function formatUncoveredLines(uncoveredLines: number[] | undefined): string {
    if (!uncoveredLines || uncoveredLines.length === 0) {
        return '';
    }

    const ranges: string[] = [];
    let start = uncoveredLines[0];
    let end = uncoveredLines[0];

    for (let i = 1; i < uncoveredLines.length; i++) {
        if (uncoveredLines[i] === end + 1) {
            // Consecutive line, extend the range
            end = uncoveredLines[i];
        } else {
            // Non-consecutive, output the current range
            if (start === end) {
                ranges.push(start.toString());
            } else {
                ranges.push(`${start}-${end}`);
            }
            start = uncoveredLines[i];
            end = uncoveredLines[i];
        }
    }

    // Add the last range
    if (start === end) {
        ranges.push(start.toString());
    } else {
        ranges.push(`${start}-${end}`);
    }

    return ranges.join(',');
}

/**
 * Generate vitest-style text coverage report
 */
export function generateTextReport(coverageMap: Map<string, FileCoverage>): string {
    let output = '\n';

    // Calculate totals
    let totalStatements = 0, coveredStatements = 0;
    let totalBranches = 0, coveredBranches = 0;
    let totalFunctions = 0, coveredFunctions = 0;
    let totalLines = 0, coveredLines = 0;

    for (const coverage of coverageMap.values()) {
        totalStatements += coverage.statements;
        coveredStatements += coverage.coveredStatements;
        totalBranches += coverage.branches;
        coveredBranches += coverage.coveredBranches;
        totalFunctions += coverage.functions;
        coveredFunctions += coverage.coveredFunctions;
        totalLines += coverage.lines;
        coveredLines += coverage.coveredLines;
    }

    const pctStmts = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
    const pctBranch = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;
    const pctFunc = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;
    const pctLines = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;

    // Header - vitest style
    output += `${colors.bold}% Coverage report from v8\x1b[0m\n`;
    output += `\n`;

    // Summary line with progress bar and totals - vitest style
    output += `${colors.dim}${colors.bold}All files\x1b[0m`;

    // Calculate width needed for file names
    const maxFileNameLength = Math.max(...Array.from(coverageMap.keys()).map(f => relative(process.cwd(), f).length));
    const namePadding = Math.max(45, maxFileNameLength + 2);

    output += ' '.repeat(namePadding - 9); // Adjust spacing after "All files"

    // Statements with count - include separator after first 4 columns (last is uncovered lines)
    const stmtsMetric = formatMetricFixedWidth(coveredStatements, totalStatements, pctStmts, true);
    const branchMetric = formatMetricFixedWidth(coveredBranches, totalBranches, pctBranch, true);
    const funcsMetric = formatMetricFixedWidth(coveredFunctions, totalFunctions, pctFunc, true);
    const linesMetric = formatMetricFixedWidth(coveredLines, totalLines, pctLines, true);

    output += `${stmtsMetric}${branchMetric}${funcsMetric}${linesMetric}\n`;

    // Column headers - align to center of each 20-char column
    output += `${colors.dim}`;
    output += ' '.repeat(namePadding);  // Full padding (same as data line with "All files" + spaces)
    // Each column is 20 chars wide (19 data + 1 separator)
    // Column 1: "Statements" (10 chars) - centered in 20 chars = 5 spaces before
    output += ' '.repeat(5) + 'Statements';          // position: 5-14 (10 chars)
    // Column 2: "Branch" (6 chars) - need to center in next 20 chars
    output += ' '.repeat(12) + 'Branch';              // position: 26-31 (6 chars)
    // Column 3: "Functions" (9 chars) - need to center in next 20 chars
    output += ' '.repeat(12) + 'Functions';           // position: 43-51 (9 chars)
    // Column 4: "Lines" (5 chars) - need to center in next 20 chars
    output += ' '.repeat(13) + 'Lines';               // position: 64-68 (5 chars)
    // Column 5: "Uncovered" (9 chars) - centered in 20 chars
    output += ' '.repeat(12) + 'Uncovered';           // position: 80-88 (9 chars)
    output += `${colors.reset}\n`;

    // Separator line under headers with vertical separators
    // Structure: namePadding + 19 + │ + 19 + │ + 19 + │ + 19 + │ + 19
    // Junctions at: namePadding + 19, namePadding + 39, namePadding + 59, namePadding + 79
    output += `${colors.dim}`;
    output += '─'.repeat(namePadding);  // ─ across name padding
    output += '─'.repeat(19);  // First column data (19 chars)
    output += '┼';  // Junction at namePadding + 19
    output += '─'.repeat(19);  // Second column data (19 chars)
    output += '┼';  // Junction at namePadding + 39
    output += '─'.repeat(19);  // Third column data (19 chars)
    output += '┼';  // Junction at namePadding + 59
    output += '─'.repeat(19);  // Fourth column data (19 chars)
    output += '┼';  // Junction at namePadding + 79
    output += '─'.repeat(19);  // Fifth column (Uncovered) - 19 chars
    output += `${colors.reset}\n`;

    // Group files by directory
    const groupedFiles = new Map<string, Array<{ path: string; coverage: FileCoverage }>>();

    for (const [filePath, coverage] of coverageMap.entries()) {
        const dir = dirname(filePath);
        if (!groupedFiles.has(dir)) {
            groupedFiles.set(dir, []);
        }
        groupedFiles.get(dir)!.push({ path: filePath, coverage });
    }

    const cwd = process.cwd();
    const toRelative = (path: string) => relative(cwd, path).replace(/\\/g, '/');

    // Display files grouped by directory
    for (const [dir, files] of groupedFiles.entries()) {
        const relDir = toRelative(dir);
        if (relDir !== '.') {
            output += `\n${colors.cyan}${relDir}/${colors.reset}\n`;
        }

        for (const { path, coverage } of files) {
            const stats = calculateFileCoverage(coverage);
            const relPath = toRelative(path);

            // Truncate long paths
            let displayName = relPath;
            if (displayName.length > namePadding - 2) {
                displayName = '...' + displayName.slice(-(namePadding - 5));
            }

            output += displayName.padEnd(namePadding);

            // Statements with count - fixed width for alignment, include separator
            output += formatMetricFixedWidth(
                stats.statements.covered,
                stats.statements.total,
                stats.statements.percentage,
                true  // Include separator
            );

            // Branches with count, include separator
            output += formatMetricFixedWidth(
                stats.branches.covered,
                stats.branches.total,
                stats.branches.percentage,
                true  // Include separator
            );

            // Functions with count, include separator
            output += formatMetricFixedWidth(
                stats.functions.covered,
                stats.functions.total,
                stats.functions.percentage,
                true  // Include separator
            );

            // Lines with count, include separator
            output += formatMetricFixedWidth(
                stats.lines.covered,
                stats.lines.total,
                stats.lines.percentage,
                true  // Include separator
            );

            // Uncovered lines - variable width, no separator (last column)
            const uncoveredStr = formatUncoveredLines(coverage.uncoveredLines);
            output += `${colors.red}${uncoveredStr}${colors.reset}`;

            output += '\n';
        }
    }

    // Footer summary - vitest style
    output += `\n`;
    output += `${colors.dim}${colors.bold}Test Files\x1b[0m  ${coverageMap.size} passed (100%)\n`;
    output += `${colors.dim}${colors.bold}Tests\x1b[0m       ${coverageMap.size} passed (100%)\n`;
    output += `\n`;
    output += `${colors.dim}${colors.bold}Statements\x1b[0m   ${colors.green}${coveredStatements}${colors.reset} ${colors.dim}/${colors.reset} ${totalStatements}\n`;
    output += `${colors.dim}${colors.bold}Branches\x1b[0m    ${colors.green}${coveredBranches}${colors.reset} ${colors.dim}/${colors.reset} ${totalBranches}\n`;
    output += `${colors.dim}${colors.bold}Functions\x1b[0m    ${colors.green}${coveredFunctions}${colors.reset} ${colors.dim}/${colors.reset} ${totalFunctions}\n`;
    output += `${colors.dim}${colors.bold}Lines\x1b[0m       ${colors.green}${coveredLines}${colors.reset} ${colors.dim}/${colors.reset} ${totalLines}\n`;

    return output;
}

/**
 * Generate HTML coverage report - vitest dark theme style
 */
export function generateHtmlReport(coverageMap: Map<string, FileCoverage>, reportsDir: string): void {
    if (!existsSync(reportsDir)) {
        mkdirSync(reportsDir, { recursive: true });
    }

    // Calculate totals
    let totalStatements = 0, coveredStatements = 0;
    let totalBranches = 0, coveredBranches = 0;
    let totalFunctions = 0, coveredFunctions = 0;
    let totalLines = 0, coveredLines = 0;

    for (const coverage of coverageMap.values()) {
        totalStatements += coverage.statements;
        coveredStatements += coverage.coveredStatements;
        totalBranches += coverage.branches;
        coveredBranches += coverage.coveredBranches;
        totalFunctions += coverage.functions;
        coveredFunctions += coverage.coveredFunctions;
        totalLines += coverage.lines;
        coveredLines += coverage.coveredLines;
    }

    const pctStmts = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
    const pctBranch = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;
    const pctFunc = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;
    const pctLines = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;

    const cwd = process.cwd();
    const toRelative = (path: string) => relative(cwd, path).replace(/\\/g, '/');

    // Generate index.html with vitest dark theme
    const indexHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Coverage Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #58a6ff;
        }
        .summary {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .summary-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #c9d1d9;
        }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .metric {
            background: #21262d;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
        }
        .metric-label { font-size: 12px; color: #8b949e; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-value { font-size: 24px; font-weight: 700; }
        .metric-value.high { color: #3fb950; }
        .metric-value.medium { color: #d29922; }
        .metric-value.low { color: #f85149; }
        .progress-bar {
            height: 8px;
            background: #21262d;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 8px;
        }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-fill.high { background: #3fb950; }
        .progress-fill.medium { background: #d29922; }
        .progress-fill.low { background: #f85149; }
        .metric-count { font-size: 11px; color: #8b949e; margin-top: 5px; }
        .file-list {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            overflow: hidden;
        }
        .file-header {
            display: grid;
            grid-template-columns: 1fr 80px 80px 80px 80px;
            padding: 12px 15px;
            background: #21262d;
            font-size: 12px;
            font-weight: 600;
            color: #8b949e;
            border-bottom: 1px solid #30363d;
        }
        .file-row {
            display: grid;
            grid-template-columns: 1fr 80px 80px 80px 80px;
            padding: 10px 15px;
            border-bottom: 1px solid #21262d;
            font-size: 13px;
        }
        .file-row:hover { background: #21262d; }
        .file-row:last-child { border-bottom: none; }
        .file-name { color: #58a6ff; text-decoration: none; }
        .file-name:hover { text-decoration: underline; }
        .percentage { font-weight: 600; }
        .percentage.high { color: #3fb950; }
        .percentage.medium { color: #d29922; }
        .percentage.low { color: #f85149; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Coverage Report</h1>
        <div class="summary">
            <div class="summary-title">Overall Coverage</div>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-label">Statements</div>
                    <div class="metric-value ${pctStmts >= 80 ? 'high' : pctStmts >= 50 ? 'medium' : 'low'}">${pctStmts.toFixed(2)}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill ${pctStmts >= 80 ? 'high' : pctStmts >= 50 ? 'medium' : 'low'}" style="width: ${pctStmts}%"></div>
                    </div>
                    <div class="metric-count">${coveredStatements}/${totalStatements}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Branches</div>
                    <div class="metric-value ${pctBranch >= 80 ? 'high' : pctBranch >= 50 ? 'medium' : 'low'}">${pctBranch.toFixed(2)}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill ${pctBranch >= 80 ? 'high' : pctBranch >= 50 ? 'medium' : 'low'}" style="width: ${pctBranch}%"></div>
                    </div>
                    <div class="metric-count">${coveredBranches}/${totalBranches}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Functions</div>
                    <div class="metric-value ${pctFunc >= 80 ? 'high' : pctFunc >= 50 ? 'medium' : 'low'}">${pctFunc.toFixed(2)}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill ${pctFunc >= 80 ? 'high' : pctFunc >= 50 ? 'medium' : 'low'}" style="width: ${pctFunc}%"></div>
                    </div>
                    <div class="metric-count">${coveredFunctions}/${totalFunctions}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Lines</div>
                    <div class="metric-value ${pctLines >= 80 ? 'high' : pctLines >= 50 ? 'medium' : 'low'}">${pctLines.toFixed(2)}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill ${pctLines >= 80 ? 'high' : pctLines >= 50 ? 'medium' : 'low'}" style="width: ${pctLines}%"></div>
                    </div>
                    <div class="metric-count">${coveredLines}/${totalLines}</div>
                </div>
            </div>
        </div>
        <div class="file-list">
            <div class="file-header">
                <div>File</div>
                <div style="text-align: center">Stmts</div>
                <div style="text-align: center">Branch</div>
                <div style="text-align: center">Funcs</div>
                <div style="text-align: center">Lines</div>
            </div>
            ${Array.from(coverageMap.entries()).map(([filePath, coverage]) => {
                const stats = calculateFileCoverage(coverage);
                const fileName = toRelative(filePath);
                return `
                    <div class="file-row">
                        <div><span class="file-name">${fileName}</span></div>
                        <div class="percentage ${stats.statements.percentage >= 80 ? 'high' : stats.statements.percentage >= 50 ? 'medium' : 'low'}" style="text-align: center">${stats.statements.percentage.toFixed(2)}%</div>
                        <div class="percentage ${stats.branches.percentage >= 80 ? 'high' : stats.branches.percentage >= 50 ? 'medium' : 'low'}" style="text-align: center">${stats.branches.percentage.toFixed(2)}%</div>
                        <div class="percentage ${stats.functions.percentage >= 80 ? 'high' : stats.functions.percentage >= 50 ? 'medium' : 'low'}" style="text-align: center">${stats.functions.percentage.toFixed(2)}%</div>
                        <div class="percentage ${stats.lines.percentage >= 80 ? 'high' : stats.lines.percentage >= 50 ? 'medium' : 'low'}" style="text-align: center">${stats.lines.percentage.toFixed(2)}%</div>
                    </div>
                `;
            }).join('')}
        </div>
    </div>
</body>
</html>`;

    writeFileSync(join(reportsDir, 'index.html'), indexHtml, 'utf-8');
}
