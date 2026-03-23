import { describe, expect, it } from "vitest";
import prettier from "prettier";
import { reactImportSorterPrettierPlugin } from "../src/prettierPlugin";

describe("prettier plugin bridge", () => {
  it("sorts imports before prettier formatting", async () => {
    const input = [
      "import z from './z'",
      "import a from './a'",
      "",
      "export const value = 1",
    ].join("\n");

    const output = await prettier.format(input, {
      parser: "typescript",
      plugins: [reactImportSorterPrettierPlugin],
    });

    expect(output.startsWith("import a from \"./a\";\nimport z from \"./z\";")).toBe(true);
  });

  it("honors framework priority option", async () => {
    const input = [
      "import React from 'react'",
      "import { BrowserRouter } from 'react-router-dom'",
      "",
      "export const value = 1",
    ].join("\n");

    const output = await prettier.format(input, {
      parser: "typescript",
      plugins: [reactImportSorterPrettierPlugin],
      importSorterFrameworkPriority: "react-router-dom,react",
    });

    expect(
      output.startsWith(
        'import { BrowserRouter } from "react-router-dom";\nimport React from "react";'
      )
    ).toBe(true);
  });
});
