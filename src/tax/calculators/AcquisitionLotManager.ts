/**
 * Acquisition Lot Manager
 *
 * Manages acquisition lots for partial disposals across multiple cost basis methods.
 * Tracks remaining balances and provides querying capabilities.
 */

import type { Transaction } from '../../types/transactions';
import type { AcquisitionLot } from '../models/CostBasis';
import {
  getTransactionAsset,
  getTransactionTimestamp,
  getBaseAmount,
  getAssetKey
} from '../utils/transactionHelpers';

/**
 * Managed acquisition lot with tracking metadata
 */
export interface ManagedLot extends AcquisitionLot {
  transactionId: string;
  originalAmount: number;
  usedAmount: number;
}

/**
 * Lot disposal record
 */
export interface LotDisposal {
  lotId: string;
  disposalId: string;
  amount: number;
  timestamp: Date;
}

/**
 * Acquisition Lot Manager
 */
export class AcquisitionLotManager {
  private lotsByAsset: Map<string, ManagedLot[]> = new Map();
  private disposalHistory: LotDisposal[] = [];

  /**
   * Add an acquisition lot
   */
  addLot(transaction: Transaction): ManagedLot {
    const asset = getAssetKey(transaction);
    const amount = Math.abs(getBaseAmount(transaction));
    const date = getTransactionTimestamp(transaction);

    const lot: ManagedLot = {
      date,
      amount,
      unitPrice: this.calculateUnitPrice(transaction),
      remainingAmount: amount,
      transactionId: transaction.id,
      originalAmount: amount,
      usedAmount: 0
    };

    if (!this.lotsByAsset.has(asset)) {
      this.lotsByAsset.set(asset, []);
    }

    const lots = this.lotsByAsset.get(asset)!;
    lots.push(lot);

    // Keep sorted by date
    lots.sort((a, b) => a.date.getTime() - b.date.getTime());

    return lot;
  }

  /**
   * Add multiple acquisition lots
   */
  addLots(transactions: Transaction[]): ManagedLot[] {
    return transactions.map(tx => this.addLot(tx));
  }

  /**
   * Use amount from a specific lot (partial disposal)
   */
  useLot(
    asset: string,
    transactionId: string,
    amount: number,
    disposalId: string
  ): void {
    const lots = this.lotsByAsset.get(asset);

    if (!lots) {
      throw new Error(`No lots found for asset: ${asset}`);
    }

    const lot = lots.find(l => l.transactionId === transactionId);

    if (!lot) {
      throw new Error(
        `Lot not found. Asset: ${asset}, Transaction ID: ${transactionId}`
      );
    }

    if (amount > lot.remainingAmount) {
      throw new Error(
        `Insufficient amount in lot. Requested: ${amount}, Available: ${lot.remainingAmount}`
      );
    }

    lot.remainingAmount -= amount;
    lot.usedAmount += amount;

    // Record disposal
    this.disposalHistory.push({
      lotId: transactionId,
      disposalId,
      amount,
      timestamp: new Date()
    });
  }

  /**
   * Get all lots for an asset
   */
  getLots(asset: string): ManagedLot[] {
    return this.lotsByAsset.get(asset) || [];
  }

  /**
   * Get only remaining (unused) lots for an asset
   */
  getRemainingLots(asset: string): ManagedLot[] {
    const lots = this.getLots(asset);
    return lots.filter(lot => lot.remainingAmount > 0.000001); // Floating point tolerance
  }

  /**
   * Get total remaining balance for an asset
   */
  getRemainingBalance(asset: string): number {
    const lots = this.getRemainingLots(asset);
    return lots.reduce((sum, lot) => sum + lot.remainingAmount, 0);
  }

  /**
   * Get lots acquired within a date range
   */
  getLotsByDateRange(
    asset: string,
    startDate: Date,
    endDate: Date
  ): ManagedLot[] {
    const lots = this.getLots(asset);
    return lots.filter(
      lot => lot.date >= startDate && lot.date <= endDate
    );
  }

