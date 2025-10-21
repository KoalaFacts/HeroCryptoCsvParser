/**
 * TaxReport Model
 *
 * Complete tax report for a jurisdiction and period.
 * Contains all tax-related information for generating reports and compliance documents.
 */

import type { TaxableTransaction } from "./TaxableTransaction";
import type { TaxJurisdiction } from "./TaxJurisdiction";
import type { TaxPeriod } from "./TaxPeriod";
import type { TaxStrategy } from "./TaxStrategy";
import type { TaxSummary } from "./TaxSummary";

export interface TaxReport {
  id: string;
  jurisdiction: TaxJurisdiction;
  taxPeriod: TaxPeriod;
  generatedAt: Date;
  transactions: TaxableTransaction[];
  summary: TaxSummary;
  optimizationStrategies?: TaxStrategy[];
  metadata: {
    totalTransactions: number;
    processedExchanges: string[];
    reportVersion: string;
    generationTime: number; // milliseconds
  };
}

export class TaxReportModel implements TaxReport {
  public readonly id: string;
  public readonly jurisdiction: TaxJurisdiction;
  public readonly taxPeriod: TaxPeriod;
  public readonly generatedAt: Date;
  public readonly transactions: TaxableTransaction[];
  public readonly summary: TaxSummary;
  public readonly optimizationStrategies?: TaxStrategy[];
  public readonly metadata: {
    totalTransactions: number;
    processedExchanges: string[];
    reportVersion: string;
    generationTime: number;
  };

  constructor(data: TaxReport) {
    // Validate required fields
    this.validateInput(data);

    this.id = data.id;
    this.jurisdiction = data.jurisdiction;
    this.taxPeriod = data.taxPeriod;
    this.generatedAt = new Date(data.generatedAt);
    this.transactions = [...data.transactions];
    this.summary = data.summary;
    this.optimizationStrategies = data.optimizationStrategies
      ? [...data.optimizationStrategies]
      : undefined;
    this.metadata = {
      ...data.metadata,
      processedExchanges: [...data.metadata.processedExchanges],
    };
  }

  /**
   * Creates a new tax report with generated ID and timestamp
   */
  public static create(params: {
    jurisdiction: TaxJurisdiction;
    taxPeriod: TaxPeriod;
    transactions: TaxableTransaction[];
    summary: TaxSummary;
    optimizationStrategies?: TaxStrategy[];
    generationTime?: number;
  }): TaxReportModel {
    const processedExchanges = Array.from(
      new Set(
        params.transactions.map((t) => t.originalTransaction.source.name),
      ),
    ).sort();

    return new TaxReportModel({
      id: TaxReportModel.generateId(),
      jurisdiction: params.jurisdiction,
      taxPeriod: params.taxPeriod,
      generatedAt: new Date(),
      transactions: params.transactions,
      summary: params.summary,
      optimizationStrategies: params.optimizationStrategies,
      metadata: {
        totalTransactions: params.transactions.length,
        processedExchanges,
        reportVersion: "1.0.0",
        generationTime: params.generationTime || 0,
      },
    });
  }

