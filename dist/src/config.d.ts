import type { SortImportsOptions, SortDiagnostic } from "./sortImports";
export type SorterConfig = Pick<SortImportsOptions, "frameworkPriority" | "throwOnParseError">;
export type ResolvedSorterConfig = {
    config: SorterConfig;
    diagnostics: SortDiagnostic[];
    sourcePath?: string;
};
type ResolveConfigOptions = {
    cwd?: string;
    explicitConfigPath?: string;
};
export declare function resolveSorterConfig(options?: ResolveConfigOptions): ResolvedSorterConfig;
export {};
