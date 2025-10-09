/**
 * Function Interface Contracts: Crypto Tax Report Library
 *
 * This file defines the public function interfaces for the tax reporting module.
 * All tax rules and calculations are performed locally within the library.
 */

import type { Transaction } from '@/types/transactions/Transaction';
import type { TaxEvent } from '@/types/common/TaxEvent';

// Core function interfaces that the tax module must implement

/**
 * Generate a comprehensive tax report for the specified jurisdiction and period
 */
export interface GenerateTaxReportFunction {
  (config: TaxReportConfig): Promise<TaxReport>;
}

/**
 * Calculate tax optimization strategies for given transactions
 */
export interface GetTaxOptimizationFunction {
  (config: OptimizationConfig): Promise<TaxStrategy[]>;
}

/**
 * Export tax report to PDF format
 */
export interface ExportTaxReportPDFFunction {
  (report: TaxReport, options?: PDFExportOptions): Promise<Buffer>;
}

/**
 * Export tax report to ATO SBR XML format
 */
export interface ExportTaxReportATOFunction {
  (report: TaxReport, options: ATOExportOptions): Promise<string>;
}

/**
 * Get supported tax jurisdictions with their configurations
 */
export interface GetSupportedJurisdictionsFunction {
  (): TaxJurisdiction[];
}

/**
 * Calculate cost basis for a disposal using specified method
 */
export interface CalculateCostBasisFunction {
  (disposal: Transaction, acquisitions: Transaction[], method: CostBasisMethod): CostBasis;
}

/**
 * Classify a transaction for tax treatment
 */
export interface ClassifyTransactionFunction {
  (transaction: Transaction, jurisdiction: string, context?: TransactionContext): TransactionTaxTreatment;
}

/**
 * Calculate capital gains/losses for a disposal
 */
export interface CalculateCapitalGainsFunction {
  (disposal: Transaction, costBasis: CostBasis, jurisdiction: string): CapitalGainsResult;
}

/**
 * Initialize storage for the tax module
 */
export interface InitializeStorageFunction {
  (config: StorageConfig): Promise<StorageAdapter>;
}

/**
 * Store processed transactions locally
 */
export interface StoreTransactionsFunction {
  (transactions: TaxableTransaction[], adapter: StorageAdapter): Promise<void>;
}

/**
 * Retrieve stored transactions with filtering
 */
export interface RetrieveTransactionsFunction {
  (filter: TransactionFilter, adapter: StorageAdapter): Promise<TaxableTransaction[]>;
}

// Configuration interfaces

export interface TaxReportConfig {
  jurisdictionCode: 'AU';
  taxYear: number; // e.g., 2024 represents July 2023 - June 2024
  transactions: Transaction[];
  options?: {
    includeOptimization?: boolean;
    costBasisMethod?: CostBasisMethod;
    investorType?: 'PERSONAL' | 'BUSINESS';
    treatAsBusinessIncome?: boolean;
    handleDeFi?: boolean;
    classifyYieldAsIncome?: boolean;
    classifyLPAsCapital?: boolean;
  };
}

export interface OptimizationConfig {
  jurisdictionCode: 'AU';
  transactions: TaxableTransaction[];
  riskTolerance?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  targetSavings?: number;
  constraints?: string[];
}

export interface PDFExportOptions {
  includeTransactionDetails?: boolean;
  includeOptimizationStrategies?: boolean;
  includeAuditTrail?: boolean;
  template?: 'STANDARD' | 'DETAILED' | 'SUMMARY';
}

export interface ATOExportOptions {
  tfn?: string; // Tax File Number for individuals
  abn?: string; // Australian Business Number for businesses
  includeSupplementarySchedules?: boolean;
  validateBeforeExport?: boolean;
}

export interface TransactionContext {
  previousTransactions?: Transaction[];
  portfolio?: PortfolioSnapshot;
  userProfile?: InvestorProfile;
}

export interface StorageConfig {
  platform: 'browser' | 'mobile-native' | 'mobile-web' | 'node';
  encryptionKey?: string;
  databaseName?: string;
  maxCacheSize?: number; // MB
  compressionEnabled?: boolean;
  indexedFields?: string[];
}

