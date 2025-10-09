/**
 * Capital Gains Calculator
 *
 * Calculates capital gains and losses for cryptocurrency transactions.
 * Supports jurisdiction-specific rules including CGT discount and personal use exemptions.
 */

import type { Transaction } from "../../types/transactions";
import type { CostBasis } from "../models/CostBasis";
import type { TaxJurisdiction } from "../models/TaxJurisdiction";
import {
  getDisposalValue,
  getTransactionAsset,
  getTransactionTimestamp,
  isSameAsset,
} from "../utils/transactionHelpers";

/**
 * Capital gains calculation result
 */
export interface CapitalGainsResult {
  capitalGain?: number;
  capitalLoss?: number;
  cgtDiscountApplied: boolean;
  taxableGain?: number;
  holdingPeriod: number;
  isPersonalUse: boolean;
  exemptionApplied: boolean;
  disposalValue: number;
  costBasisValue: number;
  netGainLoss: number;
}

/**
 * Capital gains calculation context
 */
export interface CapitalGainsContext {
  disposal: Transaction;
  costBasis: CostBasis;
  jurisdiction: TaxJurisdiction;
  isPersonalUseAsset?: boolean;
}

/**
 * Calculator for capital gains and losses
 */
export class CapitalGainsCalculator {
  /**
   * Calculate capital gains for a disposal transaction
   *
   * @param context Calculation context
   * @returns Capital gains result
   */
  calculateCapitalGains(context: CapitalGainsContext): CapitalGainsResult {
    const {
      disposal,
      costBasis,
      jurisdiction,
      isPersonalUseAsset = false,
    } = context;

    // Calculate disposal value
    const disposalValue = this.calculateDisposalValue(disposal);

    // Calculate cost basis value
    const costBasisValue = costBasis.totalCost;

    // Calculate net gain/loss
    const netGainLoss = disposalValue - costBasisValue;

    // Check if CGT discount applies
    const cgtDiscountApplied = this.isCGTDiscountEligible(
      costBasis.holdingPeriod,
      jurisdiction,
      isPersonalUseAsset,
    );

    // Check if personal use exemption applies
    const exemptionApplied = this.isPersonalUseExempt(
      costBasisValue,
      jurisdiction,
      isPersonalUseAsset,
    );

    // Build result
    const result: CapitalGainsResult = {
      holdingPeriod: costBasis.holdingPeriod,
      isPersonalUse: isPersonalUseAsset,
      exemptionApplied,
      disposalValue,
      costBasisValue,
      netGainLoss,
      cgtDiscountApplied: false,
    };

    // Apply exemptions if applicable
    if (exemptionApplied) {
      // Personal use asset exemption - no taxable gain or loss
      result.capitalGain = 0;
      result.capitalLoss = 0;
      result.taxableGain = 0;
      return result;
    }

    // Calculate capital gain or loss
    if (netGainLoss > 0) {
      result.capitalGain = netGainLoss;
      result.capitalLoss = 0;

      // Apply CGT discount if eligible
      if (cgtDiscountApplied) {
        result.cgtDiscountApplied = true;
        result.taxableGain = netGainLoss * (1 - jurisdiction.cgtDiscountRate);
      } else {
        result.taxableGain = netGainLoss;
      }
    } else {
      result.capitalGain = 0;
      result.capitalLoss = Math.abs(netGainLoss);
      result.taxableGain = 0;
    }

    return result;
  }

  /**
   * Calculate aggregate capital gains for multiple disposals
   *
   * @param contexts Array of calculation contexts
   * @returns Aggregated results
   */
  calculateAggregateCapitalGains(contexts: CapitalGainsContext[]): {
    totalCapitalGains: number;
    totalCapitalLosses: number;
    netCapitalGain: number;
    totalCGTDiscount: number;
    totalTaxableGain: number;
    results: CapitalGainsResult[];
  } {
    const results = contexts.map((ctx) => this.calculateCapitalGains(ctx));

    const totalCapitalGains = results.reduce(
      (sum, r) => sum + (r.capitalGain || 0),
      0,
    );

    const totalCapitalLosses = results.reduce(
      (sum, r) => sum + (r.capitalLoss || 0),
      0,
    );

    const netCapitalGain = totalCapitalGains - totalCapitalLosses;

    const totalTaxableGain = results.reduce(
      (sum, r) => sum + (r.taxableGain || 0),
      0,
    );

    const totalCGTDiscount = totalCapitalGains - totalTaxableGain;

    return {
      totalCapitalGains,
      totalCapitalLosses,
      netCapitalGain,
      totalCGTDiscount,
      totalTaxableGain,
      results,
    };
  }

