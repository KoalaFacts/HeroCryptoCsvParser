import { ParserPlugin, PluginRegistry as IPluginRegistry } from '../types/plugin';

export class PluginRegistry implements IPluginRegistry {
  private plugins: Map<string, ParserPlugin> = new Map();

  register(plugin: ParserPlugin): void {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }
    
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is being overwritten`);
    }
    
    this.plugins.set(plugin.name, plugin);
  }

  unregister(pluginName: string): void {
    this.plugins.delete(pluginName);
  }

  getPlugin(name: string): ParserPlugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): ParserPlugin[] {
    return Array.from(this.plugins.values());
  }

  clear(): void {
    this.plugins.clear();
  }
}