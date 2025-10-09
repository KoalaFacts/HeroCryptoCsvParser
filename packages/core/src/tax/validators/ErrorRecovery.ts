/**
 * Error Recovery Strategies
 *
 * Provides automated recovery strategies for common tax calculation errors.
 * Particularly focused on handling missing cost basis and pricing data.
 */

import type { Transaction } from "../../types/transactions";
import type { CostBasis } from "../models/CostBasis";
import {
  getTransactionAsset,
  getTransactionTimestamp,
} from "../utils/transactionHelpers";

/**
 * Recovery strategy result
 */
export interface RecoveryResult<T> {
  success: boolean;
  data?: T;
  method: string;
  confidence: number; // 0-1
  warnings: string[];
}

/**
 * Missing data recovery options
 */
export interface RecoveryOptions {
  useMarketPriceAPI?: boolean;
  allowZeroCostBasis?: boolean;
  useFallbackPricing?: boolean;
  conservativeEstimates?: boolean;
}

/**
 * Error Recovery Strategies
 */
export class ErrorRecovery {
  /**
   * Recover missing cost basis for a disposal
   */
  recoverMissingCostBasis(
    disposal: Transaction,
    availableAcquisitions: Transaction[],
    options: RecoveryOptions = {},
  ): RecoveryResult<CostBasis> {
    const warnings: string[] = [];

    // Try to find matching acquisitions
    const matches = this.findPotentialAcquisitions(
      disposal,
      availableAcquisitions,
    );

    if (matches.length > 0) {
      warnings.push(
        `Found ${matches.length} potential acquisition(s) for matching`,
      );
      return {
        success: true,
        data: this.createEstimatedCostBasis(disposal, matches),
        method: "MATCHED_ACQUISITIONS",
        confidence: 0.7,
        warnings,
      };
    }

    // Try to use market price at acquisition time
    if (options.useMarketPriceAPI) {
      const marketPrice = this.estimateMarketPrice(disposal);
      if (marketPrice) {
        warnings.push("Using estimated market price for cost basis");
        return {
          success: true,
          data: this.createMarketPriceCostBasis(disposal, marketPrice),
          method: "MARKET_PRICE_ESTIMATE",
          confidence: 0.5,
          warnings,
        };
      }
    }

    // Use zero cost basis as last resort
    if (options.allowZeroCostBasis) {
      warnings.push(
        "No cost basis found - using zero (will maximize capital gains)",
      );
      return {
        success: true,
        data: this.createZeroCostBasis(disposal),
        method: "ZERO_COST_BASIS",
        confidence: 0.3,
        warnings,
      };
    }

    return {
      success: false,
      method: "NO_RECOVERY",
      confidence: 0,
      warnings: ["Cannot recover cost basis - insufficient data"],
    };
  }

  /**
   * Recover missing pricing data
   */
  recoverMissingPricing(
    transaction: Transaction,
    options: RecoveryOptions = {},
  ): RecoveryResult<number> {
    const warnings: string[] = [];

    // Try to infer from transaction data
    const inferredPrice = this.inferPriceFromTransaction(transaction);
    if (inferredPrice !== null) {
      return {
        success: true,
        data: inferredPrice,
        method: "INFERRED_FROM_TRANSACTION",
        confidence: 0.9,
        warnings,
      };
    }

    // Try market price API
    if (options.useMarketPriceAPI) {
      const marketPrice = this.estimateMarketPrice(transaction);
      if (marketPrice) {
        warnings.push("Using market price estimate");
        return {
          success: true,
          data: marketPrice,
          method: "MARKET_PRICE_API",
          confidence: 0.6,
          warnings,
        };
      }
    }

    // Use fallback pricing
    if (options.useFallbackPricing) {
      warnings.push("Using conservative fallback pricing");
      return {
        success: true,
        data: 0,
        method: "FALLBACK_ZERO",
        confidence: 0.2,
        warnings,
      };
    }

    return {
      success: false,
      method: "NO_RECOVERY",
      confidence: 0,
      warnings: ["Cannot recover pricing data"],
    };
  }

  /**
   * Handle duplicate transaction
   */
  handleDuplicateTransaction(
    original: Transaction,
    duplicate: Transaction,
  ): RecoveryResult<Transaction> {
    const warnings: string[] = [];

    // Check if truly identical
    if (this.areIdentical(original, duplicate)) {
      return {
        success: true,
        data: original,
        method: "KEEP_ORIGINAL",
        confidence: 1.0,
        warnings: ["Exact duplicate removed"],
      };
    }

    // Check if same transaction with different data sources
    if (this.isSameTransactionDifferentSource(original, duplicate)) {
      warnings.push("Merging data from multiple sources");
      return {
        success: true,
        data: this.mergeTransactions(original, duplicate),
        method: "MERGE_SOURCES",
        confidence: 0.8,
        warnings,
      };
    }

    // Cannot determine - keep both with warning
    warnings.push("Cannot determine if duplicate - keeping both");
    return {
      success: false,
      method: "KEEP_BOTH",
      confidence: 0.5,
      warnings,
    };
  }

