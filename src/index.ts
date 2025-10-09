export { BatchEntryRecord } from "./core/BatchEntryRecord";
export {
  FieldFormatterContext,
  FieldGetterContext,
  FieldMapperContext,
  FieldValidatorContext,
} from "./core/FieldContext";
export {
  FieldDefinition,
  FieldDescriptor,
  FieldLocator,
} from "./core/FieldDescriptor";
export { FieldValidationBuilder } from "./core/FieldValidationBuilder";
export {
  Source,
  SourceInfo,
  SourceProcessResult,
} from "./core/Source";
export {
  ConversionOptions,
  ConversionResult,
  SourceAdapter,
} from "./core/SourceAdapter";
export {
  buildSource,
  SourceBuilder,
} from "./core/SourceBuilder";
export {
  ParseOptions,
  ParseResult,
  SourceParser,
} from "./core/SourceParser";
export {
  CategorizerConfig,
  createCategorizer,
  OperationMapping,
  TransactionCategorizer,
} from "./core/TransactionCategorizer";
export { ValidationResult } from "./core/ValidationResult";
export {
  CsvExporter,
  CsvExportOptions,
  CsvRow,
  exportToCSV,
} from "./exporters/CsvExporter";
export { PipelineContext } from "./plugins/PipelineContext";
export { Plugin } from "./plugins/Plugin";
export { PluginPipeline } from "./plugins/PluginPipeline";
export { PluginRegistry, pluginRegistry } from "./plugins/PluginRegistry";
// Tax Module Exports
export * from "./tax";
export * from "./types/transactions/index";

import { Source, type SourceProcessResult } from "./core/Source";
import type { OperationMapping } from "./core/TransactionCategorizer";

// Lazy-load sources to avoid mixing static and dynamic imports
const sourceRegistry = new Map<string, Source<any>>();

async function getSource(sourceName: string): Promise<Source<any> | undefined> {
  const key = sourceName.toLowerCase();

  // Check if already loaded
  if (sourceRegistry.has(key)) {
    return sourceRegistry.get(key);
  }

  // Lazy load source
  if (key === "binance") {
    const { BinanceSource } = await import("./sources/binance");
    sourceRegistry.set(key, BinanceSource);
    return BinanceSource;
  }

  return undefined;
}

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
  options?: ProcessOptions,
): Promise<SourceProcessResult> {
  let sourceInstance = await getSource(source);

  if (!sourceInstance) {
    throw new Error(
      `Unsupported source: ${source}. Supported sources: binance`,
    );
  }

  // For Binance, apply customizations if provided
  if (
    source.toLowerCase() === "binance" &&
    (options?.customMappings || options?.operationOverrides)
  ) {
    const { createBinanceCategorizer, BinanceAdapter, BinanceParser } =
      await import("./sources/binance");

    // Create custom categorizer
    const categorizer = createBinanceCategorizer(
      options.customMappings,
      options.operationOverrides,
    );

    // Create custom adapter with categorizer
    const customAdapter = new BinanceAdapter(categorizer);

    // Create temporary source with custom adapter
    sourceInstance = new Source(
      {
        name: "binance",
        displayName: "Binance",
        type: "exchange",
        supportedFormats: ["csv"],
      },
      new BinanceParser(),
      customAdapter,
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
