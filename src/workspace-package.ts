import { existsSync, readFileSync } from './fs';
import { dirname, join, resolve } from './path';

function readPackageJson(filePath: string): { name?: string } | undefined {
    try {
        const packageJsonBuffer = readFileSync(filePath, 'utf-8');
        const packageJsonText = typeof packageJsonBuffer === 'string'
            ? packageJsonBuffer
            : packageJsonBuffer.toString('utf-8');

        return JSON.parse(packageJsonText) as { name?: string };
    } catch {
        return undefined;
    }
}

export function findWorkspacePackageRoot(startDir: string, packageName: string): string | undefined {
    let currentDir = resolve(startDir);

    while (true) {
        const packageJsonPath = join(currentDir, 'package.json');
        const packageJson = existsSync(packageJsonPath)
            ? readPackageJson(packageJsonPath)
            : undefined;

        if (packageJson?.name === packageName) {
            return currentDir;
        }

        const parentDir = dirname(currentDir);
        if (parentDir === currentDir) {
            return undefined;
        }

        currentDir = parentDir;
    }
}

function findInstalledPackageRoot(startDir: string, packageName: string): string | undefined {
    let currentDir = resolve(startDir);

    while (true) {
        const candidate = join(currentDir, 'node_modules', ...packageName.split('/'));
        if (existsSync(candidate)) {
            return candidate;
        }

        const parentDir = dirname(currentDir);
        if (parentDir === currentDir) {
            return undefined;
        }

        currentDir = parentDir;
    }
}

function getWorkspacePackageImportCandidates(
    packageRoot: string,
    specifier: string,
    options: { preferBuilt?: boolean } = {},
): string[] {
    const subpath = specifier === 'elit' ? 'index' : specifier.slice('elit/'.length);

    const builtCandidates = [
        resolve(packageRoot, 'dist', `${subpath}.mjs`),
        resolve(packageRoot, 'dist', `${subpath}.js`),
        resolve(packageRoot, 'dist', `${subpath}.cjs`),
    ];
    const sourceCandidates = [
        resolve(packageRoot, 'src', `${subpath}.ts`),
        resolve(packageRoot, 'src', `${subpath}.tsx`),
    ];

    return options.preferBuilt
        ? [...builtCandidates, ...sourceCandidates]
        : [...sourceCandidates, ...builtCandidates];
}

export function resolveWorkspacePackageImport(
    specifier: string,
    startDir: string,
    options: { preferBuilt?: boolean } = {},
): string | undefined {
    if (specifier !== 'elit' && !specifier.startsWith('elit/')) {
        return undefined;
    }

    const packageRoots = [
        findWorkspacePackageRoot(startDir, 'elit'),
        findInstalledPackageRoot(startDir, 'elit'),
    ].filter((value, index, values): value is string => typeof value === 'string' && values.indexOf(value) === index);

    for (const packageRoot of packageRoots) {
        for (const candidate of getWorkspacePackageImportCandidates(packageRoot, specifier, options)) {
            if (existsSync(candidate)) {
                return candidate;
            }
        }
    }

    return undefined;
}