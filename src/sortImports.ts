import * as recast from "recast";
import * as babelParser from "@babel/parser";

type ImportDeclarationNode = {
  type: "ImportDeclaration";
  source: { value: string };
  importKind?: "type" | "value";
};

export type SortImportsOptions = {
  frameworkPriority?: string[];
};

type ImportGroup =
  | "framework"
  | "third-party"
  | "icons"
  | "internal-types"
  | "internal-api"
  | "internal-context"
  | "internal-absolute"
  | "relative"
  | "other";

const GROUP_ORDER: ImportGroup[] = [
  "framework",
  "third-party",
  "icons",
  "internal-types",
  "internal-api",
  "internal-context",
  "internal-absolute",
  "relative",
  "other",
];

const DEFAULT_FRAMEWORK_PRIORITY = [
  "react",
  "react-dom",
  "react-router",
  "react-router-dom",
  "next",
  "gatsby",
  "vue",
  "nuxt",
  "svelte",
  "solid-js",
  "@angular",
  "@remix-run",
];

const FRAMEWORK_MATCH = /^(react|react-dom|react-router|react-router-dom|next(\/.*)?|gatsby|vue|nuxt(\/.*)?|svelte|solid-js|@angular\/.*|@remix-run\/.*)$/;
const ICON_LIBRARY_MATCH = /^(lucide-react|react-icons(\/.*)?|@heroicons\/.*)$/;

function isRelativeImport(source: string): boolean {
  return /^\.{1,2}\//.test(source);
}

function isAbsoluteAliasImport(source: string): boolean {
  return /^@\//.test(source);
}

function isThirdPartyImport(source: string): boolean {
  return !isRelativeImport(source) && !isAbsoluteAliasImport(source);
}

function matchesPackageRoot(source: string, packageRoot: string): boolean {
  return source === packageRoot || source.startsWith(`${packageRoot}/`);
}

function getFrameworkRank(source: string, frameworkPriority: string[]): number {
  const index = frameworkPriority.findIndex((framework) =>
    matchesPackageRoot(source, framework)
  );

  return index === -1 ? frameworkPriority.length : index;
}

function getImportGroup(node: ImportDeclarationNode): ImportGroup {
  const source = node.source.value;

  if (FRAMEWORK_MATCH.test(source)) {
    return "framework";
  }

  if (ICON_LIBRARY_MATCH.test(source)) {
    return "icons";
  }

  if (isThirdPartyImport(source)) {
    return "third-party";
  }

  if (isAbsoluteAliasImport(source)) {
    if (node.importKind === "type" || /(^|\/)types(\/|$)/.test(source)) {
      return "internal-types";
    }

    if (/^@\/api(\/|$)/.test(source)) {
      return "internal-api";
    }

    if (/^@\/app\/contexts(\/|$)/.test(source)) {
      return "internal-context";
    }

    return "internal-absolute";
  }

  if (isRelativeImport(source)) {
    return "relative";
  }

  return "other";
}

function sortImportNodes(a: ImportDeclarationNode, b: ImportDeclarationNode): number {
  return a.source.value.localeCompare(b.source.value);
}

function sortFrameworkImports(
  a: ImportDeclarationNode,
  b: ImportDeclarationNode,
  frameworkPriority: string[]
): number {
  const rankA = getFrameworkRank(a.source.value, frameworkPriority);
  const rankB = getFrameworkRank(b.source.value, frameworkPriority);

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  return sortImportNodes(a, b);
}

function isReactFrameworkImport(source: string): boolean {
  return /^(react|react-dom|react-router|react-router-dom)(\/.*)?$/.test(source);
}

function isNextFrameworkImport(source: string): boolean {
  return /^next(\/.*)?$/.test(source);
}

export function sortImports(code: string, options: SortImportsOptions = {}) {
  const frameworkPriority =
    options.frameworkPriority && options.frameworkPriority.length > 0
      ? options.frameworkPriority
      : DEFAULT_FRAMEWORK_PRIORITY;

  const ast = recast.parse(code, {
    parser: {
      parse(source: string) {
        return babelParser.parse(source, {
          sourceType: "module",
          tokens: true,
          plugins: [
            "typescript",
            "jsx",
            "classProperties",
            "decorators-legacy",
            "dynamicImport",
          ],
        });
      },
    },
  });

  const imports: any[] = [];
  const rest: any[] = [];

  ast.program.body.forEach((node: any) => {
    if (node.type === "ImportDeclaration") {
      imports.push(node);
    } else {
      rest.push(node);
    }
  });

  const groupedImports = new Map<ImportGroup, ImportDeclarationNode[]>();

  for (const importNode of imports as ImportDeclarationNode[]) {
    const groupKey = getImportGroup(importNode);
    const group = groupedImports.get(groupKey) ?? [];
    group.push(importNode);
    groupedImports.set(groupKey, group);
  }

  const importBlocks: string[] = [];

  const frameworkImports = groupedImports.get("framework") ?? [];
  if (frameworkImports.length > 0) {
    const reactFrameworkImports = frameworkImports
      .filter((node) => isReactFrameworkImport(node.source.value))
      .sort((a, b) => sortFrameworkImports(a, b, frameworkPriority));
    const nextFrameworkImports = frameworkImports
      .filter((node) => isNextFrameworkImport(node.source.value))
      .sort((a, b) => sortFrameworkImports(a, b, frameworkPriority));
    const otherFrameworkImports = frameworkImports
      .filter(
        (node) =>
          !isReactFrameworkImport(node.source.value) &&
          !isNextFrameworkImport(node.source.value)
      )
      .sort((a, b) => sortFrameworkImports(a, b, frameworkPriority));

    [reactFrameworkImports, nextFrameworkImports, otherFrameworkImports]
      .filter((group) => group.length > 0)
      .forEach((group) => {
        importBlocks.push(group.map((node) => recast.print(node).code.trim()).join("\n"));
      });
  }

  GROUP_ORDER
    .filter((groupKey) => groupKey !== "framework")
    .forEach((groupKey) => {
      const group = groupedImports.get(groupKey);

      if (!group || group.length === 0) {
        return;
      }

      const sorted = group.sort(sortImportNodes);
      importBlocks.push(sorted.map((node) => recast.print(node).code.trim()).join("\n"));
    });

  const importsCode = importBlocks.join("\n\n");

  ast.program.body = rest;
  const restCode = recast.print(ast).code.trimStart();

  if (!importsCode) {
    return restCode;
  }

  if (!restCode) {
    return `${importsCode}\n`;
  }

  return `${importsCode}\n\n${restCode}`;
}