export interface TransactionFilter {
  dateRange?: [Date, Date];
  assets?: string[];
  exchanges?: string[];
  transactionTypes?: string[];
  taxEventTypes?: string[];
  limit?: number;
  offset?: number;
}

// Core data types

export type CostBasisMethod = 'FIFO' | 'SPECIFIC_IDENTIFICATION';

export interface TaxJurisdiction {
  code: 'AU';
  name: string;
  taxYear: {
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
  };
  currency: string;
  cgtDiscountRate: number;
  cgtHoldingPeriod: number; // days
  personalUseThreshold: number;
  supportedMethods: CostBasisMethod[];
  rules: TaxRule[];
}

export interface TaxReport {
  id: string;
  jurisdiction: TaxJurisdiction;
  taxPeriod: TaxPeriod;
  generatedAt: Date;
  transactions: TaxableTransaction[];
  summary: TaxSummary;
  optimizationStrategies?: TaxStrategy[];
  metadata: {
    totalTransactions: number;
    processedExchanges: string[];
    reportVersion: string;
    generationTime: number;
  };
}

export interface TaxPeriod {
  year: number;
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface TaxableTransaction {
  originalTransaction: Transaction;
  taxTreatment: TransactionTaxTreatment;
  costBasis?: CostBasis;
  taxableAmount?: number;
  capitalGain?: number;
  capitalLoss?: number;
  incomeAmount?: number;
  deductibleAmount?: number;
}

export interface TransactionTaxTreatment {
  eventType: 'DISPOSAL' | 'ACQUISITION' | 'INCOME' | 'DEDUCTIBLE' | 'NON_TAXABLE';
  classification: string;
  isPersonalUse: boolean;
  isCgtEligible: boolean;
  cgtDiscountApplied: boolean;
  treatmentReason: string;
  applicableRules: TaxRule[];
}

export interface CostBasis {
  method: CostBasisMethod;
  acquisitionDate: Date;
  acquisitionPrice: number;
  acquisitionFees: number;
  totalCost: number;
  holdingPeriod: number;
  lots: AcquisitionLot[];
}

export interface AcquisitionLot {
  date: Date;
  amount: number;
  unitPrice: number;
  remainingAmount: number;
}

export interface CapitalGainsResult {
  capitalGain?: number;
  capitalLoss?: number;
  cgtDiscountApplied: boolean;
  taxableGain?: number;
  holdingPeriod: number;
}

export interface TaxStrategy {
  type: 'TAX_LOSS_HARVESTING' | 'CGT_DISCOUNT_TIMING' | 'PERSONAL_USE_CLASSIFICATION' | 'DISPOSAL_TIMING' | 'LOT_SELECTION';
  description: string;
  potentialSavings: number;
  implementation: string[];
  risks: string[];
  compliance: 'SAFE' | 'MODERATE' | 'AGGRESSIVE';
  priority: number; // 1-5
}

export interface TaxRule {
  id: string;
  jurisdiction: string;
  name: string;
  description: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  category: 'CAPITAL_GAINS' | 'INCOME' | 'DEDUCTIONS' | 'EXEMPTIONS' | 'REPORTING';
  applicableTransactionTypes: string[];
  calculationLogic: string;
}

export interface TaxSummary {
  totalDisposals: number;
  totalAcquisitions: number;
  totalCapitalGains: number;
  totalCapitalLosses: number;
  netCapitalGain: number;
  cgtDiscount: number;
  taxableCapitalGain: number;
  ordinaryIncome: number;
  totalDeductions: number;
  netTaxableAmount: number;
  byAsset: Map<string, AssetSummary>;
  byExchange: Map<string, ExchangeSummary>;
  byMonth: Map<string, MonthlySummary>;
}

export interface AssetSummary {
  asset: string;
  disposals: number;
  acquisitions: number;
  netGain: number;
  netLoss: number;
}

export interface ExchangeSummary {
  exchange: string;
  transactions: number;
  totalValue: number;
  netGain: number;
}

export interface MonthlySummary {
  month: string;
  transactions: number;
  gains: number;
  losses: number;
}

export interface PortfolioSnapshot {
  holdings: Map<string, number>;
  totalValue: number;
  lastUpdated: Date;
}

export interface InvestorProfile {
  type: 'PERSONAL' | 'BUSINESS';
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  tradingFrequency: 'OCCASIONAL' | 'REGULAR' | 'FREQUENT';
  investmentGoals: string[];
}

// Stream processing interfaces for large datasets

export interface TaxReportStreamConfig extends TaxReportConfig {
  transactionStream?: AsyncIterable<Transaction>;
  batchSize?: number;
  onProgress?: (progress: ProgressUpdate) => void;
  onError?: (error: TaxCalculationError) => void;
}

export interface ProgressUpdate {
  processed: number;
  total: number;
  currentBatch: number;
  estimatedTimeRemaining?: number;
}

export interface TaxCalculationError extends Error {
  code: string;
  transaction?: Transaction;
  details?: Record<string, unknown>;
}

// CLI interface definitions

export interface CLITaxReportOptions {
  input: string; // Input file path
  jurisdiction: 'AU';
  year: number;
  outputPdf?: string;
  outputAto?: string;
  costBasisMethod?: CostBasisMethod;
  includeOptimization?: boolean;
  tfn?: string;
  abn?: string;
}

/**
 * Main CLI function for generating tax reports
 */
export interface GenerateTaxReportCLIFunction {
  (options: CLITaxReportOptions): Promise<void>;
}

// Validation interfaces

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  transaction?: Transaction;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  transaction?: Transaction;
  recommendation?: string;
}