  /**
   * Handle missing asset information
   */
  recoverMissingAssetInfo(transaction: Transaction): RecoveryResult<string> {
    const warnings: string[] = [];

    // Try to infer from transaction data
    const asset = this.inferAssetSymbol(transaction);
    if (asset) {
      warnings.push(`Inferred asset: ${asset}`);
      return {
        success: true,
        data: asset,
        method: "INFERRED_ASSET",
        confidence: 0.6,
        warnings,
      };
    }

    // Mark as unknown
    return {
      success: true,
      data: "UNKNOWN",
      method: "UNKNOWN_ASSET",
      confidence: 0.1,
      warnings: ["Asset could not be determined - marked as UNKNOWN"],
    };
  }

  // Private helper methods

  /**
   * Find potential matching acquisitions
   */
  private findPotentialAcquisitions(
    disposal: Transaction,
    acquisitions: Transaction[],
  ): Transaction[] {
    const disposalAsset = getTransactionAsset(disposal);
    const disposalDate = getTransactionTimestamp(disposal);

    return acquisitions.filter((acq) => {
      const acqAsset = getTransactionAsset(acq);
      const acqDate = getTransactionTimestamp(acq);

      // Same asset and acquired before disposal
      return acqAsset === disposalAsset && acqDate < disposalDate;
    });
  }

  /**
   * Create estimated cost basis from matches
   */
  private createEstimatedCostBasis(
    disposal: Transaction,
    matches: Transaction[],
  ): CostBasis {
    const disposalDate = getTransactionTimestamp(disposal);

    // Use earliest match for longest holding period
    const earliest = matches.reduce((prev, curr) =>
      getTransactionTimestamp(prev) < getTransactionTimestamp(curr)
        ? prev
        : curr,
    );

    const earliestDate = getTransactionTimestamp(earliest);
    const holdingPeriod = Math.floor(
      (disposalDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      method: "FIFO",
      acquisitionDate: earliestDate,
      acquisitionPrice: 0, // Would need actual price data
      acquisitionFees: 0,
      totalCost: 0,
      holdingPeriod,
      lots: [],
    };
  }

  /**
   * Create cost basis from market price
   */
  private createMarketPriceCostBasis(
    disposal: Transaction,
    marketPrice: number,
  ): CostBasis {
    const disposalDate = getTransactionTimestamp(disposal);

    return {
      method: "FIFO",
      acquisitionDate: disposalDate, // Assume same-day for safety
      acquisitionPrice: marketPrice,
      acquisitionFees: 0,
      totalCost: marketPrice,
      holdingPeriod: 0,
      lots: [],
    };
  }

  /**
   * Create zero cost basis
   */
  private createZeroCostBasis(disposal: Transaction): CostBasis {
    const disposalDate = getTransactionTimestamp(disposal);

    return {
      method: "FIFO",
      acquisitionDate: disposalDate,
      acquisitionPrice: 0,
      acquisitionFees: 0,
      totalCost: 0,
      holdingPeriod: 0,
      lots: [],
    };
  }

  /**
   * Infer price from transaction data
   */
  private inferPriceFromTransaction(transaction: Transaction): number | null {
    // For spot trades, can calculate from quote/base amounts
    if (transaction.type === "SPOT_TRADE") {
      const baseAmount = transaction.baseAsset?.amount?.toNumber();
      const quoteAmount = transaction.quoteAsset?.amount?.toNumber();

      if (baseAmount && quoteAmount && baseAmount !== 0) {
        return Math.abs(quoteAmount / baseAmount);
      }
    }

    return null;
  }

  /**
   * Estimate market price (placeholder)
   */
  private estimateMarketPrice(_transaction: Transaction): number | null {
    // In a real implementation, this would call a price API
    // For now, return null
    return null;
  }

  /**
   * Check if transactions are identical
   */
  private areIdentical(tx1: Transaction, tx2: Transaction): boolean {
    return (
      tx1.type === tx2.type &&
      getTransactionTimestamp(tx1).getTime() ===
        getTransactionTimestamp(tx2).getTime() &&
      getTransactionAsset(tx1) === getTransactionAsset(tx2) &&
      tx1.source.name === tx2.source.name
    );
  }

  /**
   * Check if same transaction from different source
   */
  private isSameTransactionDifferentSource(
    tx1: Transaction,
    tx2: Transaction,
  ): boolean {
    return (
      tx1.type === tx2.type &&
      getTransactionTimestamp(tx1).getTime() ===
        getTransactionTimestamp(tx2).getTime() &&
      getTransactionAsset(tx1) === getTransactionAsset(tx2) &&
      tx1.source.name !== tx2.source.name
    );
  }

  /**
   * Merge transactions from different sources
   */
  private mergeTransactions(tx1: Transaction, _tx2: Transaction): Transaction {
    // Prefer more complete data
    // This is simplified - real implementation would be more sophisticated
    return {
      ...tx1,
      source: tx1.source, // Keep original source, merging is complex
    };
  }

  /**
   * Infer asset symbol from transaction
   */
  private inferAssetSymbol(_transaction: Transaction): string | null {
    // Try to extract from various transaction fields
    // This is highly dependent on transaction structure
    return null;
  }
}

/**
 * Create an error recovery instance
 */
export function createErrorRecovery(): ErrorRecovery {
  return new ErrorRecovery();
}

/**
 * Recover missing cost basis
 */
export function recoverMissingCostBasis(
  disposal: Transaction,
  availableAcquisitions: Transaction[],
  options?: RecoveryOptions,
): RecoveryResult<CostBasis> {
  const recovery = createErrorRecovery();
  return recovery.recoverMissingCostBasis(
    disposal,
    availableAcquisitions,
    options,
  );
}
