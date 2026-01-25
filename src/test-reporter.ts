/**
 * Jest-style Reporters for Elit Test Framework
 *
 * Provides beautiful Jest-compatible output formats:
 * - Default reporter with colored output
 * - Dot reporter for CI/CD
 * - JSON reporter for machine parsing
 */

import type { TestResult } from './test-runtime';
import { relative } from './path';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

// ============================================================================
// Helper Functions (safe from ReDoS)
// ============================================================================

/**
 * Extract argument from function call using safe string operations
 * Example: extractArg(".toBe('value')", "toBe") returns "'value'"
 */
function extractArg(code: string, functionName: string): string | null {
    const searchStr = `.${functionName}(`;
    const startIndex = code.indexOf(searchStr);
    if (startIndex === -1) return null;

    let parenCount = 0;
    let inString = false;
    let stringChar = '';
    let argStart = startIndex + searchStr.length;

    for (let i = argStart; i < code.length; i++) {
        const char = code[i];

        if (!inString) {
            if (char === '(') parenCount++;
            else if (char === ')') {
                parenCount--;
                if (parenCount < 0) {
                    return code.slice(argStart, i);
                }
            } else if (char === '"' || char === "'" || char === '`') {
                inString = true;
                stringChar = char;
            }
        } else {
            if (char === '\\' && i + 1 < code.length) {
                i++; // Skip escaped character
            } else if (char === stringChar) {
                inString = false;
            }
        }
    }

    return null;
}

/**
 * Extract received value from error message using safe string operations
 */
function extractReceivedValue(errorMsg: string): string | null {
    const receivedIndex = errorMsg.indexOf('Received:');
    if (receivedIndex === -1) return null;

    const afterReceived = errorMsg.slice(receivedIndex + 9).trimStart();
    const newlineIndex = afterReceived.indexOf('\n');
    if (newlineIndex !== -1) {
        return afterReceived.slice(0, newlineIndex).trimEnd();
    }
    return afterReceived.trimEnd();
}

/**
 * Check if a string is quoted and extract quote and content
 * Returns null if not quoted
 */
function parseQuotedString(str: string): { quote: string; content: string } | null {
    if (str.length < 2) return null;
    const firstChar = str[0];
    const lastChar = str[str.length - 1];

    if ((firstChar === '"' || firstChar === "'" || firstChar === '`') &&
        firstChar === lastChar) {
        return {
            quote: firstChar,
            content: str.slice(1, -1)
        };
    }
    return null;
}

/**
 * Strip quotes from a string (first and last matching quotes)
 */
function stripQuotes(str: string): string {
    if (str.length < 2) return str;
    const firstChar = str[0];
    const lastChar = str[str.length - 1];

    if ((firstChar === '"' || firstChar === "'" || firstChar === '`') &&
        firstChar === lastChar) {
        return str.slice(1, -1);
    }
    return str;
}

// ============================================================================
// Default Jest-style Reporter
// ============================================================================

export interface TestReporterOptions {
    verbose?: boolean;
    colors?: boolean;
}

export class TestReporter {
    private options: TestReporterOptions;
    private startTime: number = 0;
    private currentFile: string | undefined = undefined;
    private fileTestCount: number = 0;
    private totalFiles: number = 0;

    constructor(options: TestReporterOptions = {}) {
        this.options = {
            verbose: false,
            colors: true,
            ...options,
        };
    }

    private c(color: keyof typeof colors, text: string): string {
        return this.options.colors !== false ? colors[color] + text + colors.reset : text;
    }

    onRunStart(files: string[]) {
        this.startTime = Date.now();
        this.totalFiles = files.length;
        console.log(`\n${this.c('bold', 'Test Files')}:  ${files.length}`);
        console.log(`${this.c('dim', '─'.repeat(50))}\n`);
    }

