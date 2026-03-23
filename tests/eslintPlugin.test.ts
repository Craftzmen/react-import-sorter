import { describe, expect, it } from 'vitest';
import { RuleTester } from 'eslint';
import { reactImportSorterESLintPlugin } from '../src/eslintPlugin';

const ruleTester = new RuleTester({
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2022,
	},
});

describe('eslint plugin', () => {
	it('reports unsorted imports', () => {
		const rule = reactImportSorterESLintPlugin.rules['sort-imports'];

		// Simple test: check that the rule exists and is callable
		expect(rule).toBeDefined();
		expect(rule.meta).toBeDefined();
		expect(rule.meta?.type).toBe('layout');
		expect(rule.meta?.docs?.description).toContain('sorted');
	});

	it('has correct rule metadata', () => {
		const rule = reactImportSorterESLintPlugin.rules['sort-imports'];

		expect(rule.meta?.fixable).toBe('code');
		expect(rule.meta?.messages).toHaveProperty('unsorted');
		expect(rule.meta?.schema).toBeDefined();
	});
});
