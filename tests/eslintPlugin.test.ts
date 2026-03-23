import { describe, expect, it } from 'vitest';
import { RuleTester } from 'eslint';
import { reactImportSorterESLintPlugin } from '../src/eslintPlugin';

const ruleTester = new RuleTester({
parserOptions: {
sourceType: 'module',
ecmaVersion: 2022,
},
});

describe('eslint plugin', () => {
it('has correct rule metadata', () => {
const rule = reactImportSorterESLintPlugin.rules['sort-imports'];

expect(rule).toBeDefined();
expect(rule.meta).toBeDefined();
expect(rule.meta?.type).toBe('layout');
expect(rule.meta?.docs?.description).toContain('sorted');
expect(rule.meta?.fixable).toBe('code');
expect(rule.meta?.messages).toHaveProperty('unsorted');
expect(rule.meta?.schema).toBeDefined();
});

it('reports unsorted imports and applies fixer to produce correct order', () => {
const rule = reactImportSorterESLintPlugin.rules['sort-imports'];

ruleTester.run('sort-imports', rule, {
valid: [
// Already sorted: react first, then third-party
{
code: [
"import React from 'react';",
"import { useState } from 'react';",
'',
"import axios from 'axios';",
'',
'export const x = 1;',
].join('\n'),
},
],
invalid: [
{
// axios before react: should be flagged and fixed
code: [
"import axios from 'axios';",
"import React from 'react';",
'',
'export const x = 1;',
].join('\n'),
errors: [{ messageId: 'unsorted' }],
// After fix: react (framework) comes before axios (third-party)
output: [
"import React from 'react';",
'',
"import axios from 'axios';",
'',
'export const x = 1;',
].join('\n'),
},
],
});
});

it('fixer preserves all import groups including those separated by blank lines', () => {
const rule = reactImportSorterESLintPlugin.rules['sort-imports'];

ruleTester.run('sort-imports-multi-group', rule, {
valid: [],
invalid: [
{
// axios before react+useState: sorter puts react first with blank line before axios
code: [
"import axios from 'axios';",
"import React from 'react';",
"import { useState } from 'react';",
'',
'const App = () => null;',
].join('\n'),
errors: [{ messageId: 'unsorted' }],
// After fix: react+useState first group, then axios second group
output: [
"import React from 'react';",
"import { useState } from 'react';",
'',
"import axios from 'axios';",
'',
'const App = () => null;',
].join('\n'),
},
],
});
});
});
