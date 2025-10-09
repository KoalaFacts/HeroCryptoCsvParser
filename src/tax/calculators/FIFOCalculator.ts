/**
 * FIFO (First-In-First-Out) Cost Basis Calculator
 *
 * Implements FIFO method for cryptocurrency cost basis calculations.
 * Processes acquisition lots in chronological order to determine cost basis for disposals.
 */

import type { Transaction } from "../../types/transactions";
import type { AcquisitionLot, CostBasis } from "../models/CostBasis";
import {
  getAssetKey,
  getBaseAmount,
  getQuoteAmount,
  getTransactionFee,
  getTransactionTimestamp,
} from "../utils/transactionHelpers";

/**
 * Acquisition lot tracking for FIFO calculations
 */
interface FIFOLot {
  date: Date;
  amount: number;
  unitPrice: number;
  remainingAmount: number;
  transactionId?: string;
}

/**
 * FIFO calculation result
 */
export interface FIFOResult {
  costBasis: CostBasis;
  usedLots: AcquisitionLot[];
  remainingLots: FIFOLot[];
}

/**
 * FIFO Calculator for cost basis determination
 */
export class FIFOCalculator {
  private lotsByAsset: Map<string, FIFOLot[]> = new Map();

  /**
   * Add an acquisition to the FIFO queue
   *
   * @param transaction Acquisition transaction
   */
  addAcquisition(transaction: Transaction): void {
    const asset = getAssetKey(transaction);

    if (!this.lotsByAsset.has(asset)) {
      this.lotsByAsset.set(asset, []);
    }

    const lots = this.lotsByAsset.get(asset)!;

    const lot: FIFOLot = {
      date: getTransactionTimestamp(transaction),
      amount: Math.abs(getBaseAmount(transaction)),
      unitPrice: this.calculateUnitPrice(transaction),
      remainingAmount: Math.abs(getBaseAmount(transaction)),
      transactionId: transaction.id,
    };

    // Insert in chronological order
    this.insertLotInOrder(lots, lot);
  }

