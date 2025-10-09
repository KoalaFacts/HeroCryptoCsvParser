/**
 * TaxableTransaction Model
 *
 * Enhanced transaction with tax treatment information.
 * Links the original parsed transaction with its tax implications.
 */

import type { Transaction } from '../../types/transactions/Transaction';
import type { TransactionTaxTreatment } from './TransactionTaxTreatment';
import type { CostBasis } from './CostBasis';

export interface TaxableTransaction {
  originalTransaction: Transaction;
  taxTreatment: TransactionTaxTreatment;
  costBasis?: CostBasis;
  taxableAmount?: number;
  capitalGain?: number;
  capitalLoss?: number;
  incomeAmount?: number;
  deductibleAmount?: number;
}

export class TaxableTransactionModel implements TaxableTransaction {
  public readonly originalTransaction: Transaction;
  public readonly taxTreatment: TransactionTaxTreatment;
  public readonly costBasis?: CostBasis;
  public readonly taxableAmount?: number;
  public readonly capitalGain?: number;
  public readonly capitalLoss?: number;
  public readonly incomeAmount?: number;
  public readonly deductibleAmount?: number;

  constructor(data: TaxableTransaction) {
    // Validate required fields
    this.validateInput(data);

    this.originalTransaction = data.originalTransaction;
    this.taxTreatment = data.taxTreatment;
    this.costBasis = data.costBasis;
    this.taxableAmount = data.taxableAmount;
    this.capitalGain = data.capitalGain;
    this.capitalLoss = data.capitalLoss;
    this.incomeAmount = data.incomeAmount;
    this.deductibleAmount = data.deductibleAmount;
  }

  /**
   * Creates a taxable transaction from an original transaction and tax treatment
   */
  public static create(
    originalTransaction: Transaction,
    taxTreatment: TransactionTaxTreatment,
    calculations?: {
      costBasis?: CostBasis;
      taxableAmount?: number;
      capitalGain?: number;
      capitalLoss?: number;
      incomeAmount?: number;
      deductibleAmount?: number;
    }
  ): TaxableTransactionModel {
    return new TaxableTransactionModel({
      originalTransaction,
      taxTreatment,
      ...calculations
    });
  }

  /**
   * Validates the input data for taxable transaction
   */
  private validateInput(data: TaxableTransaction): void {
    if (!data) {
      throw new Error('Taxable transaction data is required');
    }

    if (!data.originalTransaction) {
      throw new Error('Original transaction is required');
    }

    if (!data.taxTreatment) {
      throw new Error('Tax treatment is required');
    }

    // Validate monetary amounts are valid numbers if provided
    this.validateMonetaryAmount('taxableAmount', data.taxableAmount);
    this.validateMonetaryAmount('capitalGain', data.capitalGain);
    this.validateMonetaryAmount('capitalLoss', data.capitalLoss);
    this.validateMonetaryAmount('incomeAmount', data.incomeAmount);
    this.validateMonetaryAmount('deductibleAmount', data.deductibleAmount);

    // Business rule: capital gain and loss cannot both be positive
    if (data.capitalGain && data.capitalLoss && data.capitalGain > 0 && data.capitalLoss > 0) {
      throw new Error('A transaction cannot have both capital gains and losses');
    }

    // Business rule: cost basis should be provided for disposal events
    if (data.taxTreatment.eventType === 'DISPOSAL' && !data.costBasis) {
      // This is a warning rather than an error, as cost basis might be calculated later
      console.warn(`Disposal transaction ${data.originalTransaction.id} does not have cost basis information`);
    }
  }

  /**
   * Validates that a monetary amount is a valid number if provided
   */
  private validateMonetaryAmount(fieldName: string, amount?: number): void {
    if (amount !== undefined && (typeof amount !== 'number' || isNaN(amount))) {
      throw new Error(`${fieldName} must be a valid number if provided`);
    }
  }

