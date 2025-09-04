import { BatchEntryRecord } from './BatchEntryRecord';
import { SourceParser } from './SourceParser';
import { SourceAdapter, ConversionOptions } from './SourceAdapter';
import { Source, SourceInfo } from './Source';
import { Transaction } from '../types/transactions';

/**
 * Builder for creating Source instances
 * Allows flexible configuration of parser, adapter, and metadata
 */
export class SourceBuilder<TRecord extends BatchEntryRecord<TRecord>> {
  private info?: SourceInfo;
  private parser?: SourceParser<TRecord>;
  private adapter?: SourceAdapter<TRecord>;
  private recordClass?: new () => TRecord;
  private convertFn?: (record: TRecord, options?: ConversionOptions) => Transaction;
  private sourceName?: string;

  /**
   * Set source information
   */
  withInfo(info: SourceInfo): this {
    this.info = info;
    return this;
  }

  /**
   * Set the record class for automatic parser creation
   */
  withRecordClass(recordClass: new () => TRecord): this {
    this.recordClass = recordClass;
    return this;
  }

  /**
   * Set a custom parser
   */
  withParser(parser: SourceParser<TRecord>): this {
    this.parser = parser;
    return this;
  }

  /**
   * Set a custom adapter
   */
  withAdapter(adapter: SourceAdapter<TRecord>): this {
    this.adapter = adapter;
    return this;
  }

  /**
   * Set a conversion function for automatic adapter creation
   */
  withConversion(
    sourceName: string,
    convertFn: (record: TRecord, options?: ConversionOptions) => Transaction
  ): this {
    this.sourceName = sourceName;
    this.convertFn = convertFn;
    return this;
  }

  /**
   * Build the Source instance
   */
  build(): Source<TRecord> {
    if (!this.info) {
      throw new Error('Source info is required');
    }

    // Validate source info
    if (!this.info.name || this.info.name.trim() === '') {
      throw new Error('Source name cannot be empty');
    }
    
    if (!this.info.displayName || this.info.displayName.trim() === '') {
      throw new Error('Source display name cannot be empty');
    }

    // Create parser if not provided
    const parser = this.parser || this.createDefaultParser();
    
    // Create adapter if not provided
    const adapter = this.adapter || this.createDefaultAdapter();

    return new Source(this.info, parser, adapter);
  }

  private createDefaultParser(): SourceParser<TRecord> {
    if (!this.recordClass) {
      throw new Error('Either provide a parser or set a record class');
    }

    // Create an anonymous parser class
    const RecordClass = this.recordClass;
    return new (class extends SourceParser<TRecord> {
      protected get RecordClass() {
        return RecordClass;
      }
    })();
  }

  private createDefaultAdapter(): SourceAdapter<TRecord> {
    if (!this.convertFn || !this.sourceName) {
      throw new Error('Either provide an adapter or set a conversion function');
    }

    // Create an anonymous adapter class
    const convertFn = this.convertFn;
    const sourceName = this.sourceName;
    return new (class extends SourceAdapter<TRecord> {
      get sourceName() {
        return sourceName;
      }
      protected convertRecord(record: TRecord, options?: ConversionOptions): Transaction {
        return convertFn(record, options);
      }
    })();
  }
}

/**
 * Convenience function to start building a source
 */
export function buildSource<TRecord extends BatchEntryRecord<TRecord>>(): SourceBuilder<TRecord> {
  return new SourceBuilder<TRecord>();
}