/**
 * Jest-style Test Runtime for Elit
 *
 * A modern test library powered by esbuild with Jest-compatible API.
 * Features:
 * - esbuild for fast TypeScript/JavaScript transpilation
 * - Jest-like globals (describe, it, test, expect, etc.)
 * - Built-in mocking with vi.fn()
 * - Snapshot testing
 * - Coverage with V8 provider
 */

import { transformSync } from 'esbuild';
import { readFile, readFileSync } from './fs';
import { dirname } from './path';
import { SourceMapConsumer } from 'source-map';
import type { RawSourceMap } from 'source-map';

// Export TestResult for use in reporters
export { type TestResult };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Escape special regex characters to prevent regex injection
 * This sanitizes user input before using it in RegExp constructor
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// Types
// ============================================================================

export interface TestFunction {
    (name: string, fn: () => void, timeout?: number): void;
    skip: (name: string, fn: () => void, timeout?: number) => void;
    only: (name: string, fn: () => void, timeout?: number) => void;
    todo: (name: string, fn: () => void, timeout?: number) => void;
}

export interface DescribeFunction {
    (name: string, fn: () => void): void;
    skip: (name: string, fn: () => void) => void;
    only: (name: string, fn: () => void) => void;
}

export interface MockFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    _isMock: boolean;
    _calls: Parameters<T>[];
    _results: Array<{ type: 'return' | 'throw'; value: any }>;
    _implementation: T | null;
    mockImplementation(fn: T): MockFunction<T>;
    mockReturnValue(value: ReturnType<T>): MockFunction<T>;
    mockResolvedValue(value: ReturnType<T>): MockFunction<T>;
    mockRejectedValue(value: any): MockFunction<T>;
    restore(): void;
    clear(): void;
}

export interface TestMatchers<T> {
    toBe(value: T): void;
    toEqual(value: T): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeGreaterThan(value: number): void;
    toBeLessThan(value: number): void;
    toContain(value: any): void;
    toHaveLength(length: number): void;
    toThrow(error?: any): void;
    toMatch(pattern: RegExp | string): void;
    toBeInstanceOf(classType: any): void;
    toHaveProperty(path: string | string[], value?: any): void;
    toBeCalled(): void;
    toBeCalledTimes(times: number): void;
    toBeCalledWith(...args: any[]): void;
    lastReturnedWith(value: any): void;
    // Modifiers
    not: TestMatchers<any>;
    resolves: TestMatchers<any>;
    rejects: TestMatchers<any>;
}

// ============================================================================
// AssertionError
// ============================================================================

class AssertionError extends Error {
    constructor(
        message: string,
        public filePath?: string,
        public lineNumber?: number,
        public columnNumber?: number,
        public codeSnippet?: string
    ) {
        super(message);
        this.name = 'AssertionError';
    }
}

// ============================================================================
// Test Suite State
// ============================================================================

interface TestSuite {
    name: string;
    tests: Test[];
    suites: TestSuite[];
    parent?: TestSuite;
    skip: boolean;
    only: boolean;
}

interface Test {
    name: string;
    fn: () => void | Promise<void>;
    skip: boolean;
    only: boolean;
    todo: boolean;
    timeout: number;
    suite: TestSuite;
}

interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip' | 'todo';
    duration: number;
    error?: Error;
    suite: string;
    file?: string;
    // Additional assertion error details
    lineNumber?: number;
    codeSnippet?: string;
}

// ============================================================================
// Global State
// ============================================================================

let currentSuite: TestSuite = {
    name: 'root',
    tests: [],
    suites: [],
    skip: false,
    only: false,
};

const testResults: TestResult[] = [];
let hasOnly = false;

// Track all source files that are loaded during test execution for coverage
const coveredFiles = new Set<string>();

// Filter patterns for running specific tests
let describePattern: string | undefined = undefined;
let testPattern: string | undefined = undefined;

// Current test file being processed (for reporting)
let currentTestFile: string | undefined = undefined;
// Current source map consumer for line number mapping
let currentSourceMapConsumer: SourceMapConsumer | undefined = undefined;
// Line offset due to wrapper code added before test code
let wrapperLineOffset: number = 0;

// ============================================================================
// esbuild Transpiler
// ============================================================================

