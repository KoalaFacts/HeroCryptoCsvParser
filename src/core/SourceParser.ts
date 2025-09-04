import { BatchEntryRecord } from './BatchEntryRecord';

export interface ParseOptions {
  hasHeaders?: boolean;  // If true, first line is treated as headers and skipped (default: true)
  skipRows?: number;      // Additional rows to skip after headers (if any)
  maxRows?: number;
  continueOnError?: boolean;
}

export interface ParseResult<TRecord> {
  records: TRecord[];
  errors: Array<{
    row: number;
    message: string;
    code?: string;
    data?: string;
  }>;
  metadata: {
    totalRows: number;
    parsedRows: number;
    failedRows: number;
  };
}

/**
 * Base class for parsing source content into source-specific records
 */
export abstract class SourceParser<TRecord extends BatchEntryRecord<TRecord>> {
  protected abstract get RecordClass(): new () => TRecord;
  
  /**
   * Parse source content into source-specific records
   */
  parse(content: string, options?: ParseOptions): ParseResult<TRecord> {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    const result: ParseResult<TRecord> = {
      records: [],
      errors: [],
      metadata: {
        totalRows: 0,
        parsedRows: 0,
        failedRows: 0
      }
    };
    
    // Calculate starting index based on headers and skip rows
    let dataStartIndex = 0;
    
    // Skip headers if specified (default: true)
    const hasHeaders = options?.hasHeaders ?? true;
    if (hasHeaders) {
      dataStartIndex = 1;
    }
    
    // Add any additional rows to skip
    if (options?.skipRows) {
      dataStartIndex += options.skipRows;
    }
    
    const maxRows = options?.maxRows ?? Infinity;
    const endIndex = Math.min(lines.length, dataStartIndex + maxRows);
    result.metadata.totalRows = endIndex - dataStartIndex;
    
    // Process each line
    for (let i = dataStartIndex; i < endIndex; i++) {
      const line = lines[i];
      
      if (!line.trim()) continue;
      
      try {
        const parseResult = BatchEntryRecord.parse(this.RecordClass, line);
        
        if (parseResult.isValid && parseResult.data) {
          result.records.push(parseResult.data);
          result.metadata.parsedRows++;
        } else {
          result.errors.push({
            row: i + 1,
            message: parseResult.firstError?.message || 'Unknown parsing error',
            code: parseResult.firstError?.code,
            data: line
          });
          result.metadata.failedRows++;
          
          if (!options?.continueOnError && result.errors.length > 5) {
            break;
          }
        }
      } catch (error) {
        result.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'PARSE_ERROR',
          data: line
        });
        result.metadata.failedRows++;
        
        if (!options?.continueOnError) {
          break;
        }
      }
    }
    
    return result;
  }
}