export interface ValidateTransactionsFunction {
  (transactions: Transaction[], jurisdiction: string): ValidationResult;
}

export interface ValidateTaxReportFunction {
  (report: TaxReport): ValidationResult;
}

// Testing utilities interfaces

export interface TaxTestUtilities {
  createMockTransactions: (count: number, options?: MockTransactionOptions) => Transaction[];
  createTestJurisdiction: (overrides?: Partial<TaxJurisdiction>) => TaxJurisdiction;
  validateTaxCalculations: (report: TaxReport) => ValidationResult;
  compareTaxReports: (report1: TaxReport, report2: TaxReport) => ComparisonResult;
}

export interface MockTransactionOptions {
  dateRange?: [Date, Date];
  assets?: string[];
  exchanges?: string[];
  transactionTypes?: string[];
  includeDefi?: boolean;
}

export interface ComparisonResult {
  identical: boolean;
  differences: TaxReportDifference[];
  summaryDiff: Partial<TaxSummary>;
}

export interface TaxReportDifference {
  field: string;
  value1: unknown;
  value2: unknown;
  significance: 'MINOR' | 'MAJOR' | 'CRITICAL';
}

// Storage interfaces for offline functionality

export interface StorageAdapter {
  // Core transaction operations
  batchInsert(transactions: TaxableTransaction[]): Promise<void>;
  query(filter: TransactionFilter): Promise<TaxableTransaction[]>;
  update(id: string, updates: Partial<TaxableTransaction>): Promise<void>;
  delete(id: string): Promise<void>;

  // Tax calculation caching
  cacheTaxCalculation(key: string, result: any): Promise<void>;
  getCachedCalculation(key: string): Promise<any>;
  clearCache(): Promise<void>;

  // Report storage
  storeReport(report: TaxReport): Promise<void>;
  getReport(id: string): Promise<TaxReport | null>;
  listReports(): Promise<TaxReportSummary[]>;

  // Analytics and aggregations
  getTransactionsByDateRange(start: Date, end: Date): Promise<TaxableTransaction[]>;
  getTransactionsByAsset(asset: string): Promise<TaxableTransaction[]>;
  getTaxableEvents(year: number): Promise<TaxEvent[]>;

  // Storage management
  getStorageStats(): Promise<StorageStats>;
  cleanup(olderThan?: Date): Promise<void>;
  export(): Promise<string>;
  import(data: string): Promise<void>;
}

export interface TaxReportSummary {
  id: string;
  jurisdiction: string;
  taxYear: number;
  generatedAt: Date;
  transactionCount: number;
  netTaxableAmount: number;
}

export interface StorageStats {
  totalTransactions: number;
  totalReports: number;
  cacheSize: number; // bytes
  storageUsed: number; // bytes
  storageAvailable: number; // bytes
  platform: string;
}