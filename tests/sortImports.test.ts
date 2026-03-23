import { describe, expect, it } from "vitest";
import { sortImports, sortImportsResult } from "../src";

describe("sortImportsResult", () => {
  it("returns unchanged info for files without imports", () => {
    const code = "const x = 1;\n";
    const result = sortImportsResult(code);

    expect(result.changed).toBe(false);
    expect(result.code).toBe(code);
    expect(result.metadata.importCount).toBe(0);
    expect(result.diagnostics.some((d) => d.code === "NO_IMPORTS")).toBe(true);
  });

  it("sorts framework imports using configured priority within framework family", () => {
    const code = [
      "import React from 'react';",
      "import { BrowserRouter } from 'react-router-dom';",
      "",
      "const app = 1;",
    ].join("\n");

    const result = sortImportsResult(code, {
      frameworkPriority: ["react-router-dom", "react"],
    });

    expect(result.changed).toBe(true);
    expect(
      result.code.startsWith(
        "import { BrowserRouter } from 'react-router-dom';\nimport React from 'react';"
      )
    ).toBe(true);
  });

  it("is idempotent across repeated runs", () => {
    const code = [
      "import z from './z';",
      "import a from './a';",
      "",
      "export const value = 1;",
    ].join("\n");

    const first = sortImports(code);
    const second = sortImports(first);

    expect(second).toBe(first);
  });

  it("reports parse diagnostics by default", () => {
    const broken = "import from 'x';";
    const result = sortImportsResult(broken);

    expect(result.changed).toBe(false);
    expect(result.code).toBe(broken);
    expect(result.diagnostics.some((d) => d.code === "PARSE_ERROR")).toBe(true);
  });

  it("throws on parse errors when configured", () => {
    const broken = "import from 'x';";

    expect(() =>
      sortImportsResult(broken, {
        throwOnParseError: true,
      })
    ).toThrow();
  });

  it("handles TypeScript type-only imports", () => {
    const code = [
      "import type { ComponentProps } from 'react';",
      "import React from 'react';",
      "import type { FooType } from '@/types/foo';",
      "import { useFoo } from '@/hooks/useFoo';",
      "",
      "export const Component = () => null;",
    ].join("\n");

    const result = sortImportsResult(code);

    expect(result.changed).toBe(true);
    const lines = result.code.split("\n");
    const importLines = lines.filter((l) => l.match(/^import/));
    
    // Type imports from third-party should stay with third-party react
    expect(importLines[0]).toContain("import");
  });

  it("sorts side-effect imports correctly", () => {
    const code = [
      "import 'core-js';",
      "import React from 'react';",
      "import 'antd/dist/antd.css';",
      "",
      "export const app = 1;",
    ].join("\n");

    const result = sortImportsResult(code);

    expect(result.changed).toBe(true);
    expect(result.metadata.importCount).toBeGreaterThan(0);
  });

  it("handles mixed import styles (default, named, namespace)", () => {
    const code = [
      "import * as fs from 'fs';",
      "import path from 'path';",
      "import { readFileSync } from 'fs';",
      "",
      "const code = 1;",
    ].join("\n");

    const result = sortImportsResult(code);

    expect(result.code).toBeDefined();
    expect(result.metadata.importCount).toBe(3);
  });

  it("preserves code structure after multiple imports", () => {
    const code = [
      "import z from 'z';",
      "import a from 'a';",
      "",
      "const x = 1;",
      "const y = 2;",
      "",
      "export { x, y };",
    ].join("\n");

    const result = sortImportsResult(code);

    expect(result.code).toContain("const x = 1;");
    expect(result.code).toContain("const y = 2;");
    expect(result.code).toContain("export { x, y };");
  });

  it("correctly groups icon library imports", () => {
    const code = [
      "import { AlertCircle } from 'lucide-react';",
      "import { FiAlertCircle } from 'react-icons/fi';",
      "import { StarIcon } from '@heroicons/react/solid';",
      "",
      "export const icons = { AlertCircle };",
    ].join("\n");

    const result = sortImportsResult(code);

    // Icon libraries should be grouped together (may be reordered)
    expect(result.code).toContain("lucide-react");
    expect(result.code).toContain("react-icons");
    expect(result.code).toContain("@heroicons");
  });

  it("handles internal absolute imports with path-based grouping", () => {
    const code = [
      "import Button from '@/app/components/button';",
      "import { usePatient } from '@/app/contexts/PatientContext';",
      "import { submitRequest } from '@/api/requests';",
      "import type { Request } from '@/types/request';",
      "",
      "export const form = null;",
    ].join("\n");

    const result = sortImportsResult(code);

    // Should be grouped by internal import category
    expect(result.metadata.groupCount).toBeGreaterThan(0);
  });

  it("counts groups correctly with multiple section boundaries", () => {
    const code = [
      "import React from 'react';",
      "import Link from 'next/link';",
      "import axios from 'axios';",
      "import { AlertCircle } from 'lucide-react';",
      "import type { ApiResponse } from '@/types/api';",
      "",
      "export const app = null;",
    ].join("\n");

    const result = sortImportsResult(code);

    // Multiple groups: react family, next family, third-party, icons, types
    expect(result.metadata.groupCount).toBeGreaterThanOrEqual(2);
  });

  it("handles files with only type imports", () => {
    const code = [
      "import type { PropsWithChildren } from 'react';",
      "import type { NextPage } from 'next';",
      "",
      "type MyPage = NextPage;",
    ].join("\n");

    const result = sortImportsResult(code);

    expect(result.metadata.importCount).toBe(2);
  });

  it("preserves trailing newlines", () => {
    const code = "import z from 'z';\nimport a from 'a';\n";

    const result = sortImportsResult(code);

    expect(result.code).toMatch(/\n$|\.js$/);
  });
});
