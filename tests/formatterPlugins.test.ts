import { describe, it, expect, beforeEach } from 'vitest';
import {
  PluginRegistry,
  PrettierFormatterPlugin,
  BiomeFormatterPlugin,
  DenoFormatterPlugin,
  createFormatterPlugin,
  getGlobalPluginRegistry,
} from '../src/formatterPlugins';
import { SortResult, SortImportsOptions } from '../src/sortImports';

describe('Formatter Plugin System', () => {
  describe('Plugin Registry', () => {
    let registry: PluginRegistry;

    beforeEach(() => {
      registry = new PluginRegistry();
    });

    it('should register a plugin', () => {
      const plugin = new PrettierFormatterPlugin();
      registry.register(plugin);

      const retrieved = registry.getPlugin('prettier');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('prettier');
    });

    it('should register multiple plugins', () => {
      const plugins = [
        new PrettierFormatterPlugin(),
        new BiomeFormatterPlugin(),
        new DenoFormatterPlugin(),
      ];

      registry.registerAll(plugins);

      expect(registry.getPlugin('prettier')).toBeDefined();
      expect(registry.getPlugin('biome')).toBeDefined();
      expect(registry.getPlugin('deno')).toBeDefined();
    });

    it('should get undefined for non-existent plugin', () => {
      const plugin = registry.getPlugin('non-existent');
      expect(plugin).toBeUndefined();
    });

    it('should set and get default plugin', () => {
      const plugin = new PrettierFormatterPlugin();
      registry.register(plugin);
      registry.setDefaultPlugin('prettier');

      const defaultPlugin = registry.getDefaultPlugin();
      expect(defaultPlugin?.name).toBe('prettier');
    });

    it('should return false when setting non-existent plugin as default', () => {
      const result = registry.setDefaultPlugin('non-existent');
      expect(result).toBe(false);
    });

    it('should list all registered plugins', () => {
      registry.registerAll([
        new PrettierFormatterPlugin(),
        new BiomeFormatterPlugin(),
      ]);

      const plugins = registry.listPlugins();
      expect(plugins.length).toBe(2);
      expect(plugins.map((p) => p.name)).toContain('prettier');
      expect(plugins.map((p) => p.name)).toContain('biome');
    });

    it('should clear all plugins', () => {
      registry.registerAll([
        new PrettierFormatterPlugin(),
        new BiomeFormatterPlugin(),
      ]);

      registry.clear();

      expect(registry.listPlugins().length).toBe(0);
      expect(registry.getDefaultPlugin()).toBeNull();
    });
  });

  describe('Available Plugins Detection', () => {
    let registry: PluginRegistry;

    beforeEach(() => {
      registry = new PluginRegistry();
    });

    it('should check if Prettier plugin is available', async () => {
      registry.register(new PrettierFormatterPlugin());

      const available = await registry.getAvailablePlugins();

      // Prettier should be available in test environment
      const prettierPlugin = available.find((p) => p.name === 'prettier');
      expect(prettierPlugin).toBeDefined();
    });

    it('should return array of available plugins', async () => {
      registry.registerAll([
        new PrettierFormatterPlugin(),
        new BiomeFormatterPlugin(),
        new DenoFormatterPlugin(),
      ]);

      const available = await registry.getAvailablePlugins();

      // At least one plugin should be available
      expect(available.length).toBeGreaterThan(0);
      expect(Array.isArray(available)).toBe(true);
    });
  });

  describe('Built-in Plugins', () => {
    it('should have Prettier plugin', () => {
      const plugin = new PrettierFormatterPlugin();

      expect(plugin.name).toBe('prettier');
      expect(plugin.displayName).toBe('Prettier');
      expect(plugin.version).toBeDefined();
    });

    it('should have Biome plugin', () => {
      const plugin = new BiomeFormatterPlugin();

      expect(plugin.name).toBe('biome');
      expect(plugin.displayName).toBe('Biome');
      expect(plugin.version).toBeDefined();
    });

    it('should have Deno plugin', () => {
      const plugin = new DenoFormatterPlugin();

      expect(plugin.name).toBe('deno');
      expect(plugin.displayName).toBe('Deno');
      expect(plugin.version).toBeDefined();
    });

    it('should provide plugin configuration', () => {
      const prettierConfig = new PrettierFormatterPlugin().getConfig();
      expect(prettierConfig).toBeDefined();
      expect(typeof prettierConfig).toBe('object');

      const biomeConfig = new BiomeFormatterPlugin().getConfig();
      expect(biomeConfig).toBeDefined();

      const denoConfig = new DenoFormatterPlugin().getConfig();
      expect(denoConfig).toBeDefined();
    });
  });

  describe('Custom Formatter Plugin', () => {
    it('should create a custom formatter plugin', () => {
      const mockResult: SortResult = {
        code: 'sorted',
        changed: true,
        diagnostics: [],
        metadata: { importCount: 0, groupCount: 0 },
      };

      const customPlugin = createFormatterPlugin({
        name: 'custom',
        displayName: 'Custom Formatter',
        version: '1.0.0',
        isAvailable: async () => true,
        format: async (code: string) => mockResult,
        getConfig: () => ({ custom: true }),
      });

      expect(customPlugin.name).toBe('custom');
      expect(customPlugin.displayName).toBe('Custom Formatter');
      expect(customPlugin.version).toBe('1.0.0');
    });

    it('should execute custom formatter plugin methods', async () => {
      const customPlugin = createFormatterPlugin({
        name: 'test',
        displayName: 'Test Plugin',
        version: '1.0.0',
        isAvailable: async () => true,
        format: async (code: string) => ({
          code: code.toUpperCase(),
          changed: true,
          diagnostics: [],
          metadata: { importCount: 1, groupCount: 1 },
        }),
        getConfig: () => ({ test: true }),
      });

      const available = await customPlugin.isAvailable();
      expect(available).toBe(true);

      const config = customPlugin.getConfig();
      expect(config.test).toBe(true);

      const result = await customPlugin.format('test code');
      expect(result.code).toBe('TEST CODE');
      expect(result.changed).toBe(true);
    });
  });

  describe('Global Plugin Registry', () => {
    it('should provide global plugin registry', () => {
      const registry = getGlobalPluginRegistry();

      expect(registry).toBeDefined();
      expect(registry instanceof PluginRegistry).toBe(true);
    });

    it('should have default plugins registered', () => {
      const registry = getGlobalPluginRegistry();
      const plugins = registry.listPlugins();

      expect(plugins.length).toBeGreaterThan(0);
      expect(plugins.map((p) => p.name)).toContain('prettier');
    });

    it('should have Prettier set as default', () => {
      const registry = getGlobalPluginRegistry();
      const defaultPlugin = registry.getDefaultPlugin();

      expect(defaultPlugin?.name).toBe('prettier');
    });

    it('should be a singleton', () => {
      const registry1 = getGlobalPluginRegistry();
      const registry2 = getGlobalPluginRegistry();

      expect(registry1).toBe(registry2);
    });
  });

  describe('Plugin Integration', () => {
    it('should format code through a plugin', async () => {
      const plugin = new PrettierFormatterPlugin();

      if (await plugin.isAvailable()) {
        const result = await plugin.format('import z from "z";\nimport a from "a";', {});

        expect(result).toBeDefined();
        expect(result.code).toBeDefined();
        expect(result.diagnostics).toBeDefined();
        expect(result.metadata).toBeDefined();
      }
    });

    it('should register and use custom plugins', async () => {
      const registry = new PluginRegistry();

      const customPlugin = createFormatterPlugin({
        name: 'my-formatter',
        displayName: 'My Formatter',
        version: '1.0.0',
        isAvailable: async () => true,
        format: async (code: string): Promise<SortResult> => ({
          code: code.split('\n').sort().join('\n'),
          changed: false,
          diagnostics: [],
          metadata: { importCount: 0, groupCount: 0 },
        }),
        getConfig: () => ({ custom: true }),
      });

      registry.register(customPlugin);

      const retrieved = registry.getPlugin('my-formatter');
      expect(retrieved).toBeDefined();

      const available = await registry.getAvailablePlugins();
      expect(available.some((p) => p.name === 'my-formatter')).toBe(true);
    });
  });

  describe('Plugin Error Handling', () => {
    it('should handle unavailable plugins gracefully', async () => {
      const plugin = createFormatterPlugin({
        name: 'unavailable',
        displayName: 'Unavailable Plugin',
        version: '1.0.0',
        isAvailable: async () => false,
        format: async () => ({
          code: '',
          changed: false,
          diagnostics: [],
          metadata: { importCount: 0, groupCount: 0 },
        }),
        getConfig: () => ({}),
      });

      const isAvailable = await plugin.isAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should handle plugin format errors', async () => {
      const plugin = createFormatterPlugin({
        name: 'error-plugin',
        displayName: 'Error Plugin',
        version: '1.0.0',
        isAvailable: async () => true,
        format: async () => {
          throw new Error('Format failed');
        },
        getConfig: () => ({}),
      });

      try {
        await plugin.format('code', {});
        // If we reach here, the error was not thrown
        expect(false).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
