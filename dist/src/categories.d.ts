export type ImportCategory = {
    name: "framework" | "third-party" | "absolute" | "relative";
    match: RegExp;
};
export declare const categories: ImportCategory[];
