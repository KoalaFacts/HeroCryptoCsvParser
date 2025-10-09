/**
 * Tax Module Main Export
 *
 * Central export point for all tax reporting functionality.
 * Provides a clean API for generating tax reports, optimizing strategies, and exporting in various formats.
 */

// Main Services
export { TaxService, createTaxService, generateTaxReport, getTaxOptimizationStrategies } from './TaxService';
export { TaxReportGenerator } from './TaxReportGenerator';
export type { TaxReportConfig, ProgressUpdate } from './TaxReportGenerator';

// Models
export type { TaxJurisdiction } from './models/TaxJurisdiction';
export type { TaxReport } from './models/TaxReport';
export type { TaxPeriod } from './models/TaxPeriod';
export type { TaxableTransaction } from './models/TaxableTransaction';
export type { TransactionTaxTreatment, TaxEventType } from './models/TransactionTaxTreatment';
export type { CostBasis, AcquisitionLot } from './models/CostBasis';
export type { TaxStrategy, StrategyType, ComplianceLevel } from './models/TaxStrategy';
export type { TaxRule, RuleCategory } from './models/TaxRule';
export type { TaxSummary, AssetSummary } from './models/TaxSummary';

// Calculators
export { FIFOCalculator, createFIFOCalculator, calculateFIFOCostBasis } from './calculators/FIFOCalculator';
export type { FIFOResult } from './calculators/FIFOCalculator';
export {
  CapitalGainsCalculator,
  createCapitalGainsCalculator,
  calculateCapitalGains
} from './calculators/CapitalGainsCalculator';
export type { CapitalGainsResult, CapitalGainsContext } from './calculators/CapitalGainsCalculator';
export {
  TaxOptimizationEngine,
  createTaxOptimizationEngine,
  generateOptimizationStrategies
} from './calculators/TaxOptimizationEngine';
export type { OptimizationContext } from './calculators/TaxOptimizationEngine';
export {
  TransactionClassifier,
  createTransactionClassifier,
  classifyTransaction
} from './calculators/TransactionClassifier';
export type { ClassificationContext, ClassificationResult } from './calculators/TransactionClassifier';

// Rules
export {
  AUSTRALIAN_JURISDICTION,
  CGTDiscountRules,
  PersonalUseAssetRules,
  DeFiClassificationRules,
  getAustralianTaxRules,
  getAustralianJurisdiction,
  getAustralianTaxYearBoundaries
} from './rules/AustralianTaxRules';

// Formatters
export { PDFReportFormatter, exportTaxReportPDF } from './formatters/PDFReportFormatter';
export type { PDFExportOptions } from './formatters/PDFReportFormatter';
export { ATOXMLFormatter, exportTaxReportATO } from './formatters/ATOXMLFormatter';
export type { ATOExportOptions } from './formatters/ATOXMLFormatter';
export { CSVExporter, exportTransactionsToCSV, exportSummaryToCSV } from './formatters/CSVExporter';
export type { CSVExportOptions } from './formatters/CSVExporter';

// Storage
export {
  StorageManager,
  initializeStorage,
  getStorageManager,
  closeAllStorage
} from './storage/StorageManager';
export type { StorageAdapter, StorageConfig, TransactionFilter, TaxReportSummary, StorageStats } from './storage/StorageAdapter';
export { IndexedDBAdapter } from './storage/IndexedDBAdapter';
export { MMKVAdapter } from './storage/MMKVAdapter';
export { RxDBAdapter } from './storage/RxDBAdapter';

/**
 * Tax module version
 */
export const TAX_MODULE_VERSION = '1.0.0';

/**
 * Supported jurisdictions
 */
export const SUPPORTED_JURISDICTIONS = ['AU'] as const;

/**
 * Module capabilities
 */
export const CAPABILITIES = {
  jurisdictions: SUPPORTED_JURISDICTIONS,
  costBasisMethods: ['FIFO', 'SPECIFIC_IDENTIFICATION'] as const,
  exportFormats: ['PDF', 'ATO_XML', 'CSV'] as const,
  storageAdapters: ['IndexedDB', 'MMKV', 'RxDB'] as const,
  optimizationStrategies: [
    'TAX_LOSS_HARVESTING',
    'CGT_DISCOUNT_TIMING',
    'PERSONAL_USE_CLASSIFICATION',
    'DISPOSAL_TIMING',
    'LOT_SELECTION'
  ] as const
};

/**
 * Quick start configuration for Australian tax reports
 */
export const QUICK_START_AU = {
  jurisdictionCode: 'AU' as const,
  options: {
    includeOptimization: true,
    costBasisMethod: 'FIFO' as const,
    investorType: 'PERSONAL' as const,
    handleDeFi: true
  }
};

/**
 * Tax module information
 */
export const TAX_MODULE_INFO = {
  name: 'Crypto Tax Report Module',
  version: TAX_MODULE_VERSION,
  description: 'Privacy-first cryptocurrency tax reporting for Australian jurisdiction',
  features: [
    'Offline tax calculation',
    'FIFO cost basis',
    'Capital gains with CGT discount',
    'Personal use asset exemptions',
    'DeFi transaction classification',
    'Tax optimization strategies',
    'PDF and ATO XML export',
    'Privacy-first architecture'
  ],
  author: 'BeingCiteable',
  license: 'MIT'
} as const;