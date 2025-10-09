import type { Plugin } from "./Plugin";

/**
 * Registry for managing plugins
 */
export class PluginRegistry {
	private plugins: Plugin[] = [];

	/**
	 * Register a plugin
	 */
	register(plugin: Plugin): void {
		if (!plugin.name) {
			throw new Error("Plugin must have a name");
		}
		if (this.plugins.some((p) => p.name === plugin.name)) {
			throw new Error(`Plugin "${plugin.name}" is already registered`);
		}
		this.plugins.push(plugin);
	}

	/**
	 * Unregister a plugin by name
	 */
	unregister(name: string): void {
		const index = this.plugins.findIndex((p) => p.name === name);
		if (index >= 0) {
			this.plugins.splice(index, 1);
		}
	}

	/**
	 * Get all registered plugins
	 */
	getPlugins(): Plugin[] {
		return [...this.plugins];
	}

	/**
	 * Check if a plugin is registered
	 */
	has(name: string): boolean {
		return this.plugins.some((p) => p.name === name);
	}

	/**
	 * Clear all plugins
	 */
	clear(): void {
		this.plugins = [];
	}
}

// Global plugin registry instance
export const pluginRegistry = new PluginRegistry();
