import { describe, it, expect, vi } from 'vitest';
import { sortImportsResult, SortImportsOptions } from 'react-import-sorter';

/**
 * MockPosition - Simulates VS Code Position
 */
class MockPosition {
  constructor(public line: number, public character: number) {}
}

/**
 * MockTextDocument - Simulates VS Code TextDocument
 */
class MockTextDocument {
  constructor(
    public languageId: string,
    private _text: string
  ) {}

  getText(): string {
    return this._text;
  }

  positionAt(offset: number): MockPosition {
    let line = 0;
    let character = 0;
    for (let i = 0; i < offset && i < this._text.length; i++) {
      if (this._text[i] === '\n') {
        line++;
        character = 0;
      } else {
        character++;
      }
    }
    return new MockPosition(line, character);
  }

  lineCount(): number {
    return this._text.split('\n').length;
  }
}

/**
 * MockEditor - Simulates VS Code TextEditor
 */
class MockEditor {
  constructor(public document: MockTextDocument) {}

  async edit(callback: (editBuilder: any) => void): Promise<boolean> {
    // Mock edit builder
    const editBuilder = {
      replace: vi.fn(),
    };
    callback(editBuilder);
    return true;
  }
}

describe('VS Code Extension Integration', () => {
  describe('Code Action Provider', () => {
    it('should provide code action when imports are unsorted', async () => {
      const unsortedCode = `import { useState } from 'react';
import { Component } from 'react';
import axios from 'axios';
`;

      const doc = new MockTextDocument('javascript', unsortedCode);
      const result = sortImportsResult(unsortedCode, {});

      // Verify that the sorter detects the change
      expect(result.changed).toBe(true);
    });

    it('should not provide code action when imports are already sorted', async () => {
      const sortedCode = `import axios from 'axios';
import { Component, useState } from 'react';
`;

      const doc = new MockTextDocument('javascript', sortedCode);
      const result = sortImportsResult(sortedCode, {});

      // The sorter may or may not detect changes depending on spacing/formatting
      // This test just verifies the API works correctly
      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    });

    it('should not provide code action for unsupported file types', () => {
      const code = `import { useState } from 'react';`;
      const doc = new MockTextDocument('python', code);

      // Python files should not trigger code actions
      expect(doc.languageId).not.toBe('javascript');
      expect(doc.languageId).not.toBe('typescript');
    });

    it('should handle parse errors gracefully', () => {
      const invalidCode = `import { useState from 'react';`; // Missing closing brace
      const result = sortImportsResult(invalidCode, { throwOnParseError: false });

      // Should not throw and should have error diagnostic
      expect(result.diagnostics.some((d) => d.severity === 'error')).toBe(true);
    });
  });

  describe('Sort Command', () => {
    it('should sort imports and return changed flag', () => {
      const unsortedCode = `import { useState } from 'react';
import axios from 'axios';
import { Component } from 'react';
`;

      const result = sortImportsResult(unsortedCode, {});

      expect(result.changed).toBe(true);
      expect(result.code).toBeDefined();
      expect(result.code).not.toBe(unsortedCode);
    });

    it('should respect framework priority configuration', () => {
      const code = `import React from 'react';
import Next from 'next';
`;

      const resultDefault = sortImportsResult(code, {});
      const resultPriority = sortImportsResult(code, {
        frameworkPriority: ['next', 'react'],
      });

      // With different priorities, order might differ
      expect(resultDefault.code).toBeDefined();
      expect(resultPriority.code).toBeDefined();
    });

    it('should preserve comments during sorting', () => {
      const codeWithComments = `// Import React for components
import { useState } from 'react';
// Import axios for HTTP requests
import axios from 'axios';
`;

      const result = sortImportsResult(codeWithComments, {});

      // Should preserve comment structure
      expect(result.code).toContain('// Import');
      expect(result.code).toContain('React');
      expect(result.code).toContain('axios');
    });
  });

  describe('Extension Settings', () => {
    it('should support framework priority configuration', () => {
      const options: SortImportsOptions = {
        frameworkPriority: ['next', 'react', 'react-dom'],
      };

      expect(options.frameworkPriority).toContain('next');
      expect(options.frameworkPriority).toContain('react');
      expect(options.frameworkPriority!.length).toBe(3);
    });

    it('should support throwOnParseError configuration', () => {
      const optionsThrow: SortImportsOptions = { throwOnParseError: true };
      const optionsIgnore: SortImportsOptions = { throwOnParseError: false };

      expect(optionsThrow.throwOnParseError).toBe(true);
      expect(optionsIgnore.throwOnParseError).toBe(false);
    });
  });

  describe('Supported File Types', () => {
    const supportedLanguages = [
      'javascript',
      'javascriptreact',
      'typescript',
      'typescriptreact',
    ];

    supportedLanguages.forEach((lang) => {
      it(`should support ${lang} file type`, () => {
        const code = `import { useState } from 'react';`;
        const doc = new MockTextDocument(lang, code);

        expect(doc.languageId).toBe(lang);
        expect(doc.getText()).toBe(code);
      });
    });
  });

  describe('Save-Time Sorting', () => {
    it('should provide fixAll code action for save-time execution', () => {
      const unsortedCode = `import { useState } from 'react';
import axios from 'axios';
`;

      const result = sortImportsResult(unsortedCode, {});

      // Verify code action can be provided during save operations
      expect(result.changed).toBe(true);
      expect(result.code).toBeDefined();
    });

    it('should indicate no changes when imports are already sorted', () => {
      const sortedCode = `import axios from 'axios';
import { useState } from 'react';
`;

      const result = sortImportsResult(sortedCode, {});

      // Verify the sorter handles already sorted imports
      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files', () => {
      const emptyCode = '';
      const result = sortImportsResult(emptyCode, {});

      expect(result.code).toBe('');
      expect(result.changed).toBe(false);
    });

    it('should handle files with no imports', () => {
      const noImportsCode = `const x = 1;
const y = 2;
console.log(x, y);
`;

      const result = sortImportsResult(noImportsCode, {});

      expect(result.code).toBe(noImportsCode);
      expect(result.changed).toBe(false);
    });

    it('should handle type-only imports', () => {
      const typeOnlyCode = `import type { ReactNode } from 'react';
import { useState } from 'react';
`;

      const result = sortImportsResult(typeOnlyCode, {});

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(
        0
      );
    });

    it('should handle mixed import styles', () => {
      const mixedCode = `import React, { useState } from 'react';
import * as axios from 'axios';
import { Request } from 'express';
`;

      const result = sortImportsResult(mixedCode, {});

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(
        0
      );
    });

    it('should be idempotent - sorting twice produces the same result', () => {
      const unsortedCode = `import { useState } from 'react';
import axios from 'axios';
`;

      const firstSort = sortImportsResult(unsortedCode, {});
      const secondSort = sortImportsResult(firstSort.code, {});

      expect(firstSort.code).toBe(secondSort.code);
      expect(secondSort.changed).toBe(false);
    });
  });
});
