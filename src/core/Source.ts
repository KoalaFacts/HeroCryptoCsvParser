import { BatchEntryRecord } from './BatchEntryRecord';
import { SourceParser, ParseOptions, ParseResult } from './SourceParser';
import { SourceAdapter, ConversionOptions, ConversionResult } from './SourceAdapter';
import { Transaction } from '../types/transactions';

export interface SourceInfo {
  name: string;
  displayName: string;
  type: 'exchange' | 'wallet' | 'defi' | 'blockchain';
  supportedFormats: string[];
  website?: string;
  documentation?: string;
}

export interface SourceProcessResult {
  transactions: Transaction[];
  parseErrors: Array<{ row: number; message: string; code?: string; data?: string; }>;
  conversionWarnings: string[];
  metadata: {
    source: string;
    totalRows: number;
    parsedRows: number;
    failedRows: number;
    startDate?: Date;
    endDate?: Date;
    uniqueAssets?: string[];
    transactionTypes?: Record<string, number>;
  };
}

/**
 * Unified source that processes CSV content into transactions
 * Composed of parser and adapter, configured via builder
 */
export class Source<TRecord extends BatchEntryRecord<TRecord>> {
  constructor(
    private readonly info: SourceInfo,
    private readonly parser: SourceParser<TRecord>,
    private readonly adapter: SourceAdapter<TRecord>
  ) {}

  /**
   * Get source information
   */
  getInfo(): SourceInfo {
    return this.info;
  }

  /**
   * Process source content into transactions
   */
  async process(
    content: string,
    options?: {
      // Parse options
      hasHeaders?: boolean;
      skipRows?: number;
      maxRows?: number;
      continueOnError?: boolean;
      // Conversion options
      timezone?: string;
      dateFormat?: string;
    }
  ): Promise<SourceProcessResult> {
    // Step 1: Parse content to records
    const parseResult = this.parser.parse(content, {
      hasHeaders: options?.hasHeaders,
      skipRows: options?.skipRows,
      maxRows: options?.maxRows,
      continueOnError: options?.continueOnError
    });

    // Step 2: Convert records to transactions
    const conversionResult = this.adapter.convert(parseResult.records, {
      timezone: options?.timezone,
      dateFormat: options?.dateFormat
    });

    // Combine metadata
    return {
      transactions: conversionResult.transactions,
      parseErrors: parseResult.errors,
      conversionWarnings: conversionResult.warnings,
      metadata: {
        ...conversionResult.metadata,
        source: this.info.name,
        totalRows: parseResult.metadata.totalRows,
        parsedRows: parseResult.metadata.parsedRows,
        failedRows: parseResult.metadata.failedRows
      }
    };
  }

  /**
   * Parse content only
   */
  parse(content: string, options?: ParseOptions) {
    return this.parser.parse(content, options);
  }

  /**
   * Convert records only
   */
  convert(records: TRecord[], options?: ConversionOptions) {
    return this.adapter.convert(records, options);
  }
}