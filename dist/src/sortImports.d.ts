export type SortImportsOptions = {
    frameworkPriority?: string[];
    throwOnParseError?: boolean;
};
export type SortDiagnosticSeverity = "error" | "warning" | "info";
export type SortDiagnostic = {
    severity: SortDiagnosticSeverity;
    message: string;
    code?: string;
};
export type SortResult = {
    code: string;
    changed: boolean;
    diagnostics: SortDiagnostic[];
    metadata: {
        importCount: number;
        groupCount: number;
    };
};
export declare function sortImportsResult(code: string, options?: SortImportsOptions): SortResult;
export declare function sortImports(code: string, options?: SortImportsOptions): string;
