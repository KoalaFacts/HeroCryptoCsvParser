/**
 * Tax Rules Index
 *
 * Exports all tax rules and jurisdiction configurations.
 */

export {
  AUSTRALIAN_JURISDICTION,
  CGTDiscountRules,
  PersonalUseAssetRules,
  DeFiClassificationRules,
  getAustralianTaxRules,
  getAustralianJurisdiction,
  getAustralianTaxYearBoundaries
} from './AustralianTaxRules';

export type { TaxRule, RuleCategory } from '../models/TaxRule';
export type { TaxJurisdiction, CostBasisMethod } from '../models/TaxJurisdiction';