  /**
   * Generates a unique ID for the tax report
   */
  private static generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `tax-report-${timestamp}-${random}`;
  }

  /**
   * Validates the input data for tax report
   */
  private validateInput(data: TaxReport): void {
    if (!data) {
      throw new Error("Tax report data is required");
    }

    if (!data.id || data.id.trim().length === 0) {
      throw new Error("Report ID is required");
    }

    if (!data.jurisdiction) {
      throw new Error("Jurisdiction is required");
    }

    if (!data.taxPeriod) {
      throw new Error("Tax period is required");
    }

    if (!data.generatedAt || !(data.generatedAt instanceof Date)) {
      throw new Error(
        "Generated at date is required and must be a Date object",
      );
    }

    if (!Array.isArray(data.transactions)) {
      throw new Error("Transactions must be an array");
    }

    if (!data.summary) {
      throw new Error("Tax summary is required");
    }

    if (!data.metadata) {
      throw new Error("Metadata is required");
    }

    this.validateMetadata(data.metadata);
    this.validateTransactionsInPeriod(data.transactions, data.taxPeriod);
  }

  /**
   * Validates the metadata structure
   */
  private validateMetadata(metadata: TaxReport["metadata"]): void {
    if (
      typeof metadata.totalTransactions !== "number" ||
      metadata.totalTransactions < 0
    ) {
      throw new Error("Total transactions must be a non-negative number");
    }

    if (!Array.isArray(metadata.processedExchanges)) {
      throw new Error("Processed exchanges must be an array");
    }

    if (!metadata.reportVersion || metadata.reportVersion.trim().length === 0) {
      throw new Error("Report version is required");
    }

    if (
      typeof metadata.generationTime !== "number" ||
      metadata.generationTime < 0
    ) {
      throw new Error("Generation time must be a non-negative number");
    }
  }

  /**
   * Validates that all transactions fall within the tax period
   */
  private validateTransactionsInPeriod(
    transactions: TaxableTransaction[],
    taxPeriod: TaxPeriod,
  ): void {
    for (const transaction of transactions) {
      const txDate = new Date(transaction.originalTransaction.timestamp);

      if (txDate < taxPeriod.startDate || txDate > taxPeriod.endDate) {
        throw new Error(
          `Transaction ${transaction.originalTransaction.id} (${txDate.toISOString()}) falls outside tax period ${taxPeriod.startDate.toISOString()} - ${taxPeriod.endDate.toISOString()}`,
        );
      }
    }
  }

  /**
   * Gets transactions for a specific asset
   */
  public getTransactionsByAsset(asset: string): TaxableTransaction[] {
    return this.transactions.filter((transaction) => {
      const originalTx = transaction.originalTransaction;

      // Handle different transaction types that might have asset information
      if (
        "baseAsset" in originalTx &&
        originalTx.baseAsset?.asset?.symbol === asset
      ) {
        return true;
      }

      if (
        "quoteAsset" in originalTx &&
        originalTx.quoteAsset?.asset?.symbol === asset
      ) {
        return true;
      }

      if ("asset" in originalTx && originalTx.asset?.asset?.symbol === asset) {
        return true;
      }

      return false;
    });
  }

  /**
   * Gets transactions from a specific exchange
   */
  public getTransactionsByExchange(exchange: string): TaxableTransaction[] {
    return this.transactions.filter(
      (transaction) =>
        transaction.originalTransaction.source.name.toLowerCase() ===
        exchange.toLowerCase(),
    );
  }

  /**
   * Gets transactions by tax treatment type
   */
  public getTransactionsByTreatment(eventType: string): TaxableTransaction[] {
    return this.transactions.filter(
      (transaction) => transaction.taxTreatment.eventType === eventType,
    );
  }

  /**
   * Gets disposal transactions (for capital gains calculations)
   */
  public getDisposals(): TaxableTransaction[] {
    return this.getTransactionsByTreatment("DISPOSAL");
  }

  /**
   * Gets acquisition transactions
   */
  public getAcquisitions(): TaxableTransaction[] {
    return this.getTransactionsByTreatment("ACQUISITION");
  }

  /**
   * Gets income transactions (staking, mining, etc.)
   */
  public getIncomeTransactions(): TaxableTransaction[] {
    return this.getTransactionsByTreatment("INCOME");
  }

  /**
   * Gets total capital gains for the period
   */
  public getTotalCapitalGains(): number {
    return this.summary.totalCapitalGains;
  }

  /**
   * Gets total capital losses for the period
   */
  public getTotalCapitalLosses(): number {
    return this.summary.totalCapitalLosses;
  }

  /**
   * Gets net capital gain (gains - losses)
   */
  public getNetCapitalGain(): number {
    return this.summary.netCapitalGain;
  }

  /**
   * Gets taxable capital gain after CGT discount
   */
  public getTaxableCapitalGain(): number {
    return this.summary.taxableCapitalGain;
  }

  /**
   * Gets total ordinary income
   */
  public getTotalOrdinaryIncome(): number {
    return this.summary.ordinaryIncome;
  }

  /**
   * Gets net taxable amount for the period
   */
  public getNetTaxableAmount(): number {
    return this.summary.netTaxableAmount;
  }

  /**
   * Checks if the report has optimization strategies
   */
  public hasOptimizationStrategies(): boolean {
    return (
      this.optimizationStrategies !== undefined &&
      this.optimizationStrategies.length > 0
    );
  }

  /**
   * Gets optimization strategies by priority
   */
  public getOptimizationStrategiesByPriority(): TaxStrategy[] {
    if (!this.optimizationStrategies) {
      return [];
    }

    return [...this.optimizationStrategies].sort(
      (a, b) => a.priority - b.priority,
    );
  }

  /**
   * Calculates potential savings from all optimization strategies
   */
  public getTotalPotentialSavings(): number {
    if (!this.optimizationStrategies) {
      return 0;
    }

    return this.optimizationStrategies.reduce(
      (total, strategy) => total + strategy.potentialSavings,
      0,
    );
  }

  /**
   * Gets the tax year label (e.g., "2023-2024")
   */
  public getTaxYearLabel(): string {
    return this.taxPeriod.label;
  }

  /**
   * Checks if the report is for the current tax year
   */
  public isCurrentTaxYear(): boolean {
    const now = new Date();
    return now >= this.taxPeriod.startDate && now <= this.taxPeriod.endDate;
  }

  /**
   * Gets summary statistics for the report
   */
  public getStatistics(): {
    totalTransactions: number;
    totalDisposals: number;
    totalAcquisitions: number;
    totalIncome: number;
    exchangesUsed: number;
    assetsTraded: number;
    reportGenerationTime: number;
  } {
    const assetsTraded = new Set<string>();

    this.transactions.forEach((transaction) => {
      const originalTx = transaction.originalTransaction;

      if ("baseAsset" in originalTx && originalTx.baseAsset?.asset?.symbol) {
        assetsTraded.add(originalTx.baseAsset.asset.symbol);
      }

      if ("quoteAsset" in originalTx && originalTx.quoteAsset?.asset?.symbol) {
        assetsTraded.add(originalTx.quoteAsset.asset.symbol);
      }

      if ("asset" in originalTx && originalTx.asset?.asset?.symbol) {
        assetsTraded.add(originalTx.asset.asset.symbol);
      }
    });

    return {
      totalTransactions: this.metadata.totalTransactions,
      totalDisposals: this.summary.totalDisposals,
      totalAcquisitions: this.summary.totalAcquisitions,
      totalIncome: this.getIncomeTransactions().length,
      exchangesUsed: this.metadata.processedExchanges.length,
      assetsTraded: assetsTraded.size,
      reportGenerationTime: this.metadata.generationTime,
    };
  }

  /**
   * Validates the tax report data integrity
   */
  public validate(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.validateInput(this);
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Unknown validation error",
      );
    }

    // Check transaction count consistency
    if (this.transactions.length !== this.metadata.totalTransactions) {
      warnings.push(
        `Transaction count mismatch: actual ${this.transactions.length}, metadata ${this.metadata.totalTransactions}`,
      );
    }

    // Check summary totals consistency
    const actualDisposals = this.getDisposals().length;
    const actualAcquisitions = this.getAcquisitions().length;

    if (actualDisposals !== this.summary.totalDisposals) {
      warnings.push(
        `Disposal count mismatch: actual ${actualDisposals}, summary ${this.summary.totalDisposals}`,
      );
    }

    if (actualAcquisitions !== this.summary.totalAcquisitions) {
      warnings.push(
        `Acquisition count mismatch: actual ${actualAcquisitions}, summary ${this.summary.totalAcquisitions}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Converts the tax report to a plain object
   */
  public toJSON(): TaxReport {
    return {
      id: this.id,
      jurisdiction: this.jurisdiction,
      taxPeriod: this.taxPeriod,
      generatedAt: new Date(this.generatedAt),
      transactions: [...this.transactions],
      summary: this.summary,
      optimizationStrategies: this.optimizationStrategies
        ? [...this.optimizationStrategies]
        : undefined,
      metadata: {
        ...this.metadata,
        processedExchanges: [...this.metadata.processedExchanges],
      },
    };
  }
}

export default TaxReportModel;
