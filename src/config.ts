import fs from "fs";
import path from "path";
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

const CONFIG_FILENAMES = [
  ".react-import-sorter.json",
  "react-import-sorter.config.json",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function findUp(startDir: string, filenames: string[]): string | undefined {
  let currentDir = path.resolve(startDir);

  while (true) {
    for (const filename of filenames) {
      const candidate = path.join(currentDir, filename);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }

    const parent = path.dirname(currentDir);
    if (parent === currentDir) {
      return undefined;
    }
    currentDir = parent;
  }
}

function parseConfigPayload(payload: unknown, sourcePath: string): ResolvedSorterConfig {
  const diagnostics: SortDiagnostic[] = [];
  const config: SorterConfig = {};

  if (!isRecord(payload)) {
    diagnostics.push({
      severity: "warning",
      code: "INVALID_CONFIG_SHAPE",
      message: `Config in ${sourcePath} must be a JSON object.`,
    });

    return { config, diagnostics, sourcePath };
  }

  const frameworkPriority = payload.frameworkPriority;
  if (frameworkPriority !== undefined) {
    if (
      Array.isArray(frameworkPriority) &&
      frameworkPriority.every((item) => typeof item === "string" && item.trim().length > 0)
    ) {
      config.frameworkPriority = frameworkPriority.map((item) => item.trim());
    } else {
      diagnostics.push({
        severity: "warning",
        code: "INVALID_FRAMEWORK_PRIORITY",
        message: `frameworkPriority in ${sourcePath} must be a non-empty string array.`,
      });
    }
  }

  const throwOnParseError = payload.throwOnParseError;
  if (throwOnParseError !== undefined) {
    if (typeof throwOnParseError === "boolean") {
      config.throwOnParseError = throwOnParseError;
    } else {
      diagnostics.push({
        severity: "warning",
        code: "INVALID_THROW_ON_PARSE_ERROR",
        message: `throwOnParseError in ${sourcePath} must be a boolean.`,
      });
    }
  }

  return { config, diagnostics, sourcePath };
}

function resolvePackageJsonConfig(startDir: string): ResolvedSorterConfig | undefined {
  const packageJsonPath = findUp(startDir, ["package.json"]);
  if (!packageJsonPath) {
    return undefined;
  }

  try {
    const packageJson = readJsonFile(packageJsonPath);
    if (!isRecord(packageJson)) {
      return undefined;
    }

    const embeddedConfig = packageJson["reactImportSorter"] ?? packageJson["react-import-sorter"];
    if (embeddedConfig === undefined) {
      return undefined;
    }

    return parseConfigPayload(embeddedConfig, packageJsonPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      config: {},
      sourcePath: packageJsonPath,
      diagnostics: [
        {
          severity: "warning",
          code: "PACKAGE_JSON_CONFIG_READ_ERROR",
          message: `Failed to read config from ${packageJsonPath}: ${message}`,
        },
      ],
    };
  }
}

function resolveFileConfig(startDir: string): ResolvedSorterConfig | undefined {
  const configPath = findUp(startDir, CONFIG_FILENAMES);
  if (!configPath) {
    return undefined;
  }

  try {
    const payload = readJsonFile(configPath);
    return parseConfigPayload(payload, configPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      config: {},
      sourcePath: configPath,
      diagnostics: [
        {
          severity: "warning",
          code: "CONFIG_READ_ERROR",
          message: `Failed to read config from ${configPath}: ${message}`,
        },
      ],
    };
  }
}

export function resolveSorterConfig(options: ResolveConfigOptions = {}): ResolvedSorterConfig {
  const cwd = options.cwd ?? process.cwd();

  if (options.explicitConfigPath) {
    const configPath = path.resolve(cwd, options.explicitConfigPath);

    if (!fs.existsSync(configPath)) {
      return {
        config: {},
        sourcePath: configPath,
        diagnostics: [
          {
            severity: "error",
            code: "CONFIG_NOT_FOUND",
            message: `Config file not found: ${configPath}`,
          },
        ],
      };
    }

    try {
      return parseConfigPayload(readJsonFile(configPath), configPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        config: {},
        sourcePath: configPath,
        diagnostics: [
          {
            severity: "error",
            code: "CONFIG_READ_ERROR",
            message: `Failed to read config from ${configPath}: ${message}`,
          },
        ],
      };
    }
  }

  const fileConfig = resolveFileConfig(cwd);
  if (fileConfig) {
    return fileConfig;
  }

  const packageConfig = resolvePackageJsonConfig(cwd);
  if (packageConfig) {
    return packageConfig;
  }

  return {
    config: {},
    diagnostics: [],
  };
}
