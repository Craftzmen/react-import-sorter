"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactImportSorterPrettierPlugin = void 0;
const sortImports_1 = require("./sortImports");
const babelPlugin = require("prettier/plugins/babel");
const typescriptPlugin = require("prettier/plugins/typescript");
function parseFrameworkPriority(value) {
    if (typeof value !== "string") {
        return undefined;
    }
    const parsed = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    return parsed.length > 0 ? parsed : undefined;
}
function preprocessWithImportSorter(text, options, fallbackPreprocess) {
    const preprocessed = fallbackPreprocess ? fallbackPreprocess(text, options) : text;
    const frameworkPriority = parseFrameworkPriority(options.importSorterFrameworkPriority);
    const result = (0, sortImports_1.sortImportsResult)(preprocessed, {
        frameworkPriority,
        throwOnParseError: Boolean(options.importSorterThrowOnParseError),
    });
    return result.code;
}
function wrapParser(baseParser) {
    const fallbackPreprocess = baseParser.preprocess;
    return {
        ...baseParser,
        preprocess(text, options) {
            return preprocessWithImportSorter(text, options, fallbackPreprocess);
        },
    };
}
const parsers = {
    babel: wrapParser(babelPlugin.parsers.babel),
    "babel-ts": wrapParser(babelPlugin.parsers["babel-ts"]),
    typescript: wrapParser(typescriptPlugin.parsers.typescript),
};
exports.reactImportSorterPrettierPlugin = {
    parsers,
    options: {
        importSorterFrameworkPriority: {
            type: "string",
            category: "Global",
            default: "",
            description: "Comma-separated framework priority for react-import-sorter (for example: next,react,react-dom).",
        },
        importSorterThrowOnParseError: {
            type: "boolean",
            category: "Global",
            default: false,
            description: "If true, throw when import sorting parser errors are encountered during preprocessing.",
        },
    },
};
exports.default = exports.reactImportSorterPrettierPlugin;