  /**
   * Get lots with holding period greater than specified days
   */
  getLotsByHoldingPeriod(
    asset: string,
    minDays: number,
    referenceDate: Date = new Date()
  ): ManagedLot[] {
    const lots = this.getLots(asset);
    return lots.filter(lot => {
      const holdingDays = Math.floor(
        (referenceDate.getTime() - lot.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      return holdingDays >= minDays;
    });
  }

  /**
   * Get average cost basis for remaining lots
   */
  getAverageCostBasis(asset: string): number {
    const lots = this.getRemainingLots(asset);

    if (lots.length === 0) {
      return 0;
    }

    const totalValue = lots.reduce(
      (sum, lot) => sum + lot.remainingAmount * lot.unitPrice,
      0
    );
    const totalAmount = lots.reduce(
      (sum, lot) => sum + lot.remainingAmount,
      0
    );

    return totalAmount > 0 ? totalValue / totalAmount : 0;
  }

  /**
   * Get disposal history for a specific lot
   */
  getDisposalHistory(transactionId: string): LotDisposal[] {
    return this.disposalHistory.filter(d => d.lotId === transactionId);
  }

  /**
   * Get all disposals for an asset
   */
  getAssetDisposalHistory(asset: string): LotDisposal[] {
    const lots = this.getLots(asset);
    const lotIds = new Set(lots.map(l => l.transactionId));

    return this.disposalHistory.filter(d => lotIds.has(d.lotId));
  }

  /**
   * Clear all lots for an asset
   */
  clearAsset(asset: string): void {
    this.lotsByAsset.delete(asset);

    // Remove disposal history for this asset
    const lots = this.getLots(asset);
    const lotIds = new Set(lots.map(l => l.transactionId));
    this.disposalHistory = this.disposalHistory.filter(
      d => !lotIds.has(d.lotId)
    );
  }

  /**
   * Clear all lots
   */
  clear(): void {
    this.lotsByAsset.clear();
    this.disposalHistory = [];
  }

  /**
   * Get summary statistics for an asset
   */
  getAssetSummary(asset: string): {
    totalAcquired: number;
    totalUsed: number;
    totalRemaining: number;
    averageCostBasis: number;
    lotCount: number;
    activeLotCount: number;
  } {
    const lots = this.getLots(asset);
    const remainingLots = this.getRemainingLots(asset);

    return {
      totalAcquired: lots.reduce((sum, lot) => sum + lot.originalAmount, 0),
      totalUsed: lots.reduce((sum, lot) => sum + lot.usedAmount, 0),
      totalRemaining: remainingLots.reduce((sum, lot) => sum + lot.remainingAmount, 0),
      averageCostBasis: this.getAverageCostBasis(asset),
      lotCount: lots.length,
      activeLotCount: remainingLots.length
    };
  }

  /**
   * Export state for persistence
   */
  exportState(): string {
    const state = {
      lots: Array.from(this.lotsByAsset.entries()).map(([asset, lots]) => ({
        asset,
        lots: lots.map(lot => ({
          ...lot,
          date: lot.date.toISOString()
        }))
      })),
      disposalHistory: this.disposalHistory.map(d => ({
        ...d,
        timestamp: d.timestamp.toISOString()
      }))
    };

    return JSON.stringify(state);
  }

  /**
   * Import state from persistence
   */
  importState(serializedState: string): void {
    try {
      const state = JSON.parse(serializedState);

      this.lotsByAsset.clear();
      this.disposalHistory = [];

      for (const { asset, lots } of state.lots) {
        const managedLots: ManagedLot[] = lots.map((lot: any) => ({
          ...lot,
          date: new Date(lot.date)
        }));

        this.lotsByAsset.set(asset, managedLots);
      }

      this.disposalHistory = state.disposalHistory.map((d: any) => ({
        ...d,
        timestamp: new Date(d.timestamp)
      }));
    } catch (error) {
      throw new Error(`Failed to import lot manager state: ${error}`);
    }
  }

  /**
   * Calculate unit price from transaction
   */
  private calculateUnitPrice(transaction: Transaction): number {
    const amount = Math.abs(getBaseAmount(transaction));

    if (amount === 0) {
      return 0;
    }

    if (transaction.type === 'SPOT_TRADE') {
      const quoteAmount = Math.abs(transaction.quoteAsset.amount.toNumber());
      return quoteAmount / amount;
    }

    return 0;
  }
}

/**
 * Create an acquisition lot manager instance
 */
export function createLotManager(): AcquisitionLotManager {
  return new AcquisitionLotManager();
}
