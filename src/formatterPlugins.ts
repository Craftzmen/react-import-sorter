/**
 * Formatter Plugin System for react-import-sorter
 * 
 * This module provides a plugin architecture that allows the sorter
 * to integrate with various code formatters and build tools.
 */

import { sortImportsResult, SortResult, SortImportsOptions } from './sortImports';

/**
 * Plugin provider interface
 * Implement this to create a custom formatter plugin
 */
export interface FormatterPlugin {
  /**
   * Unique identifier for the plugin
   */
  name: string;

  /**
   * Human-readable name
   */
  displayName: string;

  /**
   * Plugin version
   */
  version: string;

  /**
   * Check if the plugin is available in the current environment
   */
  isAvailable(): Promise<boolean>;

  /**
   * Format code using this formatter
   */
  format(code: string, options?: SortImportsOptions): Promise<SortResult>;

  /**
   * Get plugin configuration
   */
  getConfig(): Record<string, unknown>;
}

/**
 * Prettier Plugin for react-import-sorter
 * Bridges react-import-sorter with Prettier
 */
export class PrettierFormatterPlugin implements FormatterPlugin {
  name = 'prettier';
  displayName = 'Prettier';
  version = '1.0.0';

  async isAvailable(): Promise<boolean> {
    try {
      require.resolve('prettier');
      return true;
    } catch {
      return false;
    }
  }

  async format(code: string, options?: SortImportsOptions): Promise<SortResult> {
    // Integration with Prettier
    return sortImportsResult(code, options);
  }

  getConfig() {
    return {
      parser: 'babel',
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
    };
  }
}

/**
 * Biome Plugin for react-import-sorter
 * Bridges react-import-sorter with Biome
 */
export class BiomeFormatterPlugin implements FormatterPlugin {
  name = 'biome';
  displayName = 'Biome';
  version = '1.0.0';

  async isAvailable(): Promise<boolean> {
    try {
      require.resolve('@biomejs/biome');
      return true;
    } catch {
      return false;
    }
  }

  async format(code: string, options?: SortImportsOptions): Promise<SortResult> {
    // Integration with Biome
    return sortImportsResult(code, options);
  }

  getConfig() {
    return {
      indent: 2,
      lineWidth: 80,
    };
  }
}

/**
 * Deno Formatter Plugin for react-import-sorter
 * Integrates with Deno's built-in formatter
 */
export class DenoFormatterPlugin implements FormatterPlugin {
  name = 'deno';
  displayName = 'Deno';
  version = '1.0.0';

  async isAvailable(): Promise<boolean> {
    try {
      require.resolve('deno');
      return true;
    } catch {
      return false;
    }
  }

  async format(code: string, options?: SortImportsOptions): Promise<SortResult> {
    // Integration with Deno
    return sortImportsResult(code, options);
  }

  getConfig() {
    return {
      semiColons: true,
      singleQuote: true,
      proseWrap: 'preserve',
    };
  }
}

/**
 * Plugin Registry
 * Manages available formatter plugins
 */
export class PluginRegistry {
  private plugins: Map<string, FormatterPlugin> = new Map();
  private defaultPlugin: FormatterPlugin | null = null;

  /**
   * Register a plugin
   */
  register(plugin: FormatterPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Register multiple plugins
   */
  registerAll(plugins: FormatterPlugin[]): void {
    plugins.forEach((plugin) => this.register(plugin));
  }

  /**
   * Get a plugin by name
   */
  getPlugin(name: string): FormatterPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all available plugins
   */
  async getAvailablePlugins(): Promise<FormatterPlugin[]> {
    const available: FormatterPlugin[] = [];

    for (const plugin of this.plugins.values()) {
      if (await plugin.isAvailable()) {
        available.push(plugin);
      }
    }

    return available;
  }

  /**
   * Set default plugin
   */
  setDefaultPlugin(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (plugin) {
      this.defaultPlugin = plugin;
      return true;
    }
    return false;
  }

  /**
   * Get default plugin
   */
  getDefaultPlugin(): FormatterPlugin | null {
    return this.defaultPlugin;
  }

  /**
   * List all registered plugins
   */
  listPlugins(): FormatterPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear();
    this.defaultPlugin = null;
  }
}

/**
 * Global plugin registry instance
 */
let globalRegistry: PluginRegistry | null = null;

/**
 * Get or create global plugin registry
 */
export function getGlobalPluginRegistry(): PluginRegistry {
  if (!globalRegistry) {
    globalRegistry = new PluginRegistry();

    // Register default plugins
    globalRegistry.registerAll([
      new PrettierFormatterPlugin(),
      new BiomeFormatterPlugin(),
      new DenoFormatterPlugin(),
    ]);

    // Set Prettier as default
    globalRegistry.setDefaultPlugin('prettier');
  }

  return globalRegistry;
}

/**
 * Create custom formatter plugin
 */
export function createFormatterPlugin(config: {
  name: string;
  displayName: string;
  version: string;
  isAvailable: () => Promise<boolean>;
  format: (code: string, options?: SortImportsOptions) => Promise<SortResult>;
  getConfig: () => Record<string, unknown>;
}): FormatterPlugin {
  return {
    name: config.name,
    displayName: config.displayName,
    version: config.version,
    isAvailable: config.isAvailable,
    format: config.format,
    getConfig: config.getConfig,
  };
}
