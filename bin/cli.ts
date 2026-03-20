#!/usr/bin/env node

import fs from 'fs'
import path from "path";
import { sortImports } from '../src';

const args = process.argv.slice(2);
let filePath: string | undefined;
let frameworkPriority: string[] | undefined;

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

const output = sortImports(code, { frameworkPriority });

fs.writeFileSync(absPath, output);

console.log("Imports Sorted!")
