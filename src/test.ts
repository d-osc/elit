/**
 * Jest-compatible Test Runner powered by esbuild
 *
 * Main entry point for running tests with Jest-like API.
 */

import { readdirSync } from './fs';
import { join, relative } from './path';
import { runTests, setupGlobals, clearGlobals } from './test-runtime';
import { TestReporter, DotReporter, JsonReporter, VerboseReporter } from './test-reporter';

export interface TestOptions {
    files?: string[];
    include?: string[];
    exclude?: string[];
    reporter?: 'default' | 'dot' | 'json' | 'verbose';
    timeout?: number;
    bail?: boolean;
    watch?: boolean;
    colors?: boolean;
    globals?: boolean;
    describePattern?: string;
    testPattern?: string;
    coverage?: {
        enabled: boolean;
        provider: 'v8' | 'istanbul';
        reporter?: ('text' | 'html' | 'lcov' | 'json')[];
        include?: string[];
        exclude?: string[];
    };
}

/**
 * Convert glob pattern to regex
 */
function globToRegex(pattern: string): RegExp {
    // Handle brace expansion: {ts,js} -> (ts|js)
    let expanded = pattern;
    const braceMatch = pattern.match(/\{([^}]+)\}/);
    if (braceMatch) {
        const options = braceMatch[1].split(',');
        expanded = pattern.replace(/\{[^}]+\}/, `(${options.join('|')})`);
    }

    // Convert to regex
    const regexStr = '^' + expanded
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');

    return new RegExp(regexStr);
}

/**
 * Check if a file path matches a pattern
 */
function matchesPattern(relativePath: string, pattern: string): boolean {
    // Handle brace expansion: {test,spec} or {ts,js,tsx,etc}
    const braceMatch = pattern.match(/\{([^}]+)\}/);

    if (braceMatch && braceMatch.index !== undefined) {
        // Expand braces to multiple patterns
        const options = braceMatch[1].split(',');

        // Try each option
        for (const option of options) {
            const testPattern = pattern.replace(/\{[^}]+\}/, option);
            if (matchesPattern(relativePath, testPattern)) {
                return true;
            }
        }
        return false;
    }

    // Simple glob to regex conversion
    const regex = globToRegex(pattern);
    return regex.test(relativePath);
}

/**
 * Find all test files matching patterns
 */
function findTestFiles(
    root: string,
    include: string[],
    exclude: string[]
): string[] {
    const files: string[] = [];

    // Normalize path to use forward slashes for pattern matching
    // This ensures cross-platform compatibility
    function normalizePathForPattern(path: string): string {
        return path.replace(/\\/g, '/');
    }

    function scanDir(dir: string) {
        try {
            const entries = readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                if (typeof entry === 'string') continue;

                const fullPath = join(dir, entry.name);

                if (entry.isDirectory()) {
                    // Check if directory should be excluded
                    const relativePath = normalizePathForPattern(relative(root, fullPath));
                    if (exclude.some(pattern => matchesPattern(relativePath, pattern))) {
                        continue;
                    }
                    scanDir(fullPath);
                } else if (entry.isFile()) {
                    // Check if file matches include patterns
                    const relativePath = normalizePathForPattern(relative(root, fullPath));
                    for (const pattern of include) {
                        if (matchesPattern(relativePath, pattern)) {
                            files.push(fullPath);
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            // Ignore permission errors
        }
    }

    scanDir(root);
    return files;
}

/**
 * Run tests with Jest-compatible interface
 */
export async function runJestTests(options: TestOptions = {}) {
    const {
        include = ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude = ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.elit-tests-temp/**'],
        reporter = 'default',
        timeout = 5000,
        bail = false,
        globals = true,
    } = options;

    const root = process.cwd();
    const files = options.files || findTestFiles(root, include, exclude);

    if (files.length === 0) {
        console.log('\n No test files found\n');
        return {
            success: true,
            passed: 0,
            failed: 0,
            total: 0,
        };
    }

    // Setup globals if enabled
    if (globals) {
        setupGlobals();
    }

    // Create reporter
    let testReporter;
    switch (reporter) {
        case 'dot':
            testReporter = new DotReporter();
            break;
        case 'json':
            testReporter = new JsonReporter();
            break;
        case 'verbose':
            testReporter = new VerboseReporter();
            break;
        default:
            testReporter = new TestReporter({ colors: true });
    }

    // Notify start
    if ('onRunStart' in testReporter) {
        testReporter.onRunStart(files);
    }

    // Run tests
    const results = await runTests({
        files,
        timeout,
        bail,
        describePattern: options.describePattern,
        testPattern: options.testPattern,
    });
    // Notify individual test results
    if ('onTestResult' in testReporter) {
        for (const result of results.results) {
            testReporter.onTestResult(result);
        }
    }

    // Notify end
    if ('onRunEnd' in testReporter) {
        testReporter.onRunEnd(results.results);
    }

    // Clear globals
    if (globals) {
        clearGlobals();
    }

    // Generate coverage if enabled
    if (options.coverage?.enabled) {
        await generateCoverage(options.coverage);
    }

    return {
        success: results.failed === 0,
        passed: results.passed,
        failed: results.failed,
        total: results.passed + results.failed + results.skipped + results.todo,
    };
}

/**
 * Generate coverage report
 */
async function generateCoverage(options: {
    provider: 'v8' | 'istanbul';
    reporter?: ('text' | 'html' | 'lcov' | 'json')[];
    include?: string[];
    exclude?: string[];
}) {
    const { processCoverage, generateTextReport, generateHtmlReport } = await import('./coverage');

    const coverageMap = await processCoverage({
        reportsDirectory: './coverage',
        include: options.include || ['**/*.ts', '**/*.js'],
        exclude: options.exclude || ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
        reporter: options.reporter || ['text', 'html'],
    });

    const reporters = options.reporter || ['text', 'html'];
    if (reporters.includes('text')) {
        console.log('\n' + generateTextReport(coverageMap));
    }

    if (reporters.includes('html')) {
        generateHtmlReport(coverageMap, './coverage');
        console.log(`\n Coverage report: coverage/index.html\n`);
    }
}

// ============================================================================
// Watch Mode
// ============================================================================

export async function runWatchMode(options: TestOptions = {}) {
    const chokidar = await import('chokidar');

    console.log('\n � watch mode - files will be re-run on change\n');

    let isRunning = false;
    let needsRerun = false;

    const runTests = async () => {
        if (isRunning) {
            needsRerun = true;
            return;
        }

        isRunning = true;
        needsRerun = false;

        console.clear();
        await runJestTests(options);

        isRunning = false;

        if (needsRerun) {
            await runTests();
        }
    };

    // Initial run
    await runTests();

    const { include, exclude } = options;
    const watchPatterns = include || ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'];
    const ignoredPatterns = exclude || ['**/node_modules/**', '**/dist/**', '**/coverage/**'];

    const watcher = chokidar.default.watch(watchPatterns, {
        ignored: ignoredPatterns,
        persistent: true,
    });

    watcher.on('change', async (path) => {
        console.log(`\n 📄 ${path} changed\n`);
        await runTests();
    });

    watcher.on('add', async (path) => {
        console.log(`\n 📄 ${path} added\n`);
        await runTests();
    });
}
