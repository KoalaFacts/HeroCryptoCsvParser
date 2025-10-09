/**
 * Tax Calculators Index
 *
 * Exports all cost basis calculators and related utilities.
 */

// Re-export types from models
export type {
	AcquisitionLot,
	CostBasis,
	CostBasisMethod,
} from "../models/CostBasis";
// Acquisition Lot Manager
export {
	AcquisitionLotManager,
	createLotManager,
	type LotDisposal,
	type ManagedLot,
} from "./AcquisitionLotManager";
// Capital Gains Calculator (existing)
export { CapitalGainsCalculator } from "./CapitalGainsCalculator";

// Cost Basis Calculator Factory
export {
	CostBasisCalculatorFactory,
	calculateCostBasis,
	createCostBasisCalculator,
	getSupportedCostBasisMethods,
	type ICostBasisCalculator,
} from "./CostBasisCalculatorFactory";
// FIFO Calculator
export {
	calculateFIFOCostBasis,
	createFIFOCalculator,
	FIFOCalculator,
	type FIFOResult,
} from "./FIFOCalculator";
// Specific Identification Calculator
export {
	calculateSpecificIdentificationCostBasis,
	createSpecificIdentificationCalculator,
	type LotIdentifier,
	SpecificIdentificationCalculator,
} from "./SpecificIdentificationCalculator";

// Tax Optimization Engine (existing)
export { TaxOptimizationEngine } from "./TaxOptimizationEngine";
// Transaction Classifier (existing)
export { TransactionClassifier } from "./TransactionClassifier";
