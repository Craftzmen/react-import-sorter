import { sortImportsResult, SortImportsOptions, SortResult } from './sortImports';

/**
 * Language-specific import detection and extraction
 */

export interface LanguageParser {
  fileExtension: string;
  extractImports(content: string): { start: number; end: number; imports: string } | null;
  reconstructFile(imports: string, rest: string): string;
}

/**
 * Vue Single File Component Parser
 * Extracts script blocks and processes imports within them
 */
export class VueParser implements LanguageParser {
  fileExtension = '.vue';

  extractImports(content: string): { start: number; end: number; imports: string } | null {
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
    const importLines: string[] = [];
    const scriptLines = scriptContent.split('\n');
    let restStartIndex = 0;

    for (let i = 0; i < scriptLines.length; i++) {
      const line = scriptLines[i];
      if (line.trim().startsWith('import ')) {
        importLines.push(line);
      } else if (importLines.length > 0) {
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

  reconstructFile(imports: string, rest: string): string {
    return rest.replace(/^/, imports);
  }
}

/**
 * Svelte Component Parser
 * Extracts script blocks and processes imports within them
 */
export class SvelteParser implements LanguageParser {
  fileExtension = '.svelte';

  extractImports(content: string): { start: number; end: number; imports: string } | null {
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
    const importLines: string[] = [];
    const scriptLines = scriptContent.split('\n');
    let restStartIndex = 0;

    for (let i = 0; i < scriptLines.length; i++) {
      const line = scriptLines[i];
      if (line.trim().startsWith('import ')) {
        importLines.push(line);
      } else if (importLines.length > 0) {
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

  reconstructFile(imports: string, rest: string): string {
    return rest.replace(/^/, imports);
  }
}

/**
 * Angular Component Parser
 * Extracts TypeScript imports from component files
 */
export class AngularParser implements LanguageParser {
  fileExtension = '.ts';

  extractImports(content: string): { start: number; end: number; imports: string } | null {
    // For Angular, we just need to extract TypeScript imports
    // This is the same as regular TypeScript files
    const importLines: string[] = [];
    const lines = content.split('\n');
    let restStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('import ')) {
        importLines.push(line);
      } else if (
        importLines.length > 0 &&
        !line.trim().startsWith('import') &&
        line.trim() !== ''
      ) {
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

  reconstructFile(imports: string, rest: string): string {
    return imports + rest;
  }
}

/**
 * Get the appropriate parser for a file based on its extension
 */
export function getParserForFile(filePath: string): LanguageParser | null {
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
export function sortImportsForLanguage(
  code: string,
  filePath: string,
  options: SortImportsOptions = {}
): SortResult {
  const parser = getParserForFile(filePath);

  if (!parser) {
    // Fall back to standard TypeScript/JavaScript sorting
    return sortImportsResult(code, options);
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
  const sortResult = sortImportsResult(extracted.imports, options);

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
