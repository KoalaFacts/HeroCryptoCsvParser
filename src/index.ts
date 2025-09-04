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

import { BinanceSource as BinanceSourceInstance } from './sources/binance';
import { Source, SourceProcessResult } from './core/Source';

const sourceRegistry = new Map<string, Source<any>>([
  ['binance', BinanceSourceInstance],
]);

export async function process(
  source: string, 
  content: string, 
  options?: {
    hasHeaders?: boolean;
    skipRows?: number;
    maxRows?: number;
    continueOnError?: boolean;
    timezone?: string;
    dateFormat?: string;
  }
): Promise<SourceProcessResult> {
  const sourceInstance = sourceRegistry.get(source.toLowerCase());
  
  if (!sourceInstance) {
    throw new Error(`Unsupported source: ${source}. Supported sources: ${Array.from(sourceRegistry.keys()).join(', ')}`);
  }

  return sourceInstance.process(content, options);
}

export function registerSource(name: string, source: Source<any>): void {
  sourceRegistry.set(name.toLowerCase(), source);
}

export function getSupportedSources(): string[] {
  return Array.from(sourceRegistry.keys());
}