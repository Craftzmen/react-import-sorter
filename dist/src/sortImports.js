"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortImportsResult = sortImportsResult;
exports.sortImports = sortImports;
const recast = __importStar(require("recast"));
const babelParser = __importStar(require("@babel/parser"));
const GROUP_ORDER = [
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
function isRelativeImport(source) {
    return /^\.{1,2}\//.test(source);
}
function isAbsoluteAliasImport(source) {
    return /^@\//.test(source);
}
function isThirdPartyImport(source) {
    return !isRelativeImport(source) && !isAbsoluteAliasImport(source);
}
function matchesPackageRoot(source, packageRoot) {
    return source === packageRoot || source.startsWith(`${packageRoot}/`);
}
function getFrameworkRank(source, frameworkPriority) {
    const index = frameworkPriority.findIndex((framework) => matchesPackageRoot(source, framework));
    return index === -1 ? frameworkPriority.length : index;
}
function getImportGroup(node) {
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
function sortImportNodes(a, b) {
    return a.source.value.localeCompare(b.source.value);
}
function sortFrameworkImports(a, b, frameworkPriority) {
    const rankA = getFrameworkRank(a.source.value, frameworkPriority);
    const rankB = getFrameworkRank(b.source.value, frameworkPriority);
    if (rankA !== rankB) {
        return rankA - rankB;
    }
    return sortImportNodes(a, b);
}
function isReactFrameworkImport(source) {
    return /^(react|react-dom|react-router|react-router-dom)(\/.*)?$/.test(source);
}
function isNextFrameworkImport(source) {
    return /^next(\/.*)?$/.test(source);
}
function resolveFrameworkPriority(options) {
    if (!options.frameworkPriority || options.frameworkPriority.length === 0) {
        return DEFAULT_FRAMEWORK_PRIORITY;
    }
    return options.frameworkPriority;
}
function buildSortedCode(code, frameworkPriority) {
    const diagnostics = [];
    const ast = recast.parse(code, {
        parser: {
            parse(source) {
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
    const imports = [];
    const rest = [];
    ast.program.body.forEach((node) => {
        if (node.type === "ImportDeclaration") {
            imports.push(node);
        }
        else {
            rest.push(node);
        }
    });
    if (imports.length === 0) {
        diagnostics.push({
            severity: "info",
            code: "NO_IMPORTS",
            message: "No import declarations found; file left unchanged.",
        });
        return {
            code,
            diagnostics,
            importCount: 0,
            groupCount: 0,
        };
    }
    const groupedImports = new Map();
    for (const importNode of imports) {
        const groupKey = getImportGroup(importNode);
        const group = groupedImports.get(groupKey) ?? [];
        group.push(importNode);
        groupedImports.set(groupKey, group);
    }
    const importBlocks = [];
    const frameworkImports = groupedImports.get("framework") ?? [];
    if (frameworkImports.length > 0) {
        const reactFrameworkImports = frameworkImports
            .filter((node) => isReactFrameworkImport(node.source.value))
            .sort((a, b) => sortFrameworkImports(a, b, frameworkPriority));
        const nextFrameworkImports = frameworkImports
            .filter((node) => isNextFrameworkImport(node.source.value))
            .sort((a, b) => sortFrameworkImports(a, b, frameworkPriority));
        const otherFrameworkImports = frameworkImports
            .filter((node) => !isReactFrameworkImport(node.source.value) &&
            !isNextFrameworkImport(node.source.value))
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
        return {
            code: restCode,
            diagnostics,
            importCount: imports.length,
            groupCount: importBlocks.length,
        };
    }
    if (!restCode) {
        return {
            code: `${importsCode}\n`,
            diagnostics,
            importCount: imports.length,
            groupCount: importBlocks.length,
        };
    }
    return {
        code: `${importsCode}\n\n${restCode}`,
        diagnostics,
        importCount: imports.length,
        groupCount: importBlocks.length,
    };
}
function sortImportsResult(code, options = {}) {
    const frameworkPriority = resolveFrameworkPriority(options);
    try {
        const sorted = buildSortedCode(code, frameworkPriority);
        return {
            code: sorted.code,
            changed: sorted.code !== code,
            diagnostics: sorted.diagnostics,
            metadata: {
                importCount: sorted.importCount,
                groupCount: sorted.groupCount,
            },
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown parsing error";
        const diagnostic = {
            severity: "error",
            code: "PARSE_ERROR",
            message,
        };
        if (options.throwOnParseError) {
            throw error;
        }
        return {
            code,
            changed: false,
            diagnostics: [diagnostic],
            metadata: {
                importCount: 0,
                groupCount: 0,
            },
        };
    }
}
function sortImports(code, options = {}) {
    return sortImportsResult(code, options).code;
}
