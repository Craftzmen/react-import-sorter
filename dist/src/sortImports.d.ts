export type SortImportsOptions = {
    frameworkPriority?: string[];
};
export declare function sortImports(code: string, options?: SortImportsOptions): string;
