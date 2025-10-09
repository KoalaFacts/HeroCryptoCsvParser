/**
 * Tax Optimization Service
 *
 * High-level service for generating tax optimization strategies.
 * Wraps the TaxOptimizationEngine with additional business logic.
 */

import {
  type OptimizationContext,
  TaxOptimizationEngine,
} from "./calculators/TaxOptimizationEngine";
import type { TaxableTransaction } from "./models/TaxableTransaction";
import type { TaxJurisdiction } from "./models/TaxJurisdiction";
import type { TaxStrategy } from "./models/TaxStrategy";

/**
 * Tax Optimization Service
 */
export class TaxOptimizationService {
  private engine: TaxOptimizationEngine;
  private jurisdiction: TaxJurisdiction;

  constructor(jurisdiction: TaxJurisdiction) {
    this.engine = new TaxOptimizationEngine();
    this.jurisdiction = jurisdiction;
  }

  /**
   * Generate optimization strategies for transactions
   */
  generateStrategies(
    transactions: TaxableTransaction[],
    taxYear: number,
    options?: {
      riskTolerance?: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
    },
  ): TaxStrategy[] {
    const context: OptimizationContext = {
      transactions,
      jurisdiction: this.jurisdiction,
      taxYear,
      riskTolerance: options?.riskTolerance || "MODERATE",
    };

    return this.engine.generateStrategies(context);
  }

  /**
   * Get jurisdiction configuration
   */
  getJurisdiction(): TaxJurisdiction {
    return this.jurisdiction;
  }

  /**
   * Update jurisdiction
   */
  setJurisdiction(jurisdiction: TaxJurisdiction): void {
    this.jurisdiction = jurisdiction;
  }
}

/**
 * Create a tax optimization service
 */
export function createTaxOptimizationService(
  jurisdiction: TaxJurisdiction,
): TaxOptimizationService {
  return new TaxOptimizationService(jurisdiction);
}