  /**
   * Calculate capital gains summary by asset
   *
   * @param contexts Array of calculation contexts
   * @returns Summary by asset
   */
  calculateByAsset(contexts: CapitalGainsContext[]): Map<
    string,
    {
      totalGains: number;
      totalLosses: number;
      netGainLoss: number;
      taxableAmount: number;
    }
  > {
    const byAsset = new Map<
      string,
      {
        totalGains: number;
        totalLosses: number;
        netGainLoss: number;
        taxableAmount: number;
      }
    >();

    for (const context of contexts) {
      const asset = (
        getTransactionAsset(context.disposal) || "UNKNOWN"
      ).toUpperCase();
      const result = this.calculateCapitalGains(context);

      if (!byAsset.has(asset)) {
        byAsset.set(asset, {
          totalGains: 0,
          totalLosses: 0,
          netGainLoss: 0,
          taxableAmount: 0,
        });
      }

      const summary = byAsset.get(asset)!;
      summary.totalGains += result.capitalGain || 0;
      summary.totalLosses += result.capitalLoss || 0;
      summary.netGainLoss += result.netGainLoss;
      summary.taxableAmount += result.taxableGain || 0;
    }

    return byAsset;
  }

  /**
   * Calculate wash sale adjustment (for jurisdictions that apply wash sale rules)
   * Note: Australia doesn't have wash sale rules, but included for extensibility
   *
   * @param disposal Disposal transaction
   * @param reacquisitions Reacquisition transactions within wash sale period
   * @param washSalePeriod Period in days
   * @returns Wash sale adjustment amount
   */
  calculateWashSaleAdjustment(
    disposal: Transaction,
    reacquisitions: Transaction[],
    washSalePeriod: number = 30,
  ): number {
    // Check for reacquisitions within wash sale period
    const disposalDate = getTransactionTimestamp(disposal);
    const washSaleEnd = new Date(
      disposalDate.getTime() + washSalePeriod * 24 * 60 * 60 * 1000,
    );

    const washSaleReacquisitions = reacquisitions.filter(
      (tx) =>
        getTransactionTimestamp(tx) >= disposalDate &&
        getTransactionTimestamp(tx) <= washSaleEnd &&
        isSameAsset(tx, disposal),
    );

    if (washSaleReacquisitions.length === 0) {
      return 0;
    }

    // Calculate wash sale adjustment
    // This would defer the loss and adjust cost basis of reacquisition
    // Implementation depends on jurisdiction-specific rules
    return 0;
  }

  // Private helper methods

  /**
   * Calculate disposal value from transaction
   *
   * @param disposal Disposal transaction
   * @returns Disposal value
   */
  private calculateDisposalValue(disposal: Transaction): number {
    // Use helper function to get disposal value safely
    return getDisposalValue(disposal);
  }

  /**
   * Check if CGT discount is eligible
   *
   * @param holdingPeriod Holding period in days
   * @param jurisdiction Tax jurisdiction
   * @param isPersonalUse Is personal use asset
   * @returns True if CGT discount applies
   */
  private isCGTDiscountEligible(
    holdingPeriod: number,
    jurisdiction: TaxJurisdiction,
    isPersonalUse: boolean,
  ): boolean {
    // No CGT discount for personal use assets
    if (isPersonalUse) {
      return false;
    }

    // Check if holding period meets jurisdiction requirement
    return holdingPeriod >= jurisdiction.cgtHoldingPeriod;
  }

  /**
   * Check if personal use exemption applies
   *
   * @param costBasis Cost basis value
   * @param jurisdiction Tax jurisdiction
   * @param isPersonalUse Is personal use asset
   * @returns True if exemption applies
   */
  private isPersonalUseExempt(
    costBasis: number,
    jurisdiction: TaxJurisdiction,
    isPersonalUse: boolean,
  ): boolean {
    // Check Australian personal use asset exemption
    // Applies if acquired for personal use and cost less than $10,000
    return isPersonalUse && costBasis < jurisdiction.personalUseThreshold;
  }
}

/**
 * Create a capital gains calculator instance
 *
 * @returns New calculator
 */
export function createCapitalGainsCalculator(): CapitalGainsCalculator {
  return new CapitalGainsCalculator();
}

/**
 * Calculate capital gains for a single disposal
 *
 * @param disposal Disposal transaction
 * @param costBasis Cost basis
 * @param jurisdiction Tax jurisdiction
 * @param isPersonalUseAsset Is personal use asset
 * @returns Capital gains result
 */
export function calculateCapitalGains(
  disposal: Transaction,
  costBasis: CostBasis,
  jurisdiction: TaxJurisdiction,
  isPersonalUseAsset = false,
): CapitalGainsResult {
  const calculator = createCapitalGainsCalculator();
  return calculator.calculateCapitalGains({
    disposal,
    costBasis,
    jurisdiction,
    isPersonalUseAsset,
  });
}
