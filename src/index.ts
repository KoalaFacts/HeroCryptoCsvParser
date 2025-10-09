export { BatchEntryRecord } from './core/BatchEntryRecord';
export { FieldDescriptor, FieldLocator, FieldDefinition } from './core/FieldDescriptor';
export { FieldValidationBuilder } from './core/FieldValidationBuilder';
export { ValidationResult } from './core/ValidationResult';
export { 
  FieldGetterContext, 
  FieldMapperContext, 
  FieldFormatterContext, 
  FieldValidatorContext 
} from './core/FieldContext';

export * from './types/transactions/index';

export { 
  SourceParser, 
  ParseOptions,
  ParseResult
} from './core/SourceParser';

export { 
  SourceAdapter, 
  ConversionOptions, 
  ConversionResult
} from './core/SourceAdapter';

export { 
  Source, 
  SourceInfo, 
  SourceProcessResult
} from './core/Source';

export { 
  SourceBuilder, 
  buildSource 
} from './core/SourceBuilder';

export { BinanceSource, BinanceTransactionRecord, BinanceAdapter } from './sources/binance';

export { Plugin } from './plugins/Plugin';
export { PipelineContext } from './plugins/PipelineContext';
export { PluginPipeline } from './plugins/PluginPipeline';
export { PluginRegistry, pluginRegistry } from './plugins/PluginRegistry';

export { TransactionCategorizer, OperationMapping, CategorizerConfig, createCategorizer } from './core/TransactionCategorizer';

export { CsvExporter, CsvExportOptions, CsvRow, exportToCSV } from './exporters/CsvExporter';

// Tax Module Exports
export * from './tax';

import { BinanceSource as BinanceSourceInstance } from './sources/binance';
import { Source, SourceProcessResult } from './core/Source';
import { OperationMapping } from './core/TransactionCategorizer';

const sourceRegistry = new Map<string, Source<any>>([
  ['binance', BinanceSourceInstance],
]);

export interface ProcessOptions {
  // Parsing options
  hasHeaders?: boolean;
  skipRows?: number;
  maxRows?: number;
  continueOnError?: boolean;
  
  // Conversion options
  timezone?: string;
  dateFormat?: string;
  
  // Categorization customization (for Binance)
  customMappings?: OperationMapping[];
  operationOverrides?: Record<string, string>; // Simple operation -> type mapping
}

export async function process(
  source: string, 
  content: string, 
  options?: ProcessOptions
): Promise<SourceProcessResult> {
  let sourceInstance = sourceRegistry.get(source.toLowerCase());
  
  if (!sourceInstance) {
    throw new Error(`Unsupported source: ${source}. Supported sources: ${Array.from(sourceRegistry.keys()).join(', ')}`);
  }

  // For Binance, apply customizations if provided
  if (source.toLowerCase() === 'binance' && (options?.customMappings || options?.operationOverrides)) {
    const { createBinanceCategorizer } = await import('./sources/binance/BinanceTransactionCategorizer');
    const { BinanceAdapter } = await import('./sources/binance/BinanceAdapter');
    const { BinanceParser } = await import('./sources/binance/BinanceParser');
    
    // Create custom categorizer
    const categorizer = createBinanceCategorizer(options.customMappings, options.operationOverrides);
    
    // Create custom adapter with categorizer
    const customAdapter = new BinanceAdapter(categorizer);
    
    // Create temporary source with custom adapter
    sourceInstance = new Source(
      { 
        name: 'binance', 
        displayName: 'Binance',
        type: 'exchange',
        supportedFormats: ['csv']
      },
      new BinanceParser(),
      customAdapter
    );
  }

  return sourceInstance.process(content, options);
}

export function registerSource(name: string, source: Source<any>): void {
  sourceRegistry.set(name.toLowerCase(), source);
}

export function getSupportedSources(): string[] {
  return Array.from(sourceRegistry.keys());
}