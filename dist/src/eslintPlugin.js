"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactImportSorterESLintPlugin = void 0;
const sortImports_1 = require("./sortImports");
const rule = {
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforce sorted React/Next imports',
            recommended: true,
        },
        fixable: 'code',
        messages: {
            unsorted: 'Imports are not sorted according to react-import-sorter rules.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    frameworkPriority: {
                        type: 'array',
                        items: { type: 'string' },
                        default: [],
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context) {
        const sourceCode = context.sourceCode || context.getSourceCode?.();
        const code = sourceCode.getText();
        const options = context.options[0] || {};
        const frameworkPriority = options.frameworkPriority;
        const result = (0, sortImports_1.sortImportsResult)(code, {
            frameworkPriority,
            throwOnParseError: false,
        });
        if (!result.changed) {
            return {};
        }
        // Find the import statements in the source
        const program = sourceCode.ast;
        const importNodes = program.body.filter((node) => node.type === 'ImportDeclaration');
        if (importNodes.length === 0) {
            return {};
        }
        const firstImport = importNodes[0];
        const lastImport = importNodes[importNodes.length - 1];
        return {
            Program(node) {
                if (importNodes.length === 0) {
                    return;
                }
                context.report({
                    node: firstImport,
                    messageId: 'unsorted',
                    fix(fixer) {
                        const start = firstImport.range[0];
                        const end = lastImport.range[1];
                        // Extract the sorted portion from result
                        const originalLines = code.split('\n');
                        const sortedLines = result.code.split('\n');
                        // Find the range of imports in sorted code
                        let sortedImportsText = '';
                        for (let i = 0; i < sortedLines.length; i++) {
                            const line = sortedLines[i];
                            if (line.match(/^import /)) {
                                sortedImportsText += line + '\n';
                            }
                            else if (sortedImportsText && line.trim() === '') {
                                // Empty line after imports
                                break;
                            }
                        }
                        return fixer.replaceTextRange([start, end], sortedImportsText.trim());
                    },
                });
            },
        };
    },
};
exports.reactImportSorterESLintPlugin = {
    rules: {
        'sort-imports': rule,
    },
};
exports.default = exports.reactImportSorterESLintPlugin;
