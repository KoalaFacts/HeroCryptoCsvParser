/**
 * Tax Models Index
 *
 * Exports all tax-related data models for the crypto tax reporting module.
 * These models implement the interface contracts defined in the function-interfaces.ts file.
 */

// Cost Basis Models
export {
	type AcquisitionLot,
	AcquisitionLotModel,
	type CostBasis,
	CostBasisModel,
} from "./CostBasis";
export {
	type TaxableTransaction,
	TaxableTransactionModel,
} from "./TaxableTransaction";
// Core Models
export {
	type CostBasisMethod,
	type TaxJurisdiction,
	TaxJurisdictionModel,
} from "./TaxJurisdiction";
export { type TaxPeriod, TaxPeriodModel } from "./TaxPeriod";
export { type TaxReport, TaxReportModel } from "./TaxReport";
export {
	type RuleCategory,
	type TaxRule,
	TaxRuleModel,
} from "./TaxRule";
// Strategy and Rules Models
export {
	type ComplianceLevel,
	type StrategyType,
	type TaxStrategy,
	TaxStrategyModel,
} from "./TaxStrategy";

// Summary Models
export {
	type AssetSummary,
	AssetSummaryModel,
	type ExchangeSummary,
	ExchangeSummaryModel,
	type MonthlySummary,
	MonthlySummaryModel,
	type TaxSummary,
	TaxSummaryModel,
} from "./TaxSummary";

// Treatment Models
export {
	type TaxEventType,
	type TransactionTaxTreatment,
	TransactionTaxTreatmentModel,
} from "./TransactionTaxTreatment";
