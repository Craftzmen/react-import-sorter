/**
 * Formatter Plugin System for react-import-sorter
 *
 * This module provides a plugin architecture that allows the sorter
 * to integrate with various code formatters and build tools.
 */
import { SortResult, SortImportsOptions } from './sortImports';
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
export declare class PrettierFormatterPlugin implements FormatterPlugin {
    name: string;
    displayName: string;
    version: string;
    isAvailable(): Promise<boolean>;
    format(code: string, options?: SortImportsOptions): Promise<SortResult>;
    getConfig(): {
        parser: string;
        semi: boolean;
        singleQuote: boolean;
        trailingComma: string;
    };
}
/**
 * Biome Plugin for react-import-sorter
 * Bridges react-import-sorter with Biome
 */
export declare class BiomeFormatterPlugin implements FormatterPlugin {
    name: string;
    displayName: string;
    version: string;
    isAvailable(): Promise<boolean>;
    format(code: string, options?: SortImportsOptions): Promise<SortResult>;
    getConfig(): {
        indent: number;
        lineWidth: number;
    };
}
/**
 * Deno Formatter Plugin for react-import-sorter
 * Integrates with Deno's built-in formatter
 */
export declare class DenoFormatterPlugin implements FormatterPlugin {
    name: string;
    displayName: string;
    version: string;
    isAvailable(): Promise<boolean>;
    format(code: string, options?: SortImportsOptions): Promise<SortResult>;
    getConfig(): {
        semiColons: boolean;
        singleQuote: boolean;
        proseWrap: string;
    };
}
/**
 * Plugin Registry
 * Manages available formatter plugins
 */
export declare class PluginRegistry {
    private plugins;
    private defaultPlugin;
    /**
     * Register a plugin
     */
    register(plugin: FormatterPlugin): void;
    /**
     * Register multiple plugins
     */
    registerAll(plugins: FormatterPlugin[]): void;
    /**
     * Get a plugin by name
     */
    getPlugin(name: string): FormatterPlugin | undefined;
    /**
     * Get all available plugins
     */
    getAvailablePlugins(): Promise<FormatterPlugin[]>;
    /**
     * Set default plugin
     */
    setDefaultPlugin(name: string): boolean;
    /**
     * Get default plugin
     */
    getDefaultPlugin(): FormatterPlugin | null;
    /**
     * List all registered plugins
     */
    listPlugins(): FormatterPlugin[];
    /**
     * Clear all plugins
     */
    clear(): void;
}
/**
 * Get or create global plugin registry
 */
export declare function getGlobalPluginRegistry(): PluginRegistry;
/**
 * Create custom formatter plugin
 */
export declare function createFormatterPlugin(config: {
    name: string;
    displayName: string;
    version: string;
    isAvailable: () => Promise<boolean>;
    format: (code: string, options?: SortImportsOptions) => Promise<SortResult>;
    getConfig: () => Record<string, unknown>;
}): FormatterPlugin;
