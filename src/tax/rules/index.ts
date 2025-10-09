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
	CGTDiscountRules,
	DeFiClassificationRules,
	getAustralianJurisdiction,
	getAustralianTaxRules,
	getAustralianTaxYearBoundaries,
	PersonalUseAssetRules,
} from "./AustralianTaxRules";
