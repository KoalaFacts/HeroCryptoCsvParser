/**
 * Tax Models Index
 *
 * Exports all tax-related data models for the crypto tax reporting module.
 * These models implement the interface contracts defined in the function-interfaces.ts file.
 */

// Core Models
export { TaxJurisdictionModel, type TaxJurisdiction, type CostBasisMethod } from './TaxJurisdiction';
export { TaxReportModel, type TaxReport } from './TaxReport';
export { TaxableTransactionModel, type TaxableTransaction } from './TaxableTransaction';
export { TaxPeriodModel, type TaxPeriod } from './TaxPeriod';

// Cost Basis Models
export {
  CostBasisModel,
  AcquisitionLotModel,
  type CostBasis,
  type AcquisitionLot
} from './CostBasis';

// Strategy and Rules Models
export {
  TaxStrategyModel,
  type TaxStrategy,
  type StrategyType,
  type ComplianceLevel
} from './TaxStrategy';

export {
  TaxRuleModel,
  type TaxRule,
  type RuleCategory
} from './TaxRule';

// Summary Models
export {
  TaxSummaryModel,
  AssetSummaryModel,
  ExchangeSummaryModel,
  MonthlySummaryModel,
  type TaxSummary,
  type AssetSummary,
  type ExchangeSummary,
  type MonthlySummary
} from './TaxSummary';

// Treatment Models
export {
  TransactionTaxTreatmentModel,
  type TransactionTaxTreatment,
  type TaxEventType
} from './TransactionTaxTreatment';