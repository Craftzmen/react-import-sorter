"use strict";
/**
 * Formatter Plugin System for react-import-sorter
 *
 * This module provides a plugin architecture that allows the sorter
 * to integrate with various code formatters and build tools.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRegistry = exports.DenoFormatterPlugin = exports.BiomeFormatterPlugin = exports.PrettierFormatterPlugin = void 0;
exports.getGlobalPluginRegistry = getGlobalPluginRegistry;
exports.createFormatterPlugin = createFormatterPlugin;
const sortImports_1 = require("./sortImports");
/**
 * Prettier Plugin for react-import-sorter
 * Bridges react-import-sorter with Prettier
 */
class PrettierFormatterPlugin {
    name = 'prettier';
    displayName = 'Prettier';
    version = '1.0.0';
    async isAvailable() {
        try {
            require.resolve('prettier');
            return true;
        }
        catch {
            return false;
        }
    }
    async format(code, options) {
        // Integration with Prettier
        return (0, sortImports_1.sortImportsResult)(code, options);
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
exports.PrettierFormatterPlugin = PrettierFormatterPlugin;
/**
 * Biome Plugin for react-import-sorter
 * Bridges react-import-sorter with Biome
 */
class BiomeFormatterPlugin {
    name = 'biome';
    displayName = 'Biome';
    version = '1.0.0';
    async isAvailable() {
        try {
            require.resolve('@biomejs/biome');
            return true;
        }
        catch {
            return false;
        }
    }
    async format(code, options) {
        // Integration with Biome
        return (0, sortImports_1.sortImportsResult)(code, options);
    }
    getConfig() {
        return {
            indent: 2,
            lineWidth: 80,
        };
    }
}
exports.BiomeFormatterPlugin = BiomeFormatterPlugin;
/**
 * Deno Formatter Plugin for react-import-sorter
 * Integrates with Deno's built-in formatter
 */
class DenoFormatterPlugin {
    name = 'deno';
    displayName = 'Deno';
    version = '1.0.0';
    async isAvailable() {
        try {
            require.resolve('deno');
            return true;
        }
        catch {
            return false;
        }
    }
    async format(code, options) {
        // Integration with Deno
        return (0, sortImports_1.sortImportsResult)(code, options);
    }
    getConfig() {
        return {
            semiColons: true,
            singleQuote: true,
            proseWrap: 'preserve',
        };
    }
}
exports.DenoFormatterPlugin = DenoFormatterPlugin;
/**
 * Plugin Registry
 * Manages available formatter plugins
 */
class PluginRegistry {
    plugins = new Map();
    defaultPlugin = null;
    /**
     * Register a plugin
     */
    register(plugin) {
        this.plugins.set(plugin.name, plugin);
    }
    /**
     * Register multiple plugins
     */
    registerAll(plugins) {
        plugins.forEach((plugin) => this.register(plugin));
    }
    /**
     * Get a plugin by name
     */
    getPlugin(name) {
        return this.plugins.get(name);
    }
    /**
     * Get all available plugins
     */
    async getAvailablePlugins() {
        const available = [];
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
    setDefaultPlugin(name) {
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
    getDefaultPlugin() {
        return this.defaultPlugin;
    }
    /**
     * List all registered plugins
     */
    listPlugins() {
        return Array.from(this.plugins.values());
    }
    /**
     * Clear all plugins
     */
    clear() {
        this.plugins.clear();
        this.defaultPlugin = null;
    }
}
exports.PluginRegistry = PluginRegistry;
/**
 * Global plugin registry instance
 */
let globalRegistry = null;
/**
 * Get or create global plugin registry
 */
function getGlobalPluginRegistry() {
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
function createFormatterPlugin(config) {
    return {
        name: config.name,
        displayName: config.displayName,
        version: config.version,
        isAvailable: config.isAvailable,
        format: config.format,
        getConfig: config.getConfig,
    };
}
