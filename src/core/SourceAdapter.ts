import { BatchEntryRecord } from './BatchEntryRecord';
import { Transaction } from '../types/transactions';

export interface ConversionOptions {
  timezone?: string;
  dateFormat?: string;
}

export interface ConversionResult {
  transactions: Transaction[];
  warnings: string[];
  metadata: {
    source: string;
    startDate?: Date;
    endDate?: Date;
    uniqueAssets?: string[];
    transactionTypes?: Record<string, number>;
  };
}

/**
 * Base class for adapting source-specific records to unified transactions
 */
export abstract class SourceAdapter<TRecord extends BatchEntryRecord<TRecord>> {
  abstract get sourceName(): string;
  
  /**
   * Convert a single record to a unified transaction
   */
  protected abstract convertRecord(record: TRecord, options?: ConversionOptions): Transaction;
  
  /**
   * Convert multiple records to transactions with post-processing
   */
  convert(records: TRecord[], options?: ConversionOptions): ConversionResult {
    const result: ConversionResult = {
      transactions: [],
      warnings: [],
      metadata: {
        source: this.sourceName
      }
    };
    
    // Convert each record
    for (const record of records) {
      try {
        const transaction = this.convertRecord(record, options);
        result.transactions.push(transaction);
      } catch (error) {
        result.warnings.push(`Failed to convert record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Post-process transactions
    result.transactions = this.postProcess(result.transactions, options);
    
    // Calculate metadata
    this.calculateMetadata(result);
    
    return result;
  }
  
  /**
   * Post-process transactions (e.g., grouping, merging)
   * Override in subclasses for custom behavior
   */
  protected postProcess(transactions: Transaction[], options?: ConversionOptions): Transaction[] {
    return transactions;
  }
  
  /**
   * Calculate metadata from transactions
   */
  protected calculateMetadata(result: ConversionResult): void {
    if (result.transactions.length === 0) return;
    
    // Date range
    const dates = result.transactions.map(t => t.timestamp);
    result.metadata.startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    result.metadata.endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Unique assets
    const assets = new Set<string>();
    result.transactions.forEach(t => {
      // Check different transaction types for assets
      if ('baseAsset' in t && t.baseAsset) {
        assets.add(t.baseAsset.asset.toString());
      }
      if ('quoteAsset' in t && t.quoteAsset) {
        assets.add(t.quoteAsset.asset.toString());
      }
      if ('asset' in t && t.asset) {
        assets.add(t.asset.asset.toString());
      }
      if ('fee' in t && t.fee) {
        assets.add(t.fee.asset.toString());
      }
    });
    result.metadata.uniqueAssets = Array.from(assets).sort();
    
    // Transaction type breakdown
    const types: Record<string, number> = {};
    result.transactions.forEach(t => {
      types[t.type] = (types[t.type] || 0) + 1;
    });
    result.metadata.transactionTypes = types;
  }
}