    onTestResult(result: TestResult) {
        // Format file path as relative with forward slashes (safe from ReDoS)
        const filePath = result.file
            ? relative(process.cwd(), result.file).split('\\').join('/')
            : undefined;

        // Print file header when file changes
        if (filePath !== this.currentFile) {
            // Print count for previous file if any tests ran
            if (this.currentFile && this.fileTestCount > 0) {
                console.log('');
            }

            this.currentFile = filePath;
            this.fileTestCount = 0;

            if (filePath) {
                console.log(`${this.c('cyan', '●')} ${this.c('bold', filePath)}`);
                console.log(`${this.c('dim', '┄'.repeat(50))}`);
            }
        }

        this.fileTestCount++;

        if (result.status === 'pass') {
            console.log(`  ${this.c('green', '✓')} ${this.c('dim', result.suite + ' > ')}${result.name} ${this.c('dim', `(${result.duration}ms)`)}`);
        } else if (result.status === 'fail') {
            console.log(`  ${this.c('red', '✕')} ${this.c('dim', result.suite + ' > ')}${result.name}`);
            if (result.error) {
                // Show file path with line number
                const filePath = result.file;
                if (filePath) {
                    // Convert to relative path from current working directory (safe from ReDoS)
                    const relativePath = relative(process.cwd(), filePath).split('\\').join('/');
                    const lineSuffix = result.lineNumber ? `:${result.lineNumber}` : '';
                    console.log(`    ${this.c('cyan', `📄 ${relativePath}${lineSuffix}`)}`);
                }

                // Format error message to highlight Expected/Received
                const lines = result.error.message.split('\n');
                for (const line of lines) {
                    if (line.includes('Expected:')) {
                        console.log(`    ${this.c('green', 'Expected:')} ${line.trim().replace('Expected:', '').trim()}`);
                    } else if (line.includes('Received:')) {
                        console.log(`    ${this.c('red', 'Received:')} ${line.trim().replace('Received:', '').trim()}`);
                    } else {
                        console.log(`    ${this.c('red', line.trim())}`);
                    }
                }

                // Show code snippet with suggestion if available
                if (result.codeSnippet) {
                    // Generate suggestion based on the error type
                    let suggestion = '';
                    const code = result.codeSnippet;

                    // Extract the actual (received) value from the error message (safe from ReDoS)
                    const errorMsg = result.error?.message || '';
                    const receivedValue = extractReceivedValue(errorMsg);

                    // Common patterns for suggestions (safe from ReDoS)
                    // Order matters: check longer patterns first to avoid false matches
                    if (code.includes('.toBeGreaterThanOrEqual(')) {
                        const currentValue = extractArg(code, 'toBeGreaterThanOrEqual');
                        if (currentValue && receivedValue) {
                            const actualValue = Number(receivedValue);
                            if (!isNaN(actualValue)) {
                                suggestion = code.replace(
                                    `.toBeGreaterThanOrEqual(${currentValue})`,
                                    `.toBeGreaterThanOrEqual(${actualValue})`
                                );
                            }
                        }
                    } else if (code.includes('.toBeGreaterThan(')) {
                        const currentValue = extractArg(code, 'toBeGreaterThan');
                        if (currentValue && receivedValue) {
                            const actualValue = Number(receivedValue);
                            if (!isNaN(actualValue)) {
                                suggestion = code.replace(
                                    `.toBeGreaterThan(${currentValue})`,
                                    `.toBeGreaterThan(${actualValue - 1})`
                                );
                            }
                        }
                    } else if (code.includes('.toBeLessThanOrEqual(')) {
                        const currentValue = extractArg(code, 'toBeLessThanOrEqual');
                        if (currentValue && receivedValue) {
                            const actualValue = Number(receivedValue);
                            if (!isNaN(actualValue)) {
                                suggestion = code.replace(
                                    `.toBeLessThanOrEqual(${currentValue})`,
                                    `.toBeLessThanOrEqual(${actualValue})`
                                );
                            }
                        }
                    } else if (code.includes('.toBeLessThan(')) {
                        const currentValue = extractArg(code, 'toBeLessThan');
                        if (currentValue && receivedValue) {
                            const actualValue = Number(receivedValue);
                            if (!isNaN(actualValue)) {
                                suggestion = code.replace(
                                    `.toBeLessThan(${currentValue})`,
                                    `.toBeLessThan(${actualValue + 1})`
                                );
                            }
                        }
                    } else if (code.includes('.toStrictEqual(')) {
                        const expectedValue = extractArg(code, 'toStrictEqual');
                        if (expectedValue && receivedValue) {
                            const quoted = parseQuotedString(expectedValue);
                            if (quoted) {
                                const strippedReceived = stripQuotes(receivedValue);
                                suggestion = code.replace(
                                    `.toStrictEqual(${expectedValue})`,
                                    `.toStrictEqual(${quoted.quote}${strippedReceived}${quoted.quote})`
                                );
                            } else {
                                suggestion = code.replace(
                                    `.toStrictEqual(${expectedValue})`,
                                    `.toStrictEqual(${receivedValue})`
                                );
                            }
                        }
                    } else if (code.includes('.toEqual(')) {
                        const expectedValue = extractArg(code, 'toEqual');
                        if (expectedValue && receivedValue) {
                            const quoted = parseQuotedString(expectedValue);
                            if (quoted) {
                                const strippedReceived = stripQuotes(receivedValue);
                                suggestion = code.replace(
                                    `.toEqual(${expectedValue})`,
                                    `.toEqual(${quoted.quote}${strippedReceived}${quoted.quote})`
                                );
                            } else {
                                suggestion = code.replace(
                                    `.toEqual(${expectedValue})`,
                                    `.toEqual(${receivedValue})`
                                );
                            }
                        }
                    } else if (code.includes('.toMatch(')) {
                        const expectedPattern = extractArg(code, 'toMatch');
                        if (expectedPattern && receivedValue) {
                            const quoted = parseQuotedString(expectedPattern);
                            if (quoted) {
                                const strippedReceived = stripQuotes(receivedValue);
                                suggestion = code.replace(
                                    `.toMatch(${expectedPattern})`,
                                    `.toMatch(${quoted.quote}${strippedReceived}${quoted.quote})`
                                );
                            }
                        }
                    } else if (code.includes('.toContain(')) {
                        const expectedValue = extractArg(code, 'toContain');
                        if (expectedValue && receivedValue) {
                            const quoted = parseQuotedString(expectedValue);
                            if (quoted) {
                                const strippedReceived = stripQuotes(receivedValue);
                                suggestion = code.replace(
                                    `.toContain(${expectedValue})`,
                                    `.toContain(${quoted.quote}${strippedReceived}${quoted.quote})`
                                );
                            } else {
                                suggestion = code.replace(
                                    `.toContain(${expectedValue})`,
                                    `.toContain(${receivedValue})`
                                );
                            }
                        }
                    } else if (code.includes('.toHaveLength(')) {
                        const expectedLength = extractArg(code, 'toHaveLength');
                        if (expectedLength && receivedValue) {
                            const actualLength = Number(receivedValue);
                            if (!isNaN(actualLength)) {
                                suggestion = code.replace(
                                    `.toHaveLength(${expectedLength})`,
                                    `.toHaveLength(${actualLength})`
                                );
                            }
                        }
                    } else if (code.includes('.toBe(')) {
                        const expectedValue = extractArg(code, 'toBe');
                        if (expectedValue) {
                            if (receivedValue) {
                                const quoted = parseQuotedString(expectedValue);
                                if (quoted) {
                                    const strippedReceived = stripQuotes(receivedValue);
                                    suggestion = code.replace(
                                        `.toBe(${expectedValue})`,
                                        `.toBe(${quoted.quote}${strippedReceived}${quoted.quote})`
                                    );
                                } else {
                                    suggestion = code.replace(
                                        `.toBe(${expectedValue})`,
                                        `.toBe(${receivedValue})`
                                    );
                                }
                            } else if (expectedValue.includes("'") || expectedValue.includes('"')) {
                                suggestion = code.replace('.toBe(', '.toEqual(');
                            }
                        }
                    } else if (code.includes('.toBeDefined()')) {
                        // Suggest removing or changing to different assertion
                        suggestion = code.replace('.toBeDefined()', '.toBeTruthy()');
                    } else if (code.includes('.toBeNull()')) {
                        // Suggest checking for undefined instead
                        suggestion = code.replace('.toBeNull()', '.toBeUndefined()');
                    } else if (code.includes('.toBeUndefined()')) {
                        // Suggest checking for null instead
                        suggestion = code.replace('.toBeUndefined()', '.toBeNull()');
                    } else if (code.includes('.toBeTruthy()')) {
                        // Suggest checking for defined instead
                        suggestion = code.replace('.toBeTruthy()', '.toBeDefined()');
                    } else if (code.includes('.toBeFalsy()')) {
                        // Suggest checking for undefined or null
                        suggestion = code.replace('.toBeFalsy()', '.toBeUndefined()');
                    }

                    console.log(`    ${this.c('dim', 'Code:')}`);
                    console.log(`    ${this.c('dim', code)}`);
                    if (suggestion && suggestion !== code) {
                        console.log(`    ${this.c('yellow', 'example →')} ${this.c('green', suggestion)}`);
                    }
                }

                if (this.options.verbose && result.error.stack) {
                    const stack = result.error.stack.split('\n').slice(1, 3).join('\n');
                    console.log(`    ${this.c('dim', stack)}`);
                }
            }
        } else if (result.status === 'skip') {
            console.log(`  ${this.c('yellow', '○')} ${this.c('dim', result.suite + ' > ')}${result.name} ${this.c('yellow', '(skipped)')}`);
        } else if (result.status === 'todo') {
            console.log(`  ${this.c('cyan', '○')} ${this.c('dim', result.suite + ' > ')}${result.name} ${this.c('cyan', '(todo)')}`);
        }
    }

