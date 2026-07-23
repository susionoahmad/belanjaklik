import type { ImportPlugin, PipelineContext } from '../types';

export class PluginManager {
  private plugins: Map<string, ImportPlugin> = new Map();

  registerPlugin(plugin: ImportPlugin): void {
    this.plugins.set(plugin.id, plugin);
    console.log(`[PluginManager] Plugin registered: ${plugin.name}`);
  }

  async runPlugins(context: PipelineContext): Promise<PipelineContext> {
    let currentContext = context;
    for (const plugin of this.plugins.values()) {
      try {
        currentContext = await plugin.execute(currentContext);
        currentContext.logs.push(`Plugin executed: ${plugin.name}`);
      } catch (err: any) {
        console.error(`[PluginManager] Plugin ${plugin.name} failed:`, err);
        currentContext.errors.push(`Plugin ${plugin.name} error: ${err.message}`);
      }
    }
    return currentContext;
  }
}

export const pluginManager = new PluginManager();
