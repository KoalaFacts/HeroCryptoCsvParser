import { BatchEntryRecord } from "../core/BatchEntryRecord";
import { Transaction } from "../types/transactions";
import { Plugin } from "./Plugin";
import { PipelineContext } from "./PipelineContext";

type PluginHook<T> = (
  ctx: PipelineContext<T>,
  next: () => PipelineContext<T>
) => PipelineContext<T>;

/**
 * Plugin pipeline executor - implements decorator pattern
 */
export class PluginPipeline {
  constructor(private plugins: Plugin[]) {}

  /**
   * Execute line processing pipeline
   */
  executeLine(line: string, lineNumber: number): string | null {
    const context: PipelineContext<string> = {
      data: line,
      metadata: { lineNumber },
    };

    const chain = this.buildChain(
      (plugin) => plugin.processLine as PluginHook<string> | undefined,
      context
    );

    return chain().data;
  }

  /**
   * Execute record processing pipeline
   */
  executeRecord<TRecord extends BatchEntryRecord<TRecord>>(
    record: TRecord,
    lineNumber: number
  ): TRecord | null {
    const context: PipelineContext<TRecord> = {
      data: record,
      metadata: { lineNumber },
    };

    const chain = this.buildChain(
      (plugin) => plugin.processRecord as PluginHook<TRecord> | undefined,
      context
    );

    return chain().data;
  }

  /**
   * Execute transaction processing pipeline
   */
  executeTransaction(
    transaction: Transaction,
    index: number
  ): Transaction | null {
    const context: PipelineContext<Transaction> = {
      data: transaction,
      metadata: { index },
    };

    const chain = this.buildChain(
      (plugin) =>
        plugin.processTransaction as PluginHook<Transaction> | undefined,
      context
    );

    return chain().data;
  }

  /**
   * Build the chain of plugins
   */
  private buildChain<T>(
    getHook: (plugin: Plugin) => PluginHook<T> | undefined,
    context: PipelineContext<T>
  ): () => PipelineContext<T> {
    // Start with the base function that just returns the context
    let chain = () => context;

    // Wrap each plugin around the chain (reverse order so first plugin executes first)
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      const plugin = this.plugins[i];
      const hook = getHook(plugin);

      if (!hook || typeof hook !== "function") {
        continue; // Skip plugins that don't implement this hook
      }

      // Capture the current chain
      const nextChain = chain;

      // Create new chain that calls this plugin with the next chain
      chain = () => {
        return hook.call(plugin, context, nextChain);
      };
    }

    return chain;
  }
}
