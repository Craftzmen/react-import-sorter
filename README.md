# react-import-sorter

Opinionated import sorter for React and Next.js codebases.

This package rewrites the import section of a file into predictable, readable blocks with blank lines between groups. It is built for teams that want a consistent import style similar to isort-style grouping in Python projects.

## Why use this

- Keeps imports consistently grouped and alphabetized
- Puts framework imports first
- Separates React and Next imports into distinct blocks
- Splits icon libraries, internal API imports, context imports, and type imports into dedicated sections
- Works as a CLI and as a programmatic function

## Install

### Global

```bash
npm i -g react-import-sorter
```

### Project dependency

```bash
npm i -D react-import-sorter
```

## CLI usage

```bash
react-import-sorter <file>
```

Example:

```bash
react-import-sorter src/App.tsx
```

If the provided path does not exist but exactly one file with the same basename is found in the project, the CLI will use that file and print a warning.

## CLI options

### Customize framework priority

```bash
react-import-sorter src/App.tsx --framework-priority=next,react,react-dom
```

This controls the order used for framework imports inside framework-related groups.

You can also set this in config files instead of passing it every time.

### Load config from a specific path

```bash
react-import-sorter src/App.tsx --config=./config/react-import-sorter.json
```

The CLI merges options with this precedence:

1. Defaults
2. Project config
3. CLI flags

### Check mode (CI friendly)

```bash
react-import-sorter src/App.tsx --check
```

Exits with code `1` if imports need sorting, otherwise exits with code `0`.

### Dry run mode

```bash
react-import-sorter src/App.tsx --dry-run
```

Prints the sorted output to stdout without modifying the file.

### Quiet mode

```bash
react-import-sorter src/App.tsx --quiet
```

Suppresses non-error CLI output.

### Help

```bash
react-import-sorter --help
```

## Import grouping behavior

Imports are emitted in this high-level order:

1. Framework imports (with sub-groups)
   - React family: react, react-dom, react-router, react-router-dom
   - Next family: next and next/*
   - Other supported frameworks (gatsby, vue, nuxt, svelte, solid-js, @angular/*, @remix-run/*)
2. Third-party libraries
3. Icon libraries (lucide-react, react-icons, @heroicons/*)
4. Internal type imports (import type and paths containing /types/)
5. Internal API imports (@/api/*)
6. Internal context imports (@/app/contexts/*)
7. Other internal absolute imports (@/*)
8. Relative imports (./, ../)
9. Any remaining unmatched imports

Rules inside each group:

- Alphabetical by import source path
- One blank line between groups

## Example

Input:

```ts
import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { Download } from 'lucide-react'
import { usePatient } from '@/app/contexts/PatientContext'
import { submitPARequest } from '@/api/pa-requests'
import type { PARequestPayload } from '@/types/paRequest'
import Button from '@/app/components/button'
import LocalThing from './LocalThing'
```

Output:

```ts
import React from 'react'

import type { Metadata } from 'next'
import Link from 'next/link'

import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

import { Download } from 'lucide-react'

import type { PARequestPayload } from '@/types/paRequest'

import { submitPARequest } from '@/api/pa-requests'

import { usePatient } from '@/app/contexts/PatientContext'

import Button from '@/app/components/button'

import LocalThing from './LocalThing'
```

## Programmatic API

```ts
import { sortImports } from 'react-import-sorter'

const sorted = sortImports(sourceCode, {
  frameworkPriority: ['next', 'react', 'react-dom']
})
```

For richer integration, use the result API:

```ts
import { sortImportsResult } from 'react-import-sorter'

const result = sortImportsResult(sourceCode, {
  frameworkPriority: ['next', 'react', 'react-dom']
})

if (result.changed) {
  console.log('Imports were updated')
}

for (const diagnostic of result.diagnostics) {
  console.log(`[${diagnostic.severity}] ${diagnostic.message}`)
}
```

Type:

```ts
type SortImportsOptions = {
  frameworkPriority?: string[]
  throwOnParseError?: boolean
}

type SortResult = {
  code: string
  changed: boolean
  diagnostics: {
    severity: 'error' | 'warning' | 'info'
    message: string
    code?: string
  }[]
  metadata: {
    importCount: number
    groupCount: number
  }
}
```

## Configuration

Supported discovery locations (first match wins):

1. `.react-import-sorter.json`
2. `react-import-sorter.config.json`
3. `package.json` key: `reactImportSorter` (or `react-import-sorter`)

Example `.react-import-sorter.json`:

```json
{
  "frameworkPriority": ["next", "react", "react-dom"],
  "throwOnParseError": false
}
```

## Prettier Plugin

This package exposes a Prettier plugin bridge at `react-import-sorter/prettier-plugin`.

Install Prettier in your project:

```bash
npm i -D prettier react-import-sorter
```

Then configure Prettier:

```json
{
  "plugins": ["react-import-sorter/prettier-plugin"],
  "importSorterFrameworkPriority": "next,react,react-dom",
  "importSorterThrowOnParseError": false
}
```

Supported plugin options:

1. `importSorterFrameworkPriority`: comma-separated framework priority.
2. `importSorterThrowOnParseError`: if true, throw on parse errors during preprocessing.

## VS Code Extension (Experimental)

An experimental extension scaffold is available in [vscode-extension/README.md](vscode-extension/README.md).

Quick start:

```bash
npm run vscode:install
npm run vscode:build
```

Then open the `vscode-extension` folder in VS Code and run the extension in an Extension Development Host.

## Development

```bash
npm run build
node dist/bin/cli.js App.tsx
```

Run tests:

```bash
npm test
```

Release readiness check:

```bash
npm run release:check
```

For contributor workflow, semver policy, and release checklist, see `CONTRIBUTING.md`.

## License

MIT

___
Built with ♥️ by [Craftzmen](https://github.com/Craftzmen)
