/**
 * Tax Calculators Index
 *
 * Exports all cost basis calculators and related utilities.
 */

// FIFO Calculator
export {
  FIFOCalculator,
  createFIFOCalculator,
  calculateFIFOCostBasis,
  type FIFOResult
} from './FIFOCalculator';

// Specific Identification Calculator
export {
  SpecificIdentificationCalculator,
  createSpecificIdentificationCalculator,
  calculateSpecificIdentificationCostBasis,
  type LotIdentifier
} from './SpecificIdentificationCalculator';

// Acquisition Lot Manager
export {
  AcquisitionLotManager,
  createLotManager,
  type ManagedLot,
  type LotDisposal
} from './AcquisitionLotManager';

// Cost Basis Calculator Factory
export {
  CostBasisCalculatorFactory,
  createCostBasisCalculator,
  calculateCostBasis,
  getSupportedCostBasisMethods,
  type ICostBasisCalculator
} from './CostBasisCalculatorFactory';

// Capital Gains Calculator (existing)
export { CapitalGainsCalculator } from './CapitalGainsCalculator';

// Transaction Classifier (existing)
export { TransactionClassifier } from './TransactionClassifier';

// Tax Optimization Engine (existing)
export { TaxOptimizationEngine } from './TaxOptimizationEngine';

// Re-export types from models
export type { CostBasis, AcquisitionLot, CostBasisMethod } from '../models/CostBasis';
