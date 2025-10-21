/**
 * Tax Module Main Export
 *
 * Central export point for all tax reporting functionality.
 * Provides a clean API for generating tax reports, optimizing strategies, and exporting in various formats.
 */

export type {
  CapitalGainsContext,
  CapitalGainsResult,
} from "./calculators/CapitalGainsCalculator";
export {
  CapitalGainsCalculator,
  calculateCapitalGains,
  createCapitalGainsCalculator,
} from "./calculators/CapitalGainsCalculator";
export type { FIFOResult } from "./calculators/FIFOCalculator";
// Calculators
export {
  calculateFIFOCostBasis,
  createFIFOCalculator,
  FIFOCalculator,
} from "./calculators/FIFOCalculator";
export type { OptimizationContext } from "./calculators/TaxOptimizationEngine";
export {
  createTaxOptimizationEngine,
  generateOptimizationStrategies,
  TaxOptimizationEngine,
} from "./calculators/TaxOptimizationEngine";
export type {
  ClassificationContext,
  ClassificationResult,
} from "./calculators/TransactionClassifier";
export {
  classifyTransaction,
  createTransactionClassifier,
  TransactionClassifier,
} from "./calculators/TransactionClassifier";
export type { ATOExportOptions } from "./formatters/ATOXMLFormatter";
export {
  ATOXMLFormatter,
  exportTaxReportATO,
} from "./formatters/ATOXMLFormatter";
export type { CSVExportOptions } from "./formatters/CSVExporter";
export {
  CSVExporter,
  exportSummaryToCSV,
  exportTransactionsToCSV,
} from "./formatters/CSVExporter";
export type { PDFExportOptions } from "./formatters/PDFReportFormatter";
// Formatters
export {
  exportTaxReportPDF,
  PDFReportFormatter,
} from "./formatters/PDFReportFormatter";
export type { AcquisitionLot, CostBasis } from "./models/CostBasis";
export type { TaxableTransaction } from "./models/TaxableTransaction";
// Models
export type { TaxJurisdiction } from "./models/TaxJurisdiction";
export type { TaxPeriod } from "./models/TaxPeriod";
export type { TaxReport } from "./models/TaxReport";
export type { RuleCategory, TaxRule } from "./models/TaxRule";
export type {
  ComplianceLevel,
  StrategyType,
  TaxStrategy,
} from "./models/TaxStrategy";
export type { AssetSummary, TaxSummary } from "./models/TaxSummary";
export type {
  TaxEventType,
  TransactionTaxTreatment,
} from "./models/TransactionTaxTreatment";
// Rules
export {
  AUSTRALIAN_JURISDICTION,
  appliesCGTDiscount,
  appliesPersonalUseExemption,
  calculateCGTDiscount,
  calculateDeFiIncomeAmount,
  calculatePersonalUseTaxableAmount,
  calculateTaxableGain,
  classifyDeFiTransaction,
  getAustralianJurisdiction,
  getAustralianTaxRules,
  getAustralianTaxYearBoundaries,
  getCGTDiscountRule,
  getDeFiClassificationRule,
  getPersonalUseAssetRule,
  isDeFiTaxableEvent,
  isPersonalUseAsset,
  validatePersonalUseDocumentation,
} from "./rules/AustralianTaxRules";
export { IndexedDBAdapter } from "./storage/IndexedDBAdapter";
export { MMKVAdapter } from "./storage/MMKVAdapter";
export { RxDBAdapter } from "./storage/RxDBAdapter";
export type {
  StorageAdapter,
  StorageConfig,
  StorageStats,
  TaxReportSummary,
  TransactionFilter,
} from "./storage/StorageAdapter";
// Storage
export {
  closeAllStorage,
  getStorageManager,
  initializeStorage,
  StorageManager,
} from "./storage/StorageManager";
export type { ProgressUpdate, TaxReportConfig } from "./TaxReportGenerator";
export { TaxReportGenerator } from "./TaxReportGenerator";
// Main Services
export {
  createTaxService,
  generateTaxReport,
  getTaxOptimizationStrategies,
  TaxService,
} from "./TaxService";

/**
 * Tax module version
 */
export const TAX_MODULE_VERSION = "1.0.0";

/**
 * Supported jurisdictions
 */
export const SUPPORTED_JURISDICTIONS = ["AU"] as const;

/**
 * Module capabilities
 */
export const CAPABILITIES = {
  jurisdictions: SUPPORTED_JURISDICTIONS,
  costBasisMethods: ["FIFO", "SPECIFIC_IDENTIFICATION"] as const,
  exportFormats: ["PDF", "ATO_XML", "CSV"] as const,
  storageAdapters: ["IndexedDB", "MMKV", "RxDB"] as const,
  optimizationStrategies: [
    "TAX_LOSS_HARVESTING",
    "CGT_DISCOUNT_TIMING",
    "PERSONAL_USE_CLASSIFICATION",
    "DISPOSAL_TIMING",
    "LOT_SELECTION",
  ] as const,
};

/**
 * Quick start configuration for Australian tax reports
 */
export const QUICK_START_AU = {
  jurisdictionCode: "AU" as const,
  options: {
    includeOptimization: true,
    costBasisMethod: "FIFO" as const,
    investorType: "PERSONAL" as const,
    handleDeFi: true,
  },
};

/**
 * Tax module information
 */
export const TAX_MODULE_INFO = {
  name: "Crypto Tax Report Module",
  version: TAX_MODULE_VERSION,
  description:
    "Privacy-first cryptocurrency tax reporting for Australian jurisdiction",
  features: [
    "Offline tax calculation",
    "FIFO cost basis",
    "Capital gains with CGT discount",
    "Personal use asset exemptions",
    "DeFi transaction classification",
    "Tax optimization strategies",
    "PDF and ATO XML export",
    "Privacy-first architecture",
  ],
  author: "KoalaFacts",
  license: "MIT",
} as const;
