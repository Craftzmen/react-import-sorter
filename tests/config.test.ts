import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveSorterConfig } from "../src/config";

const tmpDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "react-import-sorter-test-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tmpDirs.length > 0) {
    const dir = tmpDirs.pop();
    if (dir && fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("resolveSorterConfig", () => {
  it("loads .react-import-sorter.json when present", () => {
    const dir = makeTempDir();
    fs.writeFileSync(
      path.join(dir, ".react-import-sorter.json"),
      JSON.stringify({ frameworkPriority: ["next", "react"], throwOnParseError: true })
    );

    const resolved = resolveSorterConfig({ cwd: dir });

    expect(resolved.config.frameworkPriority).toEqual(["next", "react"]);
    expect(resolved.config.throwOnParseError).toBe(true);
    expect(resolved.diagnostics).toHaveLength(0);
  });

  it("loads package.json embedded config when file config is absent", () => {
    const dir = makeTempDir();
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: "tmp",
        version: "1.0.0",
        reactImportSorter: { frameworkPriority: ["react"] },
      })
    );

    const resolved = resolveSorterConfig({ cwd: dir });

    expect(resolved.config.frameworkPriority).toEqual(["react"]);
  });

  it("returns error diagnostic for missing explicit config", () => {
    const dir = makeTempDir();
    const resolved = resolveSorterConfig({
      cwd: dir,
      explicitConfigPath: "missing.json",
    });

    expect(resolved.diagnostics.some((d) => d.code === "CONFIG_NOT_FOUND")).toBe(true);
    expect(resolved.diagnostics.some((d) => d.severity === "error")).toBe(true);
  });

  it("returns warnings for invalid config shape", () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, ".react-import-sorter.json"), JSON.stringify(["invalid"]));

    const resolved = resolveSorterConfig({ cwd: dir });

    expect(resolved.diagnostics.some((d) => d.code === "INVALID_CONFIG_SHAPE")).toBe(true);
  });
});
