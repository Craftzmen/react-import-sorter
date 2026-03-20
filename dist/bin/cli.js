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
for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
        console.log('Usage: react-import-sorter <file> [--framework-priority=next,react]');
        process.exit(0);
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
const output = (0, src_1.sortImports)(code, { frameworkPriority });
fs_1.default.writeFileSync(absPath, output);
console.log("Imports Sorted!");
