#!/usr/bin/env node

import fs from 'fs'
import path from "path";
import { resolveSorterConfig, sortImportsResult } from '../src';

const args = process.argv.slice(2);
let filePath: string | undefined;
let frameworkPriority: string[] | undefined;
let explicitConfigPath: string | undefined;
let checkMode = false;
let dryRun = false;
let quiet = false;

for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
        console.log('Usage: react-import-sorter <file> [--framework-priority=next,react] [--config=path] [--check] [--dry-run] [--quiet]');
        process.exit(0);
    }

    if (arg === '--check') {
        checkMode = true;
        continue;
    }

    if (arg === '--dry-run') {
        dryRun = true;
        continue;
    }

    if (arg === '--quiet') {
        quiet = true;
        continue;
    }

    if (arg.startsWith('--framework-priority=')) {
        const rawValue = arg.split('=')[1] || '';
        const parsed = rawValue
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        frameworkPriority = parsed.length > 0 ? parsed : undefined;
        continue;
    }

    if (arg.startsWith('--config=')) {
        const rawValue = arg.split('=')[1] || '';
        const trimmed = rawValue.trim();
        if (!trimmed) {
            console.error('Option --config requires a file path.');
            process.exit(1);
        }
        explicitConfigPath = trimmed;
        continue;
    }

    if (arg.startsWith('--')) {
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
    }

    if (!filePath) {
        filePath = arg;
    } else {
        console.error(`Unexpected argument: ${arg}`);
        process.exit(1);
    }
}

if (!filePath) {
    console.log("Please provide a file path");
    process.exit(1);
}

function findByBasename(rootDir: string, name: string): string[] {
    const matches: string[] = [];

    function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
                continue;
            }

            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && entry.name === name) {
                matches.push(fullPath);
            }
        }
    }

    walk(rootDir);
    return matches;
}

let absPath = path.resolve(filePath);

if (!fs.existsSync(absPath)) {
    const basename = path.basename(filePath);
    const matches = findByBasename(process.cwd(), basename);

    if (matches.length === 1) {
        absPath = matches[0];
        console.warn(`Path not found: ${filePath}. Using ${path.relative(process.cwd(), absPath)} instead.`);
    } else {
        console.error(`Could not find file: ${filePath}`);
        if (matches.length > 1) {
            console.error(`Found multiple files named ${basename}. Please pass an exact path:`);
            matches.forEach(match => {
                console.error(` - ${path.relative(process.cwd(), match)}`);
            });
        }
        process.exit(1);
    }
}

const code = fs.readFileSync(absPath, 'utf-8');

const resolvedConfig = resolveSorterConfig({
    cwd: path.dirname(absPath),
    explicitConfigPath,
});

const configErrors = resolvedConfig.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
if (configErrors.length > 0) {
    configErrors.forEach((diagnostic) => {
        console.error(`Error: ${diagnostic.message}`);
    });
    process.exit(1);
}

if (!quiet) {
    resolvedConfig.diagnostics
        .filter((diagnostic) => diagnostic.severity !== 'error')
        .forEach((diagnostic) => {
            console.warn(`Warning: ${diagnostic.message}`);
        });
}

const mergedFrameworkPriority = frameworkPriority ?? resolvedConfig.config.frameworkPriority;
const throwOnParseError = resolvedConfig.config.throwOnParseError ?? false;

const result = sortImportsResult(code, {
    frameworkPriority: mergedFrameworkPriority,
    throwOnParseError,
});

const hasErrors = result.diagnostics.some((diagnostic) => diagnostic.severity === 'error');

if (hasErrors) {
    result.diagnostics
        .filter((diagnostic) => diagnostic.severity === 'error')
        .forEach((diagnostic) => {
            console.error(`Error: ${diagnostic.message}`);
        });
    process.exit(1);
}

if (dryRun) {
    process.stdout.write(result.code);
    if (!result.code.endsWith('\n')) {
        process.stdout.write('\n');
    }
    process.exit(result.changed ? 1 : 0);
}

if (checkMode) {
    if (!quiet) {
        if (result.changed) {
            console.log(`Imports are not sorted in ${path.relative(process.cwd(), absPath)}.`);
        } else {
            console.log(`Imports already sorted in ${path.relative(process.cwd(), absPath)}.`);
        }
    }
    process.exit(result.changed ? 1 : 0);
}

if (!result.changed) {
    if (!quiet) {
        console.log('Imports already sorted.');
    }
    process.exit(0);
}

fs.writeFileSync(absPath, result.code);

if (!quiet) {
    console.log('Imports sorted!');
}
