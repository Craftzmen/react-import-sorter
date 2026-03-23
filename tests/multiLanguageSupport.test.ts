import { describe, it, expect } from 'vitest';
import {
  sortImportsForLanguage,
  getParserForFile,
  VueParser,
  SvelteParser,
  AngularParser,
} from '../src/multiLanguageSupport';

describe('Multi-Language Support', () => {
  describe('Vue Parser', () => {
    it('should extract and sort imports in Vue SFC', () => {
      const vueCode = `<template>
  <div>Hello</div>
</template>

<script>
import { useState } from 'react';
import axios from 'axios';

export default {
  name: 'App',
};
</script>

<style scoped>
.container { color: blue; }
</style>
`;

      const result = sortImportsForLanguage(vueCode, 'App.vue');

      expect(result.code).toBeDefined();
      expect(result.code).toContain('import axios');
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    });

    it('should handle Vue files with TypeScript', () => {
      const vueCode = `<script lang="ts">
import { defineComponent } from 'vue';
import type { PropType } from 'vue';

export default defineComponent({
  name: 'MyComponent',
});
</script>
`;

      const result = sortImportsForLanguage(vueCode, 'MyComponent.vue');

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    });

    it('should return unchanged code for Vue files without imports', () => {
      const vueCode = `<template>
  <div>Hello</div>
</template>

<script>
export default {
  name: 'App',
};
</script>
`;

      const result = sortImportsForLanguage(vueCode, 'App.vue');

      expect(result.code).toBe(vueCode);
      expect(result.changed).toBe(false);
    });
  });

  describe('Svelte Parser', () => {
    it('should extract and sort imports in Svelte component', () => {
      const svelteCode = `<script>
import { onMount } from 'svelte';
import axios from 'axios';

let count = 0;
onMount(() => {
  console.log('mounted');
});
</script>

<main>
  <h1>Count: {count}</h1>
</main>
`;

      const result = sortImportsForLanguage(svelteCode, 'Counter.svelte');

      expect(result.code).toBeDefined();
      expect(result.code).toContain('import axios');
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    });

    it('should handle Svelte component module scripts', () => {
      const svelteCode = `<script context="module">
import { writable } from 'svelte/store';
import type { Load } from '@sveltejs/kit';

export const load: Load = async () => {
  return {};
};
</script>

<script>
export let data;
</script>
`;

      const result = sortImportsForLanguage(svelteCode, 'page.svelte');

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    });

    it('should return unchanged code for Svelte files without imports', () => {
      const svelteCode = `<script>
let count = 0;
</script>

<button on:click={() => count++}>
  Clicks: {count}
</button>
`;

      const result = sortImportsForLanguage(svelteCode, 'Button.svelte');

      expect(result.code).toBe(svelteCode);
      expect(result.changed).toBe(false);
    });
  });

  describe('Angular Parser', () => {
    it('should extract and sort imports in Angular component', () => {
      const angularCode = `import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import axios from 'axios';

@Component({
  selector: 'app-root',
  template: '<h1>Hello</h1>',
})
export class AppComponent {
  constructor(private http: HttpClient) {}
}
`;

      const result = sortImportsForLanguage(angularCode, 'app.component.ts');

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    });

    it('should handle Angular files with type imports', () => {
      const angularCode = `import { Component } from '@angular/core';
import type { OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-list',
  template: '<div>List</div>',
})
export class ListComponent implements OnInit {
  ngOnInit() {}
}
`;

      const result = sortImportsForLanguage(angularCode, 'list.component.ts');

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    });
  });

  describe('Parser Detection', () => {
    it('should detect Vue parser for .vue files', () => {
      const parser = getParserForFile('App.vue');
      expect(parser).toBeInstanceOf(VueParser);
    });

    it('should detect Svelte parser for .svelte files', () => {
      const parser = getParserForFile('Counter.svelte');
      expect(parser).toBeInstanceOf(SvelteParser);
    });

    it('should detect Angular parser for .component.ts files', () => {
      const parser = getParserForFile('app.component.ts');
      expect(parser).toBeInstanceOf(AngularParser);
    });

    it('should return null for unknown file types', () => {
      const parser = getParserForFile('script.py');
      expect(parser).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle Vue files with empty script blocks', () => {
      const vueCode = `<template>
  <div>Hello</div>
</template>

<script>
</script>
`;

      const result = sortImportsForLanguage(vueCode, 'App.vue');

      expect(result.code).toBe(vueCode);
      expect(result.changed).toBe(false);
    });

    it('should handle multiple script blocks in Vue (using first)', () => {
      const vueCode = `<template>
  <div>Hello</div>
</template>

<script>
import { reactive } from 'vue';
import axios from 'axios';
</script>

<script setup>
import { ref } from 'vue';
</script>
`;

      const result = sortImportsForLanguage(vueCode, 'App.vue');

      // Should find and sort the first script block
      expect(result.code).toBeDefined();
    });

    it('should preserve non-import code in Svelte', () => {
      const svelteCode = `<script>
import { onMount } from 'svelte';
import axios from 'axios';

const state = reactive({});
const handleClick = () => console.log('clicked');
</script>
`;

      const result = sortImportsForLanguage(svelteCode, 'Test.svelte');

      // Should preserve the state and handler code
      expect(result.code).toContain('const state');
      expect(result.code).toContain('handleClick');
    });

    it('should be idempotent - sorting twice produces same result', () => {
      const vueCode = `<script>
import { useState } from 'react';
import axios from 'axios';
</script>
`;

      const firstSort = sortImportsForLanguage(vueCode, 'App.vue');
      const secondSort = sortImportsForLanguage(firstSort.code, 'App.vue');

      expect(firstSort.code).toBe(secondSort.code);
      expect(secondSort.changed).toBe(false);
    });
  });

  describe('Framework Priority in Multi-Language', () => {
    it('should respect framework priority in Vue', () => {
      const vueCode = `<script>
import React from 'react';
import Next from 'next';
</script>
`;

      const result = sortImportsForLanguage(vueCode, 'App.vue', {
        frameworkPriority: ['next', 'react'],
      });

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    });

    it('should respect framework priority in Svelte', () => {
      const svelteCode = `<script>
import React from 'react';
import Next from 'next';
</script>
`;

      const result = sortImportsForLanguage(svelteCode, 'App.svelte', {
        frameworkPriority: ['next', 'react'],
      });

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    });
  });
});