    onRunEnd(results: TestResult[]) {
        const duration = Date.now() - this.startTime;
        const passed = results.filter(r => r.status === 'pass').length;
        const failed = results.filter(r => r.status === 'fail').length;
        const skipped = results.filter(r => r.status === 'skip').length;
        const total = results.length;

        // Add blank line after last file's tests
        if (this.currentFile && this.fileTestCount > 0) {
            console.log('');
        }

        console.log(`${this.c('dim', '─'.repeat(50))}`);

        // Jest-style summary
        console.log('');
        console.log(`${this.c('bold', 'Test Suites:')} ${this.c('green', `${this.totalFiles} passed`)}${this.c('dim', `, ${this.totalFiles} total`)}`);
        console.log(`${this.c('bold', 'Tests:')}       ${this.c('green', `${passed} passed`)}${failed > 0 ? `, ${this.c('red', `${failed} failed`)}` : ''}${skipped > 0 ? `, ${this.c('yellow', `${skipped} skipped`)}` : ''}${this.c('dim', `, ${total} total`)}`);
        console.log(`${this.c('bold', 'Snapshots:')}   ${this.c('dim', '0 total')}`);
        console.log(`${this.c('bold', 'Time:')}        ${this.c('dim', `${(duration / 1000).toFixed(2)}s`)}`);
        console.log('');
    }
}

