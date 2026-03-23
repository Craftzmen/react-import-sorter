# React Import Sorter

A VS Code extension that automatically sorts React, Angular, Vue, and Svelte imports using the `react-import-sorter` library.

## Features

### 🎯 Smart Import Sorting
- Automatically groups and orders imports by categories:
  - Built-in Node.js modules
  - Third-party packages
  - Internal/local imports
  - Type-only imports

### 🖼️ Multi-Language Support
- **React & Next.js** (JavaScript/TypeScript)
- **Vue 3** (Single File Components)
- **Svelte** (Components)
- **Angular** (TypeScript components)

### ⚡ Performance Optimized
- Intelligent caching system
- Early exit optimization for already-sorted imports
- Handles large files efficiently

### 🚀 Easy to Use
- **Command Palette**: Run "React Import Sorter: Sort Imports"
- **Code Actions**: Quick-fix light bulb (Ctrl+.)
- **Save-Time Sorting**: Auto-sort on file save
- **Framework Priority**: Customize import order

## Quick Start

### Sort on Command
1. Open a file with imports
2. Press <kbd>Ctrl+Shift+P</kbd> (<kbd>Cmd+Shift+P</kbd> on Mac)
3. Search for "React Import Sorter: Sort Imports"
4. Press Enter

### Quick Fix
1. Open a file with unsorted imports
2. Press <kbd>Ctrl+.</kbd> (<kbd>Cmd+.</kbd> on Mac) to open Code Actions
3. Select "Sort imports"

### Auto-Sort on Save
Add to your VS Code settings:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.reactImportSorter": "explicit"
  }
}
```

## Configuration

### Framework Priority
Customize the order of framework imports:

```json
{
  "reactImportSorter.frameworkPriority": [
    "next",
    "react",
    "react-dom",
    "react-router"
  ]
}
```

### Parse Error Handling
Choose whether to throw on parse errors or report them:

```json
{
  "reactImportSorter.throwOnParseError": false
}
```

## Examples

### Before
```typescript
import { useState } from 'react';
import axios from 'axios';
import { Component } from 'react';
import * as utils from './utils';
import type { Props } from './types';
```

### After
```typescript
import axios from 'axios';

import { Component, useState } from 'react';

import type { Props } from './types';
import * as utils from './utils';
```

## Multi-Language Support

### Vue SFC
```vue
<script>
import { onMounted } from 'vue';
import axios from 'axios';
</script>
```

### Svelte
```svelte
<script>
import { onMount } from 'svelte';
import axios from 'axios';
</script>
```

### Angular Component
```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import axios from 'axios';
```

## Sorting Rules

Imports are organized into groups:

1. **Node.js Built-ins** (`fs`, `path`, `http`, etc.)
2. **External Packages** (npm packages)
3. **Type Imports** (`import type { ... }`)
4. **Internal Imports** (local files)

Within each group, imports are sorted alphabetically by package/module name.

## Supported File Types

- JavaScript (`.js`)
- JavaScriptReact (`.jsx`)
- TypeScript (`.ts`)
- TypeScriptReact (`.tsx`)
- Vue (`.vue`)
- Svelte (`.svelte`)
- Angular Components (`.component.ts`)

## Extension Settings

- `reactImportSorter.frameworkPriority` - Array of framework names for import ordering
- `reactImportSorter.throwOnParseError` - Throw on parse errors instead of reporting
- `reactImportSorter.enableFormatOnSave` - Enable automatic sorting on save

## Related

- [react-import-sorter npm package](https://www.npmjs.com/package/react-import-sorter)
- [GitHub Repository](https://github.com/craftzmen/react-import-sorter)

## License

MIT License
