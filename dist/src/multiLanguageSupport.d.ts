import { SortImportsOptions, SortResult } from './sortImports';
/**
 * Language-specific import detection and extraction
 */
export interface LanguageParser {
    fileExtension: string;
    extractImports(content: string): {
        start: number;
        end: number;
        imports: string;
    } | null;
    reconstructFile(imports: string, rest: string): string;
}
/**
 * Vue Single File Component Parser
 * Extracts script blocks and processes imports within them
 */
export declare class VueParser implements LanguageParser {
    fileExtension: string;
    extractImports(content: string): {
        start: number;
        end: number;
        imports: string;
    } | null;
    reconstructFile(imports: string, rest: string): string;
}
/**
 * Svelte Component Parser
 * Extracts script blocks and processes imports within them
 */
export declare class SvelteParser implements LanguageParser {
    fileExtension: string;
    extractImports(content: string): {
        start: number;
        end: number;
        imports: string;
    } | null;
    reconstructFile(imports: string, rest: string): string;
}
/**
 * Angular Component Parser
 * Extracts TypeScript imports from component files
 */
export declare class AngularParser implements LanguageParser {
    fileExtension: string;
    extractImports(content: string): {
        start: number;
        end: number;
        imports: string;
    } | null;
    reconstructFile(imports: string, rest: string): string;
}
/**
 * Get the appropriate parser for a file based on its extension
 */
export declare function getParserForFile(filePath: string): LanguageParser | null;
/**
 * Sort imports in multi-language files
 */
export declare function sortImportsForLanguage(code: string, filePath: string, options?: SortImportsOptions): SortResult;
