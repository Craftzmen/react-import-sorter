#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const src_1 = require("../src");
const args = process.argv.slice(2);
let filePath;
let frameworkPriority;
let explicitConfigPath;
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
    }
    else {
        console.error(`Unexpected argument: ${arg}`);
        process.exit(1);
    }
}
if (!filePath) {
    console.log("Please provide a file path");
    process.exit(1);
}
function findByBasename(rootDir, name) {
    const matches = [];
    function walk(dir) {
        for (const entry of fs_1.default.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
                continue;
            }
            const fullPath = path_1.default.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            }
            else if (entry.isFile() && entry.name === name) {
                matches.push(fullPath);
            }
        }
    }
    walk(rootDir);
    return matches;
}
let absPath = path_1.default.resolve(filePath);
if (!fs_1.default.existsSync(absPath)) {
    const basename = path_1.default.basename(filePath);
    const matches = findByBasename(process.cwd(), basename);
    if (matches.length === 1) {
        absPath = matches[0];
        console.warn(`Path not found: ${filePath}. Using ${path_1.default.relative(process.cwd(), absPath)} instead.`);
    }
    else {
        console.error(`Could not find file: ${filePath}`);
        if (matches.length > 1) {
            console.error(`Found multiple files named ${basename}. Please pass an exact path:`);
            matches.forEach(match => {
                console.error(` - ${path_1.default.relative(process.cwd(), match)}`);
            });
        }
        process.exit(1);
    }
}
const code = fs_1.default.readFileSync(absPath, 'utf-8');
const resolvedConfig = (0, src_1.resolveSorterConfig)({
    cwd: path_1.default.dirname(absPath),
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
const result = (0, src_1.sortImportsResult)(code, {
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
            console.log(`Imports are not sorted in ${path_1.default.relative(process.cwd(), absPath)}.`);
        }
        else {
            console.log(`Imports already sorted in ${path_1.default.relative(process.cwd(), absPath)}.`);
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
fs_1.default.writeFileSync(absPath, result.code);
if (!quiet) {
    console.log('Imports sorted!');
}
