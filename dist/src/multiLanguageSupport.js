"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngularParser = exports.SvelteParser = exports.VueParser = void 0;
exports.getParserForFile = getParserForFile;
exports.sortImportsForLanguage = sortImportsForLanguage;
const sortImports_1 = require("./sortImports");
/**
 * Vue Single File Component Parser
 * Extracts script blocks and processes imports within them
 */
class VueParser {
    fileExtension = '.vue';
    extractImports(content) {
        // Match <script> or <script lang="ts">
        const scriptRegex = /<script[^>]*>\n?([\s\S]*?)\n?<\/script>/;
        const match = content.match(scriptRegex);
        if (!match) {
            return null;
        }
        const scriptContent = match[1];
        const startOffset = content.indexOf(match[0]);
        const scriptStartOffset = startOffset + match[0].indexOf(scriptContent);
        // Extract imports from script content
        const importLines = [];
        const scriptLines = scriptContent.split('\n');
        let restStartIndex = 0;
        for (let i = 0; i < scriptLines.length; i++) {
            const line = scriptLines[i];
            if (line.trim().startsWith('import ')) {
                importLines.push(line);
            }
            else if (importLines.length > 0) {
                restStartIndex = i;
                break;
            }
        }
        if (importLines.length === 0) {
            return null;
        }
        const imports = importLines.join('\n') + '\n';
        return {
            start: scriptStartOffset,
            end: scriptStartOffset + imports.length,
            imports,
        };
    }
    reconstructFile(imports, rest) {
        return rest.replace(/^/, imports);
    }
}
exports.VueParser = VueParser;
/**
 * Svelte Component Parser
 * Extracts script blocks and processes imports within them
 */
class SvelteParser {
    fileExtension = '.svelte';
    extractImports(content) {
        // Match <script> or <script context="module">
        const scriptRegex = /<script[^>]*>\n?([\s\S]*?)\n?<\/script>/;
        const match = content.match(scriptRegex);
        if (!match) {
            return null;
        }
        const scriptContent = match[1];
        const startOffset = content.indexOf(match[0]);
        const scriptStartOffset = startOffset + match[0].indexOf(scriptContent);
        // Extract imports from script content
        const importLines = [];
        const scriptLines = scriptContent.split('\n');
        let restStartIndex = 0;
        for (let i = 0; i < scriptLines.length; i++) {
            const line = scriptLines[i];
            if (line.trim().startsWith('import ')) {
                importLines.push(line);
            }
            else if (importLines.length > 0) {
                restStartIndex = i;
                break;
            }
        }
        if (importLines.length === 0) {
            return null;
        }
        const imports = importLines.join('\n') + '\n';
        return {
            start: scriptStartOffset,
            end: scriptStartOffset + imports.length,
            imports,
        };
    }
    reconstructFile(imports, rest) {
        return rest.replace(/^/, imports);
    }
}
exports.SvelteParser = SvelteParser;
/**
 * Angular Component Parser
 * Extracts TypeScript imports from component files
 */
class AngularParser {
    fileExtension = '.ts';
    extractImports(content) {
        // For Angular, we just need to extract TypeScript imports
        // This is the same as regular TypeScript files
        const importLines = [];
        const lines = content.split('\n');
        let restStartIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().startsWith('import ')) {
                importLines.push(line);
            }
            else if (importLines.length > 0 &&
                !line.trim().startsWith('import') &&
                line.trim() !== '') {
                restStartIndex = i;
                break;
            }
        }
        if (importLines.length === 0) {
            return null;
        }
        const imports = importLines.join('\n') + '\n';
        const restContent = lines.slice(restStartIndex).join('\n');
        return {
            start: 0,
            end: imports.length,
            imports,
        };
    }
    reconstructFile(imports, rest) {
        return imports + rest;
    }
}
exports.AngularParser = AngularParser;
/**
 * Get the appropriate parser for a file based on its extension
 */
function getParserForFile(filePath) {
    if (filePath.endsWith('.vue')) {
        return new VueParser();
    }
    if (filePath.endsWith('.svelte')) {
        return new SvelteParser();
    }
    if (filePath.endsWith('.component.ts')) {
        return new AngularParser();
    }
    return null;
}
/**
 * Sort imports in multi-language files
 */
function sortImportsForLanguage(code, filePath, options = {}) {
    const parser = getParserForFile(filePath);
    if (!parser) {
        // Fall back to standard TypeScript/JavaScript sorting
        return (0, sortImports_1.sortImportsResult)(code, options);
    }
    const extracted = parser.extractImports(code);
    if (!extracted) {
        // No imports found, return as-is
        return {
            code,
            changed: false,
            diagnostics: [],
            metadata: { importCount: 0, groupCount: 0 },
        };
    }
    // Sort the extracted imports
    const sortResult = (0, sortImports_1.sortImportsResult)(extracted.imports, options);
    // If imports didn't change, return original code
    if (!sortResult.changed) {
        return {
            code,
            changed: false,
            diagnostics: sortResult.diagnostics,
            metadata: sortResult.metadata,
        };
    }
    // Reconstruct file with sorted imports
    const beforeImports = code.substring(0, extracted.start);
    const afterImports = code.substring(extracted.end);
    const reconstructed = beforeImports + sortResult.code + afterImports;
    return {
        code: reconstructed,
        changed: true,
        diagnostics: sortResult.diagnostics,
        metadata: sortResult.metadata,
    };
}