export async function transpileFile(filePath: string): Promise<{ code: string; sourceMap?: RawSourceMap }> {
    const source = await readFile(filePath, 'utf-8');

    const result = transformSync(source, {
        loader: filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'ts' : 'js',
        format: 'esm',
        sourcemap: 'inline',
        target: 'es2020',
        tsconfigRaw: {
            compilerOptions: {
                jsx: 'react',
                jsxFactory: 'h',
                jsxFragmentFactory: 'Fragment',
            },
        },
    });

    // Extract source map from inline source map comment
    let sourceMap: RawSourceMap | undefined;
    const sourceMapMatch = result.code.match(/\/\/# sourceMappingURL=data:application\/json;base64,(.+)/);
    if (sourceMapMatch) {
        const base64 = sourceMapMatch[1];
        const json = Buffer.from(base64, 'base64').toString('utf-8');
        sourceMap = JSON.parse(json) as RawSourceMap;
    }

    return { code: result.code, sourceMap };
}

// ============================================================================
// Test Functions (Jest-style API)
// ============================================================================

function createTestFunction(defaultTimeout: number = 5000): TestFunction {
    const testFn = function (name: string, fn: () => void, timeout?: number) {
        const test: Test = {
            name,
            fn,
            skip: currentSuite.skip,
            only: false,
            todo: false,
            timeout: timeout ?? defaultTimeout,
            suite: currentSuite,
        };
        currentSuite.tests.push(test);
    } as TestFunction;

    testFn.skip = (name: string, fn: () => void, timeout?: number) => {
        const test: Test = {
            name,
            fn,
            skip: true,
            only: false,
            todo: false,
            timeout: timeout ?? defaultTimeout,
            suite: currentSuite,
        };
        currentSuite.tests.push(test);
    };

    testFn.only = (name: string, fn: () => void, timeout?: number) => {
        hasOnly = true;
        const test: Test = {
            name,
            fn,
            skip: false,
            only: true,
            todo: false,
            timeout: timeout ?? defaultTimeout,
            suite: currentSuite,
        };
        currentSuite.tests.push(test);
    };

    testFn.todo = (name: string, fn: () => void, timeout?: number) => {
        const test: Test = {
            name,
            fn,
            skip: false,
            only: false,
            todo: true,
            timeout: timeout ?? defaultTimeout,
            suite: currentSuite,
        };
        currentSuite.tests.push(test);
    };

    return testFn;
}

function createDescribeFunction(): DescribeFunction {
    const describeFn = function (name: string, fn: () => void) {
        const parent = currentSuite;
        const suite: TestSuite = {
            name,
            tests: [],
            suites: [],
            parent,
            skip: parent.skip,
            only: parent.only,
        };
        parent.suites.push(suite);
        currentSuite = suite;
        fn();
        currentSuite = parent;
    } as DescribeFunction;

    describeFn.skip = (name: string, fn: () => void) => {
        const parent = currentSuite;
        const suite: TestSuite = {
            name,
            tests: [],
            suites: [],
            parent,
            skip: true,
            only: false,
        };
        parent.suites.push(suite);
        currentSuite = suite;
        fn();
        currentSuite = parent;
    };

    describeFn.only = (name: string, fn: () => void) => {
        hasOnly = true;
        const parent = currentSuite;
        const suite: TestSuite = {
            name,
            tests: [],
            suites: [],
            parent,
            skip: false,
            only: true,
        };
        parent.suites.push(suite);
        currentSuite = suite;
        fn();
        currentSuite = parent;
    };

    return describeFn;
}

// ============================================================================
// Expect Implementation (Jest-style matchers)
// ============================================================================

class Expect implements TestMatchers<any> {
    private expected: any;
    private _not: TestMatchers<any> | null = null;
    private _resolves: TestMatchers<any> | null = null;
    private _rejects: TestMatchers<any> | null = null;

    constructor(private actual: any, private isNot = false, private isAsync = false) {
        // Modifiers are lazy-initialized
    }

    get not(): TestMatchers<any> {
        if (!this._not) {
            this._not = new Expect(this.actual, !this.isNot, false);
        }
        return this._not;
    }

    get resolves(): TestMatchers<any> {
        if (!this._resolves) {
            // Mark that this is an async promise that will resolve
            this._resolves = new Expect(this.actual, this.isNot, true);
        }
        return this._resolves!;
    }

    get rejects(): TestMatchers<any> {
        if (!this._rejects) {
            // Mark that this is an async promise that will reject
            this._rejects = new Expect(this.actual, this.isNot, true);
        }
        return this._rejects!;
    }

    private assertCondition(condition: boolean, message: string, showExpectedReceived: boolean = true, expectedDisplay?: string, callerStack?: string) {
        // Invert condition if using 'not' modifier
        if (this.isNot) {
            condition = !condition;
        }

        if (!condition) {
            let errorMsg = message;
            if (showExpectedReceived) {
                const expectedValue = expectedDisplay ?? this.stringify(this.expected ?? 'truthy');
                errorMsg += `\n` +
                    `  Expected: ${expectedValue}\n` +
                    `  Received: ${this.stringify(this.actual)}`;
            }

            // Use the caller's stack trace if provided, otherwise capture current stack
            const stack = callerStack || new Error().stack;
            let lineNumber: number | undefined = undefined;
            let codeSnippet: string | undefined = undefined;

            // Determine which assertion method was called from the stack trace
            // This helps us find the correct line when multiple assertions are on consecutive lines
            let assertionMethod: string | undefined = undefined;
            if (stack) {
                const assertionMatch = stack.match(/at _Expect\.(\w+)/);
                if (assertionMatch) {
                    assertionMethod = assertionMatch[1];
                }
            }

            if (stack) {
                // Parse stack trace to find line number in the dynamically executed code
                const lines = stack.split('\n');

                // Find all <anonymous>:line:column patterns in stack trace
                const stackFrames: Array<{ line: number; column: number }> = [];
                for (const line of lines) {
                    const match = line.match(/<anonymous>:([0-9]+):([0-9]+)/);
                    if (match) {
                        stackFrames.push({
                            line: parseInt(match[1], 10),
                            column: parseInt(match[2], 10)
                        });
                    }
                }

                // Use the second stack frame if available (first is the assertion method itself)
                // This gets us to where the assertion was called from
                const targetFrame = stackFrames.length > 1 ? stackFrames[1] : stackFrames[0];

                if (targetFrame && currentSourceMapConsumer) {
                    try {
                        // The source map was created before the wrapper was added, so we need to adjust
                        // The wrapper adds lines at the beginning, shifting everything down
                        const transpiledLine = targetFrame.line - wrapperLineOffset;

                        // Try exact mapping first using column number
                        const originalPosition = currentSourceMapConsumer.originalPositionFor({
                            line: transpiledLine,
                            column: targetFrame.column
                        });

                        if (originalPosition.line !== null) {
                            lineNumber = originalPosition.line;

                            // Also try to find the previous line that has a mapping
                            // Sometimes source maps point to the line after the actual code
                            // So we check the line before to see if it's an assertion
                            if (currentTestFile) {
                                try {
                                    let sourceCode = readFileSync(currentTestFile, 'utf-8');
                                    if (Buffer.isBuffer(sourceCode)) {
                                        sourceCode = sourceCode.toString('utf-8');
                                    }
                                    const sourceLines = (sourceCode as string).split('\n');

                                    // Determine the pattern to look for based on the assertion method
                                    // Use patterns that include the opening parenthesis to avoid false matches
                                    // e.g., ".toBeDefined" contains ").toBe" which would incorrectly match
                                    let targetPattern = '.toBe('; // default - include opening paren
                                    if (assertionMethod === 'toEqual') targetPattern = '.toEqual(';
                                    else if (assertionMethod === 'toStrictEqual') targetPattern = '.toStrictEqual(';
                                    else if (assertionMethod === 'toMatch') targetPattern = '.toMatch(';
                                    else if (assertionMethod === 'toContain') targetPattern = '.toContain(';
                                    else if (assertionMethod === 'toHaveLength') targetPattern = '.toHaveLength(';
                                    else if (assertionMethod === 'toBeDefined') targetPattern = '.toBeDefined(';
                                    else if (assertionMethod === 'toBeNull') targetPattern = '.toBeNull(';
                                    else if (assertionMethod === 'toBeUndefined') targetPattern = '.toBeUndefined(';
                                    else if (assertionMethod === 'toBeTruthy') targetPattern = '.toBeTruthy(';
                                    else if (assertionMethod === 'toBeFalsy') targetPattern = '.toBeFalsy(';
                                    else if (assertionMethod === 'toThrow') targetPattern = '.toThrow(';
                                    else if (assertionMethod === 'toBeGreaterThan') targetPattern = '.toBeGreaterThan(';
                                    else if (assertionMethod === 'toBeGreaterThanOrEqual') targetPattern = '.toBeGreaterThanOrEqual(';
                                    else if (assertionMethod === 'toBeLessThan') targetPattern = '.toBeLessThan(';
                                    else if (assertionMethod === 'toBeLessThanOrEqual') targetPattern = '.toBeLessThanOrEqual(';

                                    // Check if the mapped line contains the matching assertion
                                    if (lineNumber > 0 && lineNumber <= sourceLines.length) {
                                        const mappedLine = sourceLines[lineNumber - 1];
                                        const hasMatchingAssertion = mappedLine.includes(targetPattern);

                                        // If the mapped line doesn't have the matching assertion, check nearby lines
                                        if (!hasMatchingAssertion) {
                                            // Search backward up to 3 lines
                                            for (let i = 1; i <= 3; i++) {
                                                const searchLine = lineNumber - i;
                                                if (searchLine > 0 && searchLine <= sourceLines.length) {
                                                    const testLine = sourceLines[searchLine - 1];
                                                    if (testLine.includes(targetPattern)) {
                                                        lineNumber = searchLine;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } catch (e) {
                                    // Silently fail - verification is optional
                                }
                            }
                        } else {
                            // Fallback: try without column (just line)
                            const posWithoutColumn = currentSourceMapConsumer.originalPositionFor({
                                line: transpiledLine,
                                column: 0
                            });
                            if (posWithoutColumn.line !== null) {
                                lineNumber = posWithoutColumn.line;
                            } else {
                                // Last resort: search for the closest mapping near this line
                                const lineMappings: Array<{ line: number; distance: number }> = [];

                                currentSourceMapConsumer.eachMapping((mapping) => {
                                    if (mapping.originalLine !== null) {
                                        const distance = Math.abs(mapping.generatedLine - transpiledLine);
                                        lineMappings.push({
                                            line: mapping.originalLine,
                                            distance
                                        });
                                    }
                                });

                                if (lineMappings.length > 0) {
                                    lineMappings.sort((a, b) => a.distance - b.distance);
                                    lineNumber = lineMappings[0].line;
                                }
                            }
                        }
                    } catch (e) {
                        // If source map parsing fails, skip
                    }
                }

                // Extract code snippet from source file (after lineNumber is determined)
                // This is OUTSIDE the source map block so it always runs if we have file and line number
                if (currentTestFile && lineNumber) {
                    try {
                        let sourceCode = readFileSync(currentTestFile, 'utf-8');
                        // Ensure it's a string
                        if (Buffer.isBuffer(sourceCode)) {
                            sourceCode = sourceCode.toString('utf-8');
                        }
                        const sourceLines = (sourceCode as string).split('\n');

                        // Get the code line at the determined line number
                        if (lineNumber > 0 && lineNumber <= sourceLines.length) {
                            const codeLine = sourceLines[lineNumber - 1];
                            if (codeLine) {
                                codeSnippet = codeLine.trim();
                            }
                        }
                    } catch (e) {
                        // Silently fail - code snippet extraction is optional
                    }
                }
            }

            throw new AssertionError(errorMsg, currentTestFile, lineNumber, undefined, codeSnippet);
        }
    }

    private stringify(value: any): string {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'string') return `"${value}"`;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (typeof value === 'function') return 'Function';
        if (Array.isArray(value)) return `[${value.map(v => this.stringify(v)).join(', ')}]`;
        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) return '{}';
            return `{ ${keys.slice(0, 3).map(k => `${k}: ${this.stringify(value[k])}`).join(', ')}${keys.length > 3 ? '...' : ''} }`;
        }
        return String(value);
    }

    private async handleAsyncAssertion(value: any, assertion: (actual: any) => void): Promise<any> {
        try {
            const resolvedValue = await this.actual;
            // Promise resolved successfully
            if (this.isNot) {
                // For .not.rejects - we expected rejection but got resolution - this is success!
                // For .not.resolves - we expected rejection but got resolution - this is failure!
                throw new Error(`Promise resolved when it should have rejected`);
            }
            // For .resolves - this is expected, run the assertion
            assertion(resolvedValue);
            return Promise.resolve(resolvedValue); // Return a promise that resolves
        } catch (error: any) {
            // Promise rejected
            if (this.isNot) {
                // For .not.resolves - we expected rejection and got it - success!
                // For .not.rejects - we expected resolution but got rejection - failure!
                // But since we use .not, we invert the logic
                return Promise.resolve(undefined); // Successfully caught the rejection
            }
            // For .rejects (without .not) - this is expected
            // Check error message if value was provided
            if (typeof value === 'string') {
                this.assertCondition(
                    error.message?.includes(value),
                    `Expected error message to include "${value}"`
                );
            } else if (value instanceof RegExp) {
                this.assertCondition(
                    value.test(error.message),
                    `Expected error message to match ${value}`
                );
            }
            // If value is undefined (just .toThrow()), we successfully caught the rejection
            // Return a resolved promise to indicate success
            return Promise.resolve(undefined);
        }
    }

    toBe(value: any): any {
        const stack = new Error().stack;
        if (this.isAsync) {
            return this.handleAsyncAssertion(value, (actual) => {
                this.expected = value;
                this.assertCondition(actual === value, `Expected values to be strictly equal (using ===)`, false, undefined, stack);
                if (typeof actual !== typeof value) {
                    throw new Error(`Types don't match: expected ${typeof value} but got ${typeof actual}`);
                }
            });
        }

        this.expected = value;
        this.assertCondition(this.actual === value, `Expected values to be strictly equal (using ===)`, true, undefined, stack);
        if (typeof this.actual !== typeof value) {
            throw new Error(`Types don't match: expected ${typeof value} but got ${typeof this.actual}`);
        }
    }

    toEqual(value: any) {
        const stack = new Error().stack;
        this.expected = value;
        const isEqual = (a: any, b: any): boolean => {
            if (a === b) return true;
            if (a == null || b == null) return a === b;
            if (typeof a !== typeof b) return false;
            if (typeof a !== 'object') return a === b;
            if (Array.isArray(a) !== Array.isArray(b)) return false;
            if (Array.isArray(a)) {
                if (a.length !== b.length) return false;
                return a.every((item, i) => isEqual(item, b[i]));
            }
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            return keysA.every(key => isEqual(a[key], b[key]));
        };
        this.assertCondition(isEqual(this.actual, value), 'Expected values to be deeply equal', false, undefined, stack);
    }

    toBeTruthy() {
        const stack = new Error().stack;
        this.assertCondition(!!this.actual, `Expected value to be truthy`, false, undefined, stack);
    }

    toBeFalsy() {
        const stack = new Error().stack;
        this.assertCondition(!this.actual, `Expected value to be falsy`, false, undefined, stack);
    }

    toBeNull() {
        const stack = new Error().stack;
        this.assertCondition(this.actual === null, `Expected value to be null`, false, undefined, stack);
    }

    toBeUndefined() {
        const stack = new Error().stack;
        this.assertCondition(this.actual === undefined, `Expected value to be undefined`, false, undefined, stack);
    }

    toBeDefined() {
        const stack = new Error().stack;
        this.assertCondition(this.actual !== undefined, `Expected value to be defined`, false, undefined, stack);
    }

    toBeGreaterThan(value: number) {
        // Capture stack trace at assertion call site
        const stack = new Error().stack;
        this.expected = value;
        this.assertCondition(typeof this.actual === 'number' && this.actual > value,
            `Expected ${this.stringify(this.actual)} to be greater than ${value}`, true, String(value), stack);
    }

    toBeGreaterThanOrEqual(value: number) {
        const stack = new Error().stack;
        this.expected = value;
        this.assertCondition(typeof this.actual === 'number' && this.actual >= value,
            `Expected ${this.stringify(this.actual)} to be greater than or equal to ${value}`, true, `${value}`, stack);
    }

    toBeLessThan(value: number) {
        const stack = new Error().stack;
        this.expected = value;
        this.assertCondition(typeof this.actual === 'number' && this.actual < value,
            `Expected ${this.stringify(this.actual)} to be less than ${value}`, true, String(value), stack);
    }

    toBeLessThanOrEqual(value: number) {
        const stack = new Error().stack;
        this.expected = value;
        this.assertCondition(typeof this.actual === 'number' && this.actual <= value,
            `Expected ${this.stringify(this.actual)} to be less than or equal to ${value}`, true, `${value}`, stack);
    }

    toContain(value: any) {
        const stack = new Error().stack;
        this.expected = value;
        if (typeof this.actual === 'string') {
            this.assertCondition(this.actual.includes(value),
                `Expected "${this.actual}" to contain "${value}"`, false, undefined, stack);
        } else if (Array.isArray(this.actual)) {
            this.assertCondition(this.actual.some(item => this.deepEqual(item, value)),
                `Expected array to contain ${this.stringify(value)}`, false, undefined, stack);
        } else {
            throw new Error(`toContain expects string or array, got ${typeof this.actual}`);
        }
    }

    toHaveLength(length: number) {
        const stack = new Error().stack;
        this.expected = length;
        const actualLength = this.actual?.length;
        this.assertCondition(actualLength === length,
            `Expected length to be ${length}, but got ${actualLength}`, false, undefined, stack);
    }

    toThrow(error?: any): any {
        // For async promises (.resolves/.rejects), use handleAsyncAssertion
        if (this.isAsync) {
            return this.handleAsyncAssertion(error, () => {
                // For async .toThrow, we just need to check that the promise rejected
                // The actual error checking is done in handleAsyncAssertion
            });
        }

        let threw = false;
        let thrownError: any = null;
        try {
            if (typeof this.actual === 'function') {
                this.actual();
            }
        } catch (e) {
            threw = true;
            thrownError = e;
        }
        this.assertCondition(threw, `Expected function to throw an error`);
        if (error) {
            if (typeof error === 'string') {
                this.assertCondition(thrownError.message.includes(error),
                    `Expected error message to include "${error}"`);
            } else if (error instanceof RegExp) {
                this.assertCondition(error.test(thrownError.message),
                    `Expected error message to match ${error}`);
            }
        }
    }

    toMatch(pattern: RegExp | string) {
        this.expected = pattern;
        const str = String(this.actual);
        if (pattern instanceof RegExp) {
            this.assertCondition(pattern.test(str),
                `Expected "${str}" to match ${pattern}`);
        } else {
            this.assertCondition(str.includes(pattern),
                `Expected "${str}" to contain "${pattern}"`);
        }
    }

    toBeInstanceOf(classType: any) {
        this.expected = classType;
        this.assertCondition(this.actual instanceof classType,
            `Expected value to be instance of ${classType.name}`);
    }

    toHaveProperty(path: string | string[], value?: any) {
        const keys = Array.isArray(path) ? path : path.split('.');
        let obj = this.actual;
        for (const key of keys) {
            if (obj == null || !Object.hasOwnProperty.call(obj, key)) {
                throw new Error(`Expected object to have property "${path}"`);
            }
            obj = obj[key];
        }
        if (value !== undefined) {
            this.assertCondition(this.deepEqual(obj, value),
                `Expected property "${path}" to equal ${this.stringify(value)}`);
        }
    }

    // Mock function matchers
    toBeCalled() {
        this.assertCondition(this.actual._isMock && this.actual._calls.length > 0,
            `Expected mock function to have been called`);
    }

    toBeCalledTimes(times: number) {
        this.assertCondition(this.actual._isMock && this.actual._calls.length === times,
            `Expected mock to be called ${times} times, but was called ${this.actual._calls?.length || 0} times`);
    }

    toBeCalledWith(...args: any[]) {
        this.assertCondition(this.actual._isMock && this.actual._calls.some((call: any[]) =>
            this.deepEqual(call, args)), `Expected mock to be called with ${this.stringify(args)}`);
    }

    lastReturnedWith(value: any) {
        const lastResult = this.actual._results?.[this.actual._results.length - 1];
        this.assertCondition(lastResult && this.deepEqual(lastResult.value, value),
            `Expected last call to return ${this.stringify(value)}`);
    }

    private deepEqual(a: any, b: any): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }
}

function expect(actual: any): TestMatchers<any> {
    return new Expect(actual);
}

// ============================================================================
// Mock Functions (vi.fn())
// ============================================================================

function createMockFunction<T extends (...args: any[]) => any>(): MockFunction<T> {
    const mock = function (...args: Parameters<T>): ReturnType<T> {
        mock._calls.push(args);
        try {
            const result = mock._implementation ? (mock._implementation as any)(...args) : undefined as any;
            mock._results.push({ type: 'return', value: result });
            return result;
        } catch (error) {
            mock._results.push({ type: 'throw', value: error });
            throw error;
        }
    } as MockFunction<T>;

    mock._isMock = true;
    mock._calls = [];
    mock._results = [];
    mock._implementation = null as any;

    mock.mockImplementation = function(fn: T) {
        mock._implementation = fn;
        return mock;
    };

    mock.mockReturnValue = function(value: ReturnType<T>) {
        mock._implementation = (() => value) as any;
        return mock;
    };

    mock.mockResolvedValue = function(value: ReturnType<T>) {
        mock._implementation = (() => Promise.resolve(value)) as any;
        return mock;
    };

    mock.mockRejectedValue = function(value: any) {
        mock._implementation = (() => Promise.reject(value)) as any;
        return mock;
    };

    mock.restore = function() {
        mock._calls = [];
        mock._results = [];
        mock._implementation = null as any;
    };

    mock.clear = function() {
        mock._calls = [];
        mock._results = [];
    };

    return mock;
}

const vi = {
    fn: <T extends (...args: any[]) => any>() => createMockFunction<T>(),
    spyOn: (obj: any, method: string) => {
        const original = obj[method];
        const mock = createMockFunction<typeof original>();
        mock.mockImplementation(original);
        obj[method] = mock;
        mock.restore = () => {
            obj[method] = original;
        };
        return mock;
    },
    clearAllMocks: () => {
        // Clear all mock calls
    },
    restoreAllMocks: () => {
        // Restore all mocks
    },
};

// ============================================================================
// Hooks
// ============================================================================

let beforeAllHooks: Array<() => void | Promise<void>> = [];
let afterAllHooks: Array<() => void | Promise<void>> = [];
let beforeEachHooks: Array<() => void | Promise<void>> = [];
let afterEachHooks: Array<() => void | Promise<void>> = [];

const beforeAll = (fn: () => void | Promise<void>) => beforeAllHooks.push(fn);
const afterAll = (fn: () => void | Promise<void>) => afterAllHooks.push(fn);
const beforeEach = (fn: () => void | Promise<void>) => beforeEachHooks.push(fn);
const afterEach = (fn: () => void | Promise<void>) => afterEachHooks.push(fn);

// ============================================================================
// Test Runner
// ============================================================================

export async function runTests(options: {
    files: string[];
    timeout?: number;
    bail?: boolean;
    describePattern?: string;
    testPattern?: string;
}): Promise<{
    passed: number;
    failed: number;
    skipped: number;
    todo: number;
    results: TestResult[];
}> {
    const { files, timeout = 5000, bail = false, describePattern: descPattern, testPattern: tPattern } = options;

    // Set filter patterns for executeSuite to use
    describePattern = descPattern;
    testPattern = tPattern;

    // Reset state
    testResults.length = 0;
    hasOnly = false;

    for (const file of files) {
        // Set current test file for reporting
        currentTestFile = file;

        try {
            // Read the source file directly
            const source = await readFile(file, 'utf-8') as string;

            // Get the directory of the test file for resolving relative imports
            const testFileDir = dirname(file);

            // Extract imports before esbuild processing
            const importRegex = /import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g;
            const imports: Record<string, { path: string; named: string }> = {};
            let importIndex = 0;

            // Remove imports and collect them
            // Replace imports with nothing (they'll be injected back later)
            let codeWithoutImports = source.replace(importRegex, (_: string, named: string, path: string) => {
                const varName = `__import_${importIndex++}`;
                // Trim whitespace from the named import
                const trimmedNamed = named.trim();
                imports[varName] = { path, named: trimmedNamed };
                // Return a comment to mark where the import was
                return `// ${trimmedNamed} import injected later\n`;
            });

            // Transpile the code without imports using esbuild
            // We don't use esbuild's module format - we'll handle it ourselves
            const result = transformSync(codeWithoutImports, {
                loader: file.endsWith('.ts') || file.endsWith('.tsx') ? 'ts' : 'js',
                format: 'iife',
                sourcemap: 'inline',
                target: 'es2020',
                tsconfigRaw: {
                    compilerOptions: {
                        jsx: 'react',
                        jsxFactory: 'h',
                        jsxFragmentFactory: 'Fragment',
                    },
                },
            });

            let code = result.code;

            // Extract and store source map for line number mapping
            const sourceMapMatch = code.match(/\/\/# sourceMappingURL=data:application\/json;base64,(.+)/);
            if (sourceMapMatch) {
                const base64 = sourceMapMatch[1];
                const json = Buffer.from(base64, 'base64').toString('utf-8');
                const sourceMap = JSON.parse(json) as RawSourceMap;
                currentSourceMapConsumer = await new SourceMapConsumer(sourceMap);
            } else {
                currentSourceMapConsumer = undefined;
            }

            // Add import helper at the top - resolve relative paths
            // Transpile and require imported modules
            const importedValues: Record<string, any> = {};
            const importParamNames: string[] = [];
            const importAssignments: string[] = [];

            // Check if imports were extracted
            if (Object.keys(imports).length > 0) {
                for (const [, { path, named }] of Object.entries(imports)) {
                    // Resolve relative imports against the test file's directory
                    let resolvedPath = path;
                    if (path.startsWith('.')) {
                        // Use Node's path.join for proper path resolution
                        const nodePath = require('path');
                        resolvedPath = nodePath.resolve(testFileDir, path);
                    }
                    // Add .ts extension if not present
                    if (!resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.js') && !resolvedPath.endsWith('.mjs') && !resolvedPath.endsWith('.cjs')) {
                        resolvedPath += '.ts';
                    }

                    // For TypeScript files, we need to transpile them first
                    if (resolvedPath.endsWith('.ts')) {
                        try {
                            const importSource = await readFile(resolvedPath, 'utf-8') as string;
                            const transpiled = transformSync(importSource, {
                                loader: 'ts',
                                format: 'cjs',
                                target: 'es2020',
                                tsconfigRaw: {
                                    compilerOptions: {
                                        jsx: 'react',
                                        jsxFactory: 'h',
                                        jsxFragmentFactory: 'Fragment',
                                    },
                                },
                            });

                            // Create a temporary module object to capture exports
                            const moduleExports: any = {};
                            const moduleObj = { exports: moduleExports };

                            // Execute the transpiled code with proper require function
                            const fn = new Function('module', 'exports', 'require', '__filename', '__dirname', transpiled.code);
                            const requireFn = (id: string) => {
                                // For 'elit/*' imports, use the actual require
                                if (id.startsWith('elit/') || id === 'elit') {
                                    return require(id);
                                }
                                // For relative imports, recursively resolve them
                                if (id.startsWith('.')) {
                                    const nodePath = require('path');
                                    const absPath = nodePath.resolve(dirname(resolvedPath), id);
                                    // For now, just use require (could add recursion here)
                                    return require(absPath);
                                }
                                return require(id);
                            };
                            fn(moduleObj, moduleExports, requireFn, resolvedPath, dirname(resolvedPath));

                            // Track this file for coverage (only source files, not test files)
                            if (!resolvedPath.includes('.test.') && !resolvedPath.includes('.spec.')) {
                                coveredFiles.add(resolvedPath);
                            }

                            // Extract the named export
                            // esbuild CommonJS exports can be either directly on exports or on exports.default
                            let exportedValue = moduleObj.exports[named];
                            if (exportedValue === undefined && moduleObj.exports.default) {
                                exportedValue = moduleObj.exports.default[named];
                            }
                            // If still undefined, check if the exports object itself has the named property
                            if (exportedValue === undefined && typeof moduleObj.exports === 'object') {
                                exportedValue = (moduleObj.exports as any)[named];
                            }

                            // Store the imported value and create parameter/assignment for it
                            const paramKey = `__import_${Math.random().toString(36).substring(2, 11)}`;
                            importedValues[paramKey] = exportedValue;
                            importParamNames.push(paramKey);
                            importAssignments.push(`const ${named} = ${paramKey};`);
                        } catch (err) {
                            // On error, store null and add error comment
                            const paramKey = `__import_${Math.random().toString(36).substring(2, 11)}`;
                            importedValues[paramKey] = null;
                            importParamNames.push(paramKey);
                            importAssignments.push(`const ${named} = ${paramKey}; /* Error importing ${resolvedPath}: ${err} */`);
                        }
                    } else {
                        // For JS files, use regular require()
                        const requiredModule = require(resolvedPath);
                        const exportedValue = requiredModule[named];
                        const paramKey = `__import_${Math.random().toString(36).substring(2, 11)}`;
                        importedValues[paramKey] = exportedValue;
                        importParamNames.push(paramKey);
                        importAssignments.push(`const ${named} = ${paramKey};`);
                    }
                }
            }

            // Now we need to extract named exports from required modules
            // Add a preamble that handles the import statements
            // Calculate the line offset from the wrapper
            let preamble = '';
            if (Object.keys(imports).length > 0) {
                // Prepend the import assignments directly to the transpiled code
                // The esbuild IIFE format creates a wrapper, so we need to inject our assignments inside it
                // Find the start of the IIFE: (() => { or var <something> = (() => {
                const iifeStartMatch = code.match(/^(\s*(?:var\s+\w+\s*=\s*)?\(\(\)\s*=>\s*\{\n)/);
                if (iifeStartMatch) {
                    // Insert our assignments after the IIFE opening
                    const iifePrefix = iifeStartMatch[1];
                    const assignments = `${importAssignments.join('\n')}\n`;
                    preamble = iifePrefix;
                    code = iifePrefix + assignments + code.slice(iifeStartMatch[1].length);
                } else {
                    // Fallback: just prepend without IIFE manipulation
                    preamble = importAssignments.join('\n') + '\n';
                    code = preamble + code;
                }
            }

            // Count the number of lines added by the wrapper
            // The preamble adds: "(() => {" plus import and export lines
            wrapperLineOffset = preamble.split('\n').length;

            // Execute the test code with test globals in context
            // Add the imported values as parameters to the Function
            setupGlobals();
            const allParams = ['describe', 'it', 'test', 'expect', 'beforeAll', 'afterAll', 'beforeEach', 'afterEach', 'vi', 'require', 'module', '__filename', '__dirname', ...importParamNames];
            const allArgs = [describe, it, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi, require, module, file, testFileDir, ...importParamNames.map(p => importedValues[p])];
            const fn = new Function(...allParams, code);
            await fn(...allArgs);

            // Run tests
            await executeSuite(currentSuite, timeout, bail);

            // Clean up source map consumer
            if (currentSourceMapConsumer) {
                currentSourceMapConsumer.destroy();
                currentSourceMapConsumer = undefined;
            }

            // Reset for next file
            currentSuite = {
                name: 'root',
                tests: [],
                suites: [],
                skip: false,
                only: false,
            };
            hasOnly = false;
            beforeAllHooks = [];
            afterAllHooks = [];
            beforeEachHooks = [];
            afterEachHooks = [];

        } catch (error) {
            // Clean up source map consumer on error
            if (currentSourceMapConsumer) {
                currentSourceMapConsumer.destroy();
                currentSourceMapConsumer = undefined;
            }
            console.error(`Error loading test file ${file}:`, error);
        }
    }

    const passed = testResults.filter(r => r.status === 'pass').length;
    const failed = testResults.filter(r => r.status === 'fail').length;
    const skipped = testResults.filter(r => r.status === 'skip').length;
    const todo = testResults.filter(r => r.status === 'todo').length;

    return { passed, failed, skipped, todo, results: testResults };
}

async function executeSuite(suite: TestSuite, timeout: number, bail: boolean, parentMatched: boolean = false): Promise<void> {
    // Check if this suite directly matches the describe pattern (safe from regex injection)
    let directMatch = false;
    if (describePattern) {
        const escapedPattern = escapeRegex(describePattern);
        const regex = new RegExp(escapedPattern, 'i');
        directMatch = regex.test(suite.name);
    }

    // Helper function to check if this suite or any descendant matches the describe pattern (safe from regex injection)
    function suiteOrDescendantMatches(s: TestSuite): boolean {
        if (!describePattern) return true;

        const escapedPattern = escapeRegex(describePattern);
        const regex = new RegExp(escapedPattern, 'i');
        // Check if this suite matches
        if (regex.test(s.name)) return true;

        // Check if any child suite matches
        for (const child of s.suites) {
            if (suiteOrDescendantMatches(child)) return true;
        }

        return false;
    }

    // A suite should run if:
    // 1. No pattern (all run), OR
    // 2. This suite directly matches, OR
    // 3. Parent matched and we're checking descendants, OR
    // 4. This suite or any descendant matches (for reaching into matched subtrees)
    const shouldRunSuite = !describePattern || directMatch || parentMatched || suiteOrDescendantMatches(suite);
    if (!shouldRunSuite) {
        return;
    }

    // Run child suites (they should run if we matched, to reach deeper descendants)
    if (suite.suites.length > 0) {
        for (const childSuite of suite.suites) {
            await executeSuite(childSuite, timeout, bail, parentMatched || directMatch);
        }
    }

    // Only run this suite's tests if:
    // 1. No pattern (all run), OR
    // 2. This suite directly matches, OR
    // 3. Parent matched (we're in a matched subtree), OR
    // 4. This is the root suite (empty name)
    const shouldRunTests = !describePattern || directMatch || parentMatched || suite.name === '';
    if (!shouldRunTests) {
        return;
    }

    // Run beforeAll hooks
    for (const hook of beforeAllHooks) {
        await hook();
    }

    for (const test of suite.tests) {
        // Skip tests if we have only tests and this isn't one
        if (hasOnly && !test.only && !suite.only) {
            continue;
        }

        // Check if this test matches the test name pattern (safe from regex injection)
        let testMatches = true;
        if (testPattern) {
            const escapedPattern = escapeRegex(testPattern);
            const regex = new RegExp(escapedPattern, 'i');
            testMatches = regex.test(test.name);
        }

        if (!testMatches) {
            continue;
        }

        if (test.skip || suite.skip) {
            testResults.push({
                name: test.name,
                status: 'skip',
                duration: 0,
                suite: suite.name,
                file: currentTestFile,
            });
            continue;
        }

        if (test.todo) {
            testResults.push({
                name: test.name,
                status: 'todo',
                duration: 0,
                suite: suite.name,
                file: currentTestFile,
            });
            continue;
        }

        // Run beforeEach hooks
        for (const hook of beforeEachHooks) {
            await hook();
        }

        const startTime = Date.now();
        try {
            await Promise.race([
                test.fn(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Test timed out after ${test.timeout}ms`)), test.timeout)
                ),
            ]);

            testResults.push({
                name: test.name,
                status: 'pass',
                duration: Date.now() - startTime,
                suite: suite.name,
                file: currentTestFile,
            });
        } catch (error) {
            // Extract assertion error details
            let lineNumber: number | undefined = undefined;
            let codeSnippet: string | undefined = undefined;
            if (error instanceof AssertionError) {
                lineNumber = error.lineNumber;
                codeSnippet = error.codeSnippet;
            }

            testResults.push({
                name: test.name,
                status: 'fail',
                duration: Date.now() - startTime,
                error: error as Error,
                suite: suite.name,
                file: currentTestFile,
                lineNumber,
                codeSnippet,
            });

            if (bail) {
                throw error;
            }
        }

        // Run afterEach hooks
        for (const hook of afterEachHooks) {
            await hook();
        }
    }

    // Run afterAll hooks
    for (const hook of afterAllHooks) {
        await hook();
    }
}

// ============================================================================
// Export Globals
// ============================================================================

export const globals = {
    describe: createDescribeFunction(),
    it: createTestFunction(5000),
    test: createTestFunction(5000),
    expect,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    vi,
};

export function setupGlobals() {
    (global as any).describe = globals.describe;
    (global as any).it = globals.it;
    (global as any).test = globals.test;
    (global as any).expect = globals.expect;
    (global as any).beforeAll = globals.beforeAll;
    (global as any).afterAll = globals.afterAll;
    (global as any).beforeEach = globals.beforeEach;
    (global as any).afterEach = globals.afterEach;
    (global as any).vi = globals.vi;
}

export function clearGlobals() {
    delete (global as any).describe;
    delete (global as any).it;
    delete (global as any).test;
    delete (global as any).expect;
    delete (global as any).beforeAll;
    delete (global as any).afterAll;
    delete (global as any).beforeEach;
    delete (global as any).afterEach;
    delete (global as any).vi;
}

/**
 * Get all source files that were loaded during test execution
 * Used for coverage reporting
 */
export function getCoveredFiles(): Set<string> {
    return coveredFiles;
}

/**
 * Reset covered files tracking (call before running tests)
 */
export function resetCoveredFiles(): void {
    coveredFiles.clear();
}