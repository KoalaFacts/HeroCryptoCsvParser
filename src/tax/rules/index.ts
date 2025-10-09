/**
 * Tax Rules Index
 *
 * Exports all tax rules and jurisdiction configurations.
 */

export type {
	CostBasisMethod,
	TaxJurisdiction,
} from "../models/TaxJurisdiction";

export type { RuleCategory, TaxRule } from "../models/TaxRule";
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
} from "./AustralianTaxRules";
