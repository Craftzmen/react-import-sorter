import type { Rule } from 'eslint';
import { sortImportsResult } from './sortImports';

const rule: Rule.RuleModule = {
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
		const sourceCode = context.sourceCode || (context as any).getSourceCode?.();
		const code = sourceCode.getText();
		const options = context.options[0] || {};
		const frameworkPriority = options.frameworkPriority as string[] | undefined;

		const result = sortImportsResult(code, {
			frameworkPriority,
			throwOnParseError: false,
		});

		if (!result.changed) {
			return {};
		}

		// Find the import statements in the source
		const program = sourceCode.ast as any;
		const importNodes = program.body.filter(
			(node: any) => node.type === 'ImportDeclaration'
		);

		if (importNodes.length === 0) {
			return {};
		}

		const firstImport = importNodes[0];
		const lastImport = importNodes[importNodes.length - 1];

		return {
			Program(node: any) {
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
						const sortedLines = result.code.split('\n');

						// Find the range of imports in sorted code
						let sortedImportsText = '';
						let inImportBlock = false;
						for (let i = 0; i < sortedLines.length; i++) {
							const line = sortedLines[i];
							if (line.match(/^import /)) {
								inImportBlock = true;
								sortedImportsText += line + '\n';
							} else if (inImportBlock && line.trim() === '') {
								// Allow empty lines within the import block (e.g., between groups)
								sortedImportsText += line + '\n';
							} else if (inImportBlock) {
								// First non-import, non-empty line after imports: end of import block
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

export const reactImportSorterESLintPlugin: { rules: Record<string, Rule.RuleModule> } = {
	rules: {
		'sort-imports': rule,
	},
};

export default reactImportSorterESLintPlugin;