// ============================================================================
// Dot Reporter (minimal output for CI)
// ============================================================================

export class DotReporter {
    private passed = 0;
    private failed = 0;
    private skipped = 0;
    private todo = 0;
    private lineLength = 0;

    onRunStart(files: string[]) {
        console.log(`\n  ${files.length} test files\n`);
    }

    onTestResult(result: TestResult) {
        const symbol = result.status === 'pass' ? '.' :
            result.status === 'fail' ? this.c('red', 'F') :
                result.status === 'skip' ? this.c('yellow', 'o') :
                    this.c('cyan', 'o');

        process.stdout.write(symbol);
        this.lineLength++;

        if (result.status === 'pass') this.passed++;
        else if (result.status === 'fail') this.failed++;
        else if (result.status === 'skip') this.skipped++;
        else if (result.status === 'todo') this.todo++;

        // Wrap every 50 characters
        if (this.lineLength >= 50) {
            process.stdout.write('\n    ');
            this.lineLength = 0;
        }
    }

    onRunEnd(_results: TestResult[]) {
        console.log(`\n\n  ${this.c('green', this.passed + ' passed')} ${this.c('dim', '·')} ${this.c('red', this.failed + ' failed')} ${this.c('dim', '·')} ${this.c('yellow', this.skipped + ' skipped')}\n`);
    }

    private c(color: keyof typeof colors, text: string): string {
        return colors[color] + text + colors.reset;
    }
}

// ============================================================================
// JSON Reporter (machine-readable)
// ============================================================================