  /**
   * Gets the transaction ID from the original transaction
   */
  public getId(): string {
    return this.originalTransaction.id;
  }

  /**
   * Gets the transaction timestamp
   */
  public getTimestamp(): Date {
    return new Date(this.originalTransaction.timestamp);
  }

  /**
   * Gets the transaction type
   */
  public getType(): string {
    return this.originalTransaction.type;
  }

  /**
   * Gets the exchange/source name
   */
  public getExchange(): string {
    return this.originalTransaction.source.name;
  }

  /**
   * Gets the tax event type
   */
  public getTaxEventType(): string {
    return this.taxTreatment.eventType;
  }

  /**
   * Checks if this is a disposal transaction
   */
  public isDisposal(): boolean {
    return this.taxTreatment.eventType === 'DISPOSAL';
  }

  /**
   * Checks if this is an acquisition transaction
   */
  public isAcquisition(): boolean {
    return this.taxTreatment.eventType === 'ACQUISITION';
  }

  /**
   * Checks if this is an income transaction
   */
  public isIncome(): boolean {
    return this.taxTreatment.eventType === 'INCOME';
  }

  /**
   * Checks if this is a deductible transaction
   */
  public isDeductible(): boolean {
    return this.taxTreatment.eventType === 'DEDUCTIBLE';
  }

  /**
   * Checks if this is a non-taxable transaction
   */
  public isNonTaxable(): boolean {
    return this.taxTreatment.eventType === 'NON_TAXABLE';
  }

  /**
   * Checks if this transaction qualifies as a personal use asset
   */
  public isPersonalUseAsset(): boolean {
    return this.taxTreatment.isPersonalUse;
  }

  /**
   * Checks if this transaction is eligible for CGT treatment
   */
  public isCgtEligible(): boolean {
    return this.taxTreatment.isCgtEligible;
  }

  /**
   * Checks if CGT discount has been applied
   */
  public hasCgtDiscountApplied(): boolean {
    return this.taxTreatment.cgtDiscountApplied;
  }

  /**
   * Gets the holding period in days (if cost basis is available)
   */
  public getHoldingPeriod(): number | undefined {
    return this.costBasis?.holdingPeriod;
  }

  /**
   * Gets the cost basis method used (if cost basis is available)
   */
  public getCostBasisMethod(): string | undefined {
    return this.costBasis?.method;
  }

  /**
   * Gets the total cost basis (if available)
   */
  public getTotalCostBasis(): number | undefined {
    return this.costBasis?.totalCost;
  }

  /**
   * Gets the net tax effect of this transaction
   */
  public getNetTaxEffect(): number {
    let netEffect = 0;

    // Add positive effects (income, capital gains)
    if (this.incomeAmount) {
      netEffect += this.incomeAmount;
    }

    if (this.capitalGain) {
      netEffect += this.capitalGain;
    }

    // Subtract negative effects (capital losses, deductions)
    if (this.capitalLoss) {
      netEffect -= this.capitalLoss;
    }

    if (this.deductibleAmount) {
      netEffect -= this.deductibleAmount;
    }

    return netEffect;
  }

  /**
   * Gets all assets involved in this transaction
   */
  public getInvolvedAssets(): string[] {
    const assets = new Set<string>();
    const tx = this.originalTransaction;

    // Handle different transaction types
    if ('baseAsset' in tx && tx.baseAsset?.asset?.symbol) {
      assets.add(tx.baseAsset.asset.symbol);
    }

    if ('quoteAsset' in tx && tx.quoteAsset?.asset?.symbol) {
      assets.add(tx.quoteAsset.asset.symbol);
    }

    if ('asset' in tx && tx.asset?.asset?.symbol) {
      assets.add(tx.asset.asset.symbol);
    }

    // For swaps
    if ('from' in tx && tx.from && 'asset' in tx.from) {
      assets.add(tx.from.asset.symbol);
    }

    if ('to' in tx && tx.to && 'asset' in tx.to) {
      assets.add(tx.to.asset.symbol);
    }

    return Array.from(assets).sort();
  }

