import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { afterEach, describe, expect, it } from "vitest";

const tmpDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "react-import-sorter-cli-test-"));
  tmpDirs.push(dir);
  return dir;
}

function runCli(args: string[], cwd: string) {
  const cliPath = path.join(process.cwd(), "dist", "bin", "cli.js");

  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf-8",
  });
}

afterEach(() => {
  while (tmpDirs.length > 0) {
    const dir = tmpDirs.pop();
    if (dir && fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("cli", () => {
  it("returns non-zero in check mode when imports are unsorted", () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, "sample.ts");

    fs.writeFileSync(
      filePath,
      [
        "import z from './z';",
        "import a from './a';",
        "",
        "export const value = 1;",
      ].join("\n")
    );

    const result = runCli([filePath, "--check"], dir);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Imports are not sorted");
    expect(fs.readFileSync(filePath, "utf-8")).toContain("import z from './z';");
  });

  it("writes sorted output in default mode", () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, "sample.ts");

    fs.writeFileSync(
      filePath,
      [
        "import z from './z';",
        "import a from './a';",
        "",
        "export const value = 1;",
      ].join("\n")
    );

    const result = runCli([filePath], dir);

    expect(result.status).toBe(0);
    const updated = fs.readFileSync(filePath, "utf-8");
    expect(updated.startsWith("import a from './a';\nimport z from './z';")).toBe(true);
  });

  it("prints transformed output in dry-run mode without writing file", () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, "sample.ts");
    const original = [
      "import z from './z';",
      "import a from './a';",
      "",
      "export const value = 1;",
    ].join("\n");

    fs.writeFileSync(filePath, original);

    const result = runCli([filePath, "--dry-run"], dir);

    expect(result.status).toBe(1);
    expect(result.stdout.startsWith("import a from './a';\nimport z from './z';")).toBe(true);
    expect(fs.readFileSync(filePath, "utf-8")).toBe(original);
  });

  it("uses config file and allows CLI framework-priority override", () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, "sample.ts");
    const configPath = path.join(dir, ".react-import-sorter.json");

    fs.writeFileSync(
      filePath,
      [
        "import React from 'react';",
        "import { BrowserRouter } from 'react-router-dom';",
        "",
        "export const value = 1;",
      ].join("\n")
    );

    fs.writeFileSync(
      configPath,
      JSON.stringify({ frameworkPriority: ["react-router-dom", "react"] })
    );

    const withConfig = runCli([filePath, "--dry-run"], dir);
    expect(withConfig.status).toBe(1);
    expect(
      withConfig.stdout.startsWith(
        "import { BrowserRouter } from 'react-router-dom';\nimport React from 'react';"
      )
    ).toBe(true);

    const withOverride = runCli(
      [filePath, "--dry-run", "--framework-priority=react,react-router-dom"],
      dir
    );
    expect(withOverride.status).toBe(0);
    expect(
      withOverride.stdout.startsWith(
        "import React from 'react';\nimport { BrowserRouter } from 'react-router-dom';"
      )
    ).toBe(true);
  });

  it("returns error for missing explicit config path", () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, "sample.ts");

    fs.writeFileSync(filePath, "export const value = 1;\n");

    const result = runCli([filePath, "--config=./missing.json"], dir);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Config file not found");
  });
});
