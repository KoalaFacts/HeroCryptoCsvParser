import { BatchEntryRecord } from "../core/BatchEntryRecord";
import { Transaction } from "../types/transactions";
import { PipelineContext } from "./PipelineContext";

/**
 * Plugin interface - each hook is a step in the pipeline
 * Each hook receives the result from the previous plugin and passes to the next
 */
export interface Plugin {
  /**
   * Plugin name (must be unique)
   */
  readonly name: string;

  /**
   * Process a line in the pipeline
   * Receives line from previous plugin, returns modified line or null to skip
   */
  processLine?(
    ctx: PipelineContext<string>,
    next: () => PipelineContext<string>
  ): PipelineContext<string>;

  /**
   * Process a record in the pipeline
   * Receives record from previous plugin, returns modified record or null to skip
   */
  processRecord?<TRecord extends BatchEntryRecord<TRecord>>(
    ctx: PipelineContext<TRecord>,
    next: () => PipelineContext<TRecord>
  ): PipelineContext<TRecord>;

  /**
   * Process a transaction in the pipeline
   * Receives transaction from previous plugin, returns modified transaction or null to filter
   */
  processTransaction?(
    ctx: PipelineContext<Transaction>,
    next: () => PipelineContext<Transaction>
  ): PipelineContext<Transaction>;
}