  /**
   * Gets the primary asset for this transaction
   */
  public getPrimaryAsset(): string | undefined {
    const tx = this.originalTransaction;

    // For trades, use base asset
    if ('baseAsset' in tx && tx.baseAsset?.asset?.symbol) {
      return tx.baseAsset.asset.symbol;
    }

    // For transfers, use the asset being transferred
    if ('asset' in tx && tx.asset?.asset?.symbol) {
      return tx.asset.asset.symbol;
    }

    // For swaps, use from asset
    if ('from' in tx && tx.from && 'asset' in tx.from) {
      return tx.from.asset.symbol;
    }

    // Fallback to first involved asset
    const assets = this.getInvolvedAssets();
    return assets.length > 0 ? assets[0] : undefined;
  }

  /**
   * Checks if this transaction involves a specific asset
   */
  public involvesAsset(asset: string): boolean {
    return this.getInvolvedAssets().includes(asset);
  }

  /**
   * Gets a summary of the tax implications
   */
  public getTaxSummary(): {
    eventType: string;
    classification: string;
    hasCapitalGain: boolean;
    hasCapitalLoss: boolean;
    hasIncome: boolean;
    hasDeduction: boolean;
    netTaxEffect: number;
    isPersonalUse: boolean;
    cgtDiscountApplied: boolean;
  } {
    return {
      eventType: this.taxTreatment.eventType,
      classification: this.taxTreatment.classification,
      hasCapitalGain: !!this.capitalGain && this.capitalGain > 0,
      hasCapitalLoss: !!this.capitalLoss && this.capitalLoss > 0,
      hasIncome: !!this.incomeAmount && this.incomeAmount > 0,
      hasDeduction: !!this.deductibleAmount && this.deductibleAmount > 0,
      netTaxEffect: this.getNetTaxEffect(),
      isPersonalUse: this.taxTreatment.isPersonalUse,
      cgtDiscountApplied: this.taxTreatment.cgtDiscountApplied
    };
  }

  /**
   * Updates the tax calculations for this transaction
   */
  public withCalculations(calculations: {
    costBasis?: CostBasis;
    taxableAmount?: number;
    capitalGain?: number;
    capitalLoss?: number;
    incomeAmount?: number;
    deductibleAmount?: number;
  }): TaxableTransactionModel {
    return new TaxableTransactionModel({
      originalTransaction: this.originalTransaction,
      taxTreatment: this.taxTreatment,
      ...calculations
    });
  }

  /**
   * Validates the taxable transaction data integrity
   */
  public validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.validateInput(this);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
    }

    // Check business logic consistency
    if (this.isDisposal() && !this.costBasis) {
      warnings.push('Disposal transaction missing cost basis information');
    }

    if (this.isCgtEligible() && this.isPersonalUseAsset()) {
      warnings.push('Transaction marked as both CGT eligible and personal use asset');
    }

    if (this.capitalGain && this.capitalGain > 0 && !this.isCgtEligible()) {
      warnings.push('Transaction has capital gain but is not marked as CGT eligible');
    }

    if (this.hasCgtDiscountApplied() && (!this.costBasis || this.costBasis.holdingPeriod < 365)) {
      errors.push('CGT discount applied but holding period is less than 365 days');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Converts the taxable transaction to a plain object
   */
  public toJSON(): TaxableTransaction {
    return {
      originalTransaction: this.originalTransaction,
      taxTreatment: this.taxTreatment,
      costBasis: this.costBasis,
      taxableAmount: this.taxableAmount,
      capitalGain: this.capitalGain,
      capitalLoss: this.capitalLoss,
      incomeAmount: this.incomeAmount,
      deductibleAmount: this.deductibleAmount
    };
  }
}

export default TaxableTransactionModel;