export interface JsonTestResult {
    status: 'passed' | 'failed' | 'skipped' | 'todo';
    name: string;
    suite: string;
    duration: number;
    error?: {
        message: string;
        stack?: string;
    };
}

export interface JsonReport {
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        todo: number;
        duration: number;
    };
    tests: JsonTestResult[];
}

export class JsonReporter {
    private startTime: number = 0;
    private results: TestResult[] = [];

    onRunStart(_files: string[]) {
        this.startTime = Date.now();
        this.results = [];
    }

    onTestResult(result: TestResult) {
        this.results.push(result);
    }

    onRunEnd(results: TestResult[]) {
        const report: JsonReport = {
            summary: {
                total: results.length,
                passed: results.filter(r => r.status === 'pass').length,
                failed: results.filter(r => r.status === 'fail').length,
                skipped: results.filter(r => r.status === 'skip').length,
                todo: results.filter(r => r.status === 'todo').length,
                duration: Date.now() - this.startTime,
            },
            tests: results.map(r => ({
                status: r.status === 'pass' ? 'passed' : r.status === 'fail' ? 'failed' : r.status === 'skip' ? 'skipped' : 'todo',
                name: r.name,
                suite: r.suite,
                duration: r.duration,
                error: r.error ? {
                    message: r.error.message,
                    stack: r.error.stack,
                } : undefined,
            })),
        };

        console.log(JSON.stringify(report, null, 2));
    }
}

// ============================================================================
// Verbose Reporter (detailed output)
// ============================================================================

export class VerboseReporter {
    private currentSuite: string = '';

    onRunStart(_files: string[]) {
        console.log(`\n${colors.cyan}Running tests${colors.reset}\n`);
    }

    onTestResult(result: TestResult) {
        // Print suite name when it changes
        if (result.suite !== this.currentSuite) {
            this.currentSuite = result.suite;
            console.log(`\n${colors.dim}${result.suite}${colors.reset}`);
        }

        const icon = result.status === 'pass' ? colors.green + '  ✓' :
            result.status === 'fail' ? colors.red + '  ✕' :
                result.status === 'skip' ? colors.yellow + '  ⊘' :
                    colors.cyan + '  ○';

        console.log(`${icon}${colors.reset} ${result.name}${colors.dim} (${result.duration}ms)${colors.reset}`);

        if (result.status === 'fail' && result.error) {
            console.log(`\n${colors.red}    ${result.error.message}${colors.reset}`);
            if (result.error.stack) {
                const lines = result.error.stack.split('\n').slice(1, 4);
                lines.forEach(line => console.log(`${colors.dim}    ${line}${colors.reset}`));
            }
        }
    }

    onRunEnd(results: TestResult[]) {
        const passed = results.filter(r => r.status === 'pass').length;
        const failed = results.filter(r => r.status === 'fail').length;
        const skipped = results.filter(r => r.status === 'skip').length;

        console.log(`\n${colors.dim}${'─'.repeat(50)}${colors.reset}\n`);

        if (failed === 0) {
            console.log(`${colors.green}All tests passed!${colors.reset}`);
            console.log(`${colors.dim}${passed} tests${colors.reset}\n`);
        } else {
            console.log(`${colors.red}${failed} tests failed${colors.reset}`);
            console.log(`${colors.green}${passed} tests passed${colors.reset}`);
            if (skipped > 0) {
                console.log(`${colors.yellow}${skipped} tests skipped${colors.reset}`);
            }
            console.log('');
        }
    }
}

// ============================================================================
// Utility function to format error stacks
// ============================================================================

export function formatErrorStack(error: Error): string {
    if (!error.stack) return error.message;

    const lines = error.stack.split('\n');
    let formatted = `${error.message}\n`;

    // Skip the first line (error message) and format the rest
    for (const line of lines.slice(1, 6)) {
        formatted += `  ${line.trim()}\n`;
    }

    return formatted;
}

// ============================================================================
// Progress bar for watch mode
// ============================================================================

export function formatProgress(current: number, total: number): string {
    const percentage = Math.floor((current / total) * 100);
    const filled = Math.floor(percentage / 2);
    const empty = 50 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage}% (${current}/${total})`;
}
