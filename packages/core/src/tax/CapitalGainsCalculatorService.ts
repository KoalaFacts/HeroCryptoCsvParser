/**
 * Capital Gains Calculator Service
 *
 * High-level service for calculating capital gains and losses.
 * Wraps the CapitalGainsCalculator with additional business logic.
 */

import type { Transaction } from "../types/transactions";
import {
  CapitalGainsCalculator,
  type CapitalGainsContext,
  type CapitalGainsResult,
} from "./calculators/CapitalGainsCalculator";
import type { CostBasis } from "./models/CostBasis";
import type { TaxJurisdiction } from "./models/TaxJurisdiction";

/**
 * Capital Gains Calculator Service
 */
export class CapitalGainsCalculatorService {
  private calculator: CapitalGainsCalculator;
  private jurisdiction: TaxJurisdiction;

  constructor(jurisdiction: TaxJurisdiction) {
    this.calculator = new CapitalGainsCalculator();
    this.jurisdiction = jurisdiction;
  }

  /**
   * Calculate capital gains for a disposal
   */
  calculateCapitalGains(
    disposal: Transaction,
    costBasis: CostBasis,
    options?: {
      isPersonalUseAsset?: boolean;
    },
  ): CapitalGainsResult {
    const context: CapitalGainsContext = {
      disposal,
      costBasis,
      jurisdiction: this.jurisdiction,
      isPersonalUseAsset: options?.isPersonalUseAsset,
    };

    return this.calculator.calculateCapitalGains(context);
  }

  /**
   * Calculate capital gains for multiple disposals
   */
  calculateBatch(
    disposals: Array<{
      disposal: Transaction;
      costBasis: CostBasis;
      isPersonalUseAsset?: boolean;
    }>,
  ): CapitalGainsResult[] {
    return disposals.map((item) =>
      this.calculateCapitalGains(item.disposal, item.costBasis, {
        isPersonalUseAsset: item.isPersonalUseAsset,
      }),
    );
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
 * Create a capital gains calculator service
 */
export function createCapitalGainsCalculatorService(
  jurisdiction: TaxJurisdiction,
): CapitalGainsCalculatorService {
  return new CapitalGainsCalculatorService(jurisdiction);
}