  /**
   * Calculate cost basis for a disposal using FIFO method
   *
   * @param disposal Disposal transaction
   * @param acquisitions Available acquisition transactions
   * @returns Cost basis result
   */
  calculateCostBasis(
    disposal: Transaction,
    acquisitions: Transaction[],
  ): CostBasis {
    const asset = getAssetKey(disposal);
    const disposalAmount = Math.abs(getBaseAmount(disposal));

    // Build FIFO queue from acquisitions
    this.rebuildLots(asset, acquisitions);

    const lots = this.lotsByAsset.get(asset) || [];
    const usedLots: AcquisitionLot[] = [];
    let remainingToMatch = disposalAmount;
    let totalCost = 0;
    let totalFees = 0;

    // Process lots in FIFO order
    for (const lot of lots) {
      if (remainingToMatch <= 0) {
        break;
      }

      if (lot.remainingAmount <= 0) {
        continue;
      }

      const amountToUse = Math.min(remainingToMatch, lot.remainingAmount);
      const costForLot = amountToUse * lot.unitPrice;

      usedLots.push({
        date: lot.date,
        amount: amountToUse,
        unitPrice: lot.unitPrice,
        remainingAmount: lot.remainingAmount - amountToUse,
      });

      totalCost += costForLot;
      lot.remainingAmount -= amountToUse;
      remainingToMatch -= amountToUse;
    }

    // Calculate fees proportionally
    const feeAmount = getTransactionFee(disposal);
    if (feeAmount > 0) {
      totalFees = Math.abs(feeAmount);
    }

    // Handle insufficient lots
    if (remainingToMatch > 0.000001) {
      // Allow for floating point precision
      throw new Error(
        `Insufficient acquisition lots for disposal. ` +
          `Asset: ${asset}, Required: ${disposalAmount}, Available: ${disposalAmount - remainingToMatch}`,
      );
    }

    // Calculate holding period (from earliest lot used)
    const earliestLot = usedLots[0];
    const disposalDate = getTransactionTimestamp(disposal);
    const holdingPeriod = earliestLot
      ? Math.floor(
          (disposalDate.getTime() - earliestLot.date.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      method: "FIFO",
      acquisitionDate: earliestLot?.date || disposalDate,
      acquisitionPrice: totalCost,
      acquisitionFees: totalFees,
      totalCost: totalCost + totalFees,
      holdingPeriod,
      lots: usedLots,
    };
  }

  /**
   * Get remaining lots for an asset
   *
   * @param asset Asset symbol
   * @returns Remaining acquisition lots
   */
  getRemainingLots(asset: string): FIFOLot[] {
    const normalizedAsset = this.normalizeAsset(asset);
    return (this.lotsByAsset.get(normalizedAsset) || []).filter(
      (lot) => lot.remainingAmount > 0,
    );
  }

  /**
   * Get total remaining balance for an asset
   *
   * @param asset Asset symbol
   * @returns Total remaining amount
   */
  getRemainingBalance(asset: string): number {
    const lots = this.getRemainingLots(asset);
    return lots.reduce((sum, lot) => sum + lot.remainingAmount, 0);
  }

  /**
   * Clear all lots
   */
  clear(): void {
    this.lotsByAsset.clear();
  }

  /**
   * Clear lots for specific asset
   *
   * @param asset Asset symbol
   */
  clearAsset(asset: string): void {
    const normalizedAsset = this.normalizeAsset(asset);
    this.lotsByAsset.delete(normalizedAsset);
  }

  /**
   * Calculate average cost basis for remaining lots
   *
   * @param asset Asset symbol
   * @returns Average unit price
   */
  getAverageCostBasis(asset: string): number {
    const lots = this.getRemainingLots(asset);

    if (lots.length === 0) {
      return 0;
    }

    const totalValue = lots.reduce(
      (sum, lot) => sum + lot.remainingAmount * lot.unitPrice,
      0,
    );
    const totalAmount = lots.reduce((sum, lot) => sum + lot.remainingAmount, 0);

    return totalAmount > 0 ? totalValue / totalAmount : 0;
  }

  /**
   * Export current state for persistence
   *
   * @returns Serialized state
   */
  exportState(): string {
    const state = {
      lots: Array.from(this.lotsByAsset.entries()).map(([asset, lots]) => ({
        asset,
        lots: lots.map((lot) => ({
          date: lot.date.toISOString(),
          amount: lot.amount,
          unitPrice: lot.unitPrice,
          remainingAmount: lot.remainingAmount,
          transactionId: lot.transactionId,
        })),
      })),
    };

    return JSON.stringify(state);
  }

  /**
   * Import state from persistence
   *
   * @param serializedState Serialized state
   */
  importState(serializedState: string): void {
    try {
      const state = JSON.parse(serializedState);

      this.lotsByAsset.clear();

      for (const { asset, lots } of state.lots) {
        const fifoLots: FIFOLot[] = lots.map(
          (lot: Omit<FIFOLot, "date"> & { date: string }) => ({
            date: new Date(lot.date),
            amount: lot.amount,
            unitPrice: lot.unitPrice,
            remainingAmount: lot.remainingAmount,
            transactionId: lot.transactionId,
          }),
        );

        this.lotsByAsset.set(asset, fifoLots);
      }
    } catch (error) {
      throw new Error(`Failed to import FIFO state: ${error}`);
    }
  }

  // Private helper methods

  /**
   * Rebuild lots from acquisition transactions
   *
   * @param asset Asset symbol
   * @param acquisitions Acquisition transactions
   */
  private rebuildLots(asset: string, acquisitions: Transaction[]): void {
    const normalizedAsset = asset; // Already normalized via getAssetKey

    // Clear existing lots for this asset
    this.lotsByAsset.set(normalizedAsset, []);

    // Sort acquisitions by date
    const sortedAcquisitions = acquisitions
      .filter((tx) => getAssetKey(tx) === normalizedAsset)
      .sort(
        (a, b) =>
          getTransactionTimestamp(a).getTime() -
          getTransactionTimestamp(b).getTime(),
      );

    // Add each acquisition
    for (const acquisition of sortedAcquisitions) {
      this.addAcquisition(acquisition);
    }
  }

  /**
   * Insert lot in chronological order
   *
   * @param lots Existing lots array
   * @param newLot New lot to insert
   */
  private insertLotInOrder(lots: FIFOLot[], newLot: FIFOLot): void {
    let insertIndex = lots.length;

    for (let i = 0; i < lots.length; i++) {
      if (newLot.date < lots[i].date) {
        insertIndex = i;
        break;
      }
    }

    lots.splice(insertIndex, 0, newLot);
  }

  /**
   * Calculate unit price from transaction
   *
   * @param transaction Transaction
   * @returns Unit price
   */
  private calculateUnitPrice(transaction: Transaction): number {
    const amount = Math.abs(getBaseAmount(transaction));

    if (amount === 0) {
      return 0;
    }

    // If quote amount exists, use it to calculate price
    const quoteAmt = getQuoteAmount(transaction);
    if (quoteAmt) {
      return Math.abs(quoteAmt) / amount;
    }

    // Fallback to transaction value or 0
    return 0;
  }

  /**
   * Normalize asset symbol for consistent matching
   *
   * @param asset Asset symbol
   * @returns Normalized asset symbol
   */
  private normalizeAsset(asset: string): string {
    return asset.toUpperCase().trim();
  }
}

/**
 * Create a FIFO calculator instance
 *
 * @returns New FIFO calculator
 */
export function createFIFOCalculator(): FIFOCalculator {
  return new FIFOCalculator();
}

/**
 * Calculate cost basis for a single disposal using FIFO
 *
 * @param disposal Disposal transaction
 * @param acquisitions Available acquisition transactions
 * @returns Cost basis
 */
export function calculateFIFOCostBasis(
  disposal: Transaction,
  acquisitions: Transaction[],
): CostBasis {
  const calculator = createFIFOCalculator();
  return calculator.calculateCostBasis(disposal, acquisitions);
}
