import type { Plugin, Parser, RequiredOptions } from "prettier";
import { sortImportsResult } from "./sortImports";

const babelPlugin = require("prettier/plugins/babel");
const typescriptPlugin = require("prettier/plugins/typescript");

type PrettierOptionsWithSorter = RequiredOptions & {
  importSorterFrameworkPriority?: string;
  importSorterThrowOnParseError?: boolean;
};

function parseFrameworkPriority(value: unknown): string[] | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : undefined;
}

function preprocessWithImportSorter(
  text: string,
  options: PrettierOptionsWithSorter,
  fallbackPreprocess?: (text: string, options: PrettierOptionsWithSorter) => string
): string {
  const preprocessed = fallbackPreprocess ? fallbackPreprocess(text, options) : text;
  const frameworkPriority = parseFrameworkPriority(options.importSorterFrameworkPriority);

  const result = sortImportsResult(preprocessed, {
    frameworkPriority,
    throwOnParseError: Boolean(options.importSorterThrowOnParseError),
  });

  return result.code;
}

function wrapParser(baseParser: Parser): Parser {
  const fallbackPreprocess = baseParser.preprocess as
    | ((text: string, options: PrettierOptionsWithSorter) => string)
    | undefined;

  return {
    ...baseParser,
    preprocess(text: string, options: PrettierOptionsWithSorter) {
      return preprocessWithImportSorter(text, options, fallbackPreprocess);
    },
  };
}

const parsers: Record<string, Parser> = {
  babel: wrapParser(babelPlugin.parsers.babel),
  "babel-ts": wrapParser(babelPlugin.parsers["babel-ts"]),
  typescript: wrapParser(typescriptPlugin.parsers.typescript),
};

export const reactImportSorterPrettierPlugin: Plugin = {
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

export default reactImportSorterPrettierPlugin;
