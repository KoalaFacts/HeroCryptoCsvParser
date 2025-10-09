/**
 * TransactionTaxTreatment Model
 *
 * How a transaction is treated for tax purposes.
 * Contains classification, CGT eligibility, and applicable rules.
 */

import type { TaxRule } from './TaxRule';

export type TaxEventType =
  | 'DISPOSAL'      // Selling, trading, gifting
  | 'ACQUISITION'   // Buying, receiving
  | 'INCOME'        // Staking, mining, airdrops
  | 'DEDUCTIBLE'    // Fees, losses
  | 'NON_TAXABLE';  // Transfers between own wallets

export interface TransactionTaxTreatment {
  eventType: TaxEventType;
  classification: string;
  isPersonalUse: boolean;
  isCgtEligible: boolean;
  cgtDiscountApplied: boolean;
  treatmentReason: string;
  applicableRules: TaxRule[];
}

export class TransactionTaxTreatmentModel implements TransactionTaxTreatment {
  public readonly eventType: TaxEventType;
  public readonly classification: string;
  public readonly isPersonalUse: boolean;
  public readonly isCgtEligible: boolean;
  public readonly cgtDiscountApplied: boolean;
  public readonly treatmentReason: string;
  public readonly applicableRules: TaxRule[];

  constructor(data: TransactionTaxTreatment) {
    // Validate required fields
    this.validateInput(data);

    this.eventType = data.eventType;
    this.classification = data.classification;
    this.isPersonalUse = data.isPersonalUse;
    this.isCgtEligible = data.isCgtEligible;
    this.cgtDiscountApplied = data.cgtDiscountApplied;
    this.treatmentReason = data.treatmentReason;
    this.applicableRules = [...data.applicableRules];
  }

  /**
   * Creates a disposal treatment for capital gains calculations
   */
  public static createDisposal(
    classification: string,
    isPersonalUse: boolean = false,
    cgtDiscountApplied: boolean = false,
    applicableRules: TaxRule[] = []
  ): TransactionTaxTreatmentModel {
    return new TransactionTaxTreatmentModel({
      eventType: 'DISPOSAL',
      classification,
      isPersonalUse,
      isCgtEligible: !isPersonalUse,
      cgtDiscountApplied: cgtDiscountApplied && !isPersonalUse,
      treatmentReason: isPersonalUse
        ? 'Asset disposal - classified as personal use asset, exempt from CGT'
        : 'Asset disposal - subject to capital gains tax calculation',
      applicableRules
    });
  }

  /**
   * Creates an acquisition treatment
   */
  public static createAcquisition(
    classification: string,
    isPersonalUse: boolean = false,
    applicableRules: TaxRule[] = []
  ): TransactionTaxTreatmentModel {
    return new TransactionTaxTreatmentModel({
      eventType: 'ACQUISITION',
      classification,
      isPersonalUse,
      isCgtEligible: false, // Acquisitions don't create immediate CGT liability
      cgtDiscountApplied: false,
      treatmentReason: isPersonalUse
        ? 'Asset acquisition for personal use - establishes cost base'
        : 'Asset acquisition - establishes cost base for future CGT calculations',
      applicableRules
    });
  }

  /**
   * Creates an income treatment (staking, mining, airdrops)
   */
  public static createIncome(
    classification: string,
    applicableRules: TaxRule[] = []
  ): TransactionTaxTreatmentModel {
    return new TransactionTaxTreatmentModel({
      eventType: 'INCOME',
      classification,
      isPersonalUse: false,
      isCgtEligible: false, // Income is ordinary income, not CGT
      cgtDiscountApplied: false,
      treatmentReason: 'Transaction generates ordinary income taxable at marginal tax rates',
      applicableRules
    });
  }

  /**
   * Creates a deductible treatment (fees, expenses)
   */
  public static createDeductible(
    classification: string,
    applicableRules: TaxRule[] = []
  ): TransactionTaxTreatmentModel {
    return new TransactionTaxTreatmentModel({
      eventType: 'DEDUCTIBLE',
      classification,
      isPersonalUse: false,
      isCgtEligible: false,
      cgtDiscountApplied: false,
      treatmentReason: 'Transaction creates deductible expense or adds to cost base',
      applicableRules
    });
  }

  /**
   * Creates a non-taxable treatment (transfers between own wallets)
   */
  public static createNonTaxable(
    classification: string,
    reason: string = 'Internal transfer between own wallets - no taxable event',
    applicableRules: TaxRule[] = []
  ): TransactionTaxTreatmentModel {
    return new TransactionTaxTreatmentModel({
      eventType: 'NON_TAXABLE',
      classification,
      isPersonalUse: false,
      isCgtEligible: false,
      cgtDiscountApplied: false,
      treatmentReason: reason,
      applicableRules
    });
  }

  /**
   * Creates a staking reward income treatment
   */
  public static createStakingRewardIncome(applicableRules: TaxRule[] = []): TransactionTaxTreatmentModel {
    return this.createIncome(
      'Staking Reward Income',
      applicableRules
    );
  }

  /**
   * Creates an airdrop income treatment
   */
  public static createAirdropIncome(applicableRules: TaxRule[] = []): TransactionTaxTreatmentModel {
    return this.createIncome(
      'Airdrop Income',
      applicableRules
    );
  }

  /**
   * Creates a DeFi yield income treatment
   */
  public static createDeFiYieldIncome(applicableRules: TaxRule[] = []): TransactionTaxTreatmentModel {
    return this.createIncome(
      'DeFi Yield Income',
      applicableRules
    );
  }

  /**
   * Creates a trading fee deductible treatment
   */
  public static createTradingFeeDeduction(applicableRules: TaxRule[] = []): TransactionTaxTreatmentModel {
    return this.createDeductible(
      'Trading Fee Deduction',
      applicableRules
    );
  }

  /**
   * Creates a spot trade disposal treatment
   */
  public static createSpotTradeDisposal(
    isPersonalUse: boolean = false,
    cgtDiscountApplied: boolean = false,
    applicableRules: TaxRule[] = []
  ): TransactionTaxTreatmentModel {
    return this.createDisposal(
      'Spot Trade Disposal',
      isPersonalUse,
      cgtDiscountApplied,
      applicableRules
    );
  }

  /**
   * Creates a spot trade acquisition treatment
   */
  public static createSpotTradeAcquisition(
    isPersonalUse: boolean = false,
    applicableRules: TaxRule[] = []
  ): TransactionTaxTreatmentModel {
    return this.createAcquisition(
      'Spot Trade Acquisition',
      isPersonalUse,
      applicableRules
    );
  }

  /**
   * Validates the input data for transaction tax treatment
   */
  private validateInput(data: TransactionTaxTreatment): void {
    if (!data) {
      throw new Error('Transaction tax treatment data is required');
    }

    const validEventTypes: TaxEventType[] = [
      'DISPOSAL',
      'ACQUISITION',
      'INCOME',
      'DEDUCTIBLE',
      'NON_TAXABLE'
    ];

    if (!data.eventType || !validEventTypes.includes(data.eventType)) {
      throw new Error(`Event type must be one of: ${validEventTypes.join(', ')}`);
    }

    if (!data.classification || data.classification.trim().length === 0) {
      throw new Error('Classification is required');
    }

    if (typeof data.isPersonalUse !== 'boolean') {
      throw new Error('isPersonalUse must be a boolean');
    }

    if (typeof data.isCgtEligible !== 'boolean') {
      throw new Error('isCgtEligible must be a boolean');
    }

    if (typeof data.cgtDiscountApplied !== 'boolean') {
      throw new Error('cgtDiscountApplied must be a boolean');
    }

    if (!data.treatmentReason || data.treatmentReason.trim().length === 0) {
      throw new Error('Treatment reason is required');
    }

    if (!Array.isArray(data.applicableRules)) {
      throw new Error('Applicable rules must be an array');
    }

    // Business logic validations
    if (data.isPersonalUse && data.isCgtEligible) {
      throw new Error('Personal use assets cannot be CGT eligible');
    }

    if (data.cgtDiscountApplied && !data.isCgtEligible) {
      throw new Error('CGT discount can only be applied to CGT eligible transactions');
    }

    if (data.cgtDiscountApplied && data.isPersonalUse) {
      throw new Error('CGT discount cannot be applied to personal use assets');
    }

    // Event type specific validations
    if (data.eventType === 'ACQUISITION' && (data.isCgtEligible || data.cgtDiscountApplied)) {
      throw new Error('Acquisitions should not be CGT eligible or have CGT discount applied');
    }

    if (data.eventType === 'INCOME' && (data.isCgtEligible || data.cgtDiscountApplied)) {
      throw new Error('Income transactions should not be CGT eligible or have CGT discount applied');
    }

    if (data.eventType === 'NON_TAXABLE' && (data.isCgtEligible || data.cgtDiscountApplied)) {
      throw new Error('Non-taxable transactions should not be CGT eligible or have CGT discount applied');
    }
  }

  /**
   * Checks if this treatment creates a taxable event
   */
  public isTaxable(): boolean {
    return this.eventType !== 'NON_TAXABLE';
  }

  /**
   * Checks if this is a capital gains event
   */
  public isCapitalGainsEvent(): boolean {
    return this.eventType === 'DISPOSAL' && this.isCgtEligible;
  }

  /**
   * Checks if this is an ordinary income event
   */
  public isOrdinaryIncomeEvent(): boolean {
    return this.eventType === 'INCOME';
  }

  /**
   * Checks if this creates a deduction
   */
  public isDeductibleEvent(): boolean {
    return this.eventType === 'DEDUCTIBLE';
  }

  /**
   * Gets the tax implications of this treatment
   */
  public getTaxImplications(): {
    createsTaxableEvent: boolean;
    subjectToCgt: boolean;
    qualifiesForCgtDiscount: boolean;
    generatesOrdinaryIncome: boolean;
    createsDeduction: boolean;
    exemptFromTax: boolean;
  } {
    return {
      createsTaxableEvent: this.isTaxable(),
      subjectToCgt: this.isCapitalGainsEvent(),
      qualifiesForCgtDiscount: this.cgtDiscountApplied,
      generatesOrdinaryIncome: this.isOrdinaryIncomeEvent(),
      createsDeduction: this.isDeductibleEvent(),
      exemptFromTax: this.eventType === 'NON_TAXABLE' || this.isPersonalUse
    };
  }

  /**
   * Gets the applicable rules for a specific category
   */
  public getRulesByCategory(category: string): TaxRule[] {
    return this.applicableRules.filter(rule => rule.category === category);
  }

  /**
   * Gets the rules that are currently active
   */
  public getActiveRules(date: Date = new Date()): TaxRule[] {
    return this.applicableRules.filter(rule => {
      const effectiveFrom = new Date(rule.effectiveFrom);
      const effectiveTo = rule.effectiveTo ? new Date(rule.effectiveTo) : null;

      return date >= effectiveFrom && (!effectiveTo || date <= effectiveTo);
    });
  }

  /**
   * Gets a summary description of the tax treatment
   */
  public getSummaryDescription(): string {
    const implications = this.getTaxImplications();

    if (!implications.createsTaxableEvent) {
      return 'No taxable event - exempt from tax';
    }

    if (implications.subjectToCgt) {
      const discount = implications.qualifiesForCgtDiscount ? ' (with 50% CGT discount)' : '';
      return `Subject to capital gains tax${discount}`;
    }

    if (implications.generatesOrdinaryIncome) {
      return 'Generates ordinary income taxable at marginal rates';
    }

    if (implications.createsDeduction) {
      return 'Creates tax deduction or adds to cost base';
    }

    return 'Tax treatment determined by specific circumstances';
  }

  /**
   * Gets the event type description
   */
  public getEventTypeDescription(): string {
    switch (this.eventType) {
      case 'DISPOSAL':
        return 'Asset Disposal';
      case 'ACQUISITION':
        return 'Asset Acquisition';
      case 'INCOME':
        return 'Income Generation';
      case 'DEDUCTIBLE':
        return 'Deductible Expense';
      case 'NON_TAXABLE':
        return 'Non-Taxable Event';
      default:
        return 'Unknown Event';
    }
  }

  /**
   * Creates a copy with updated CGT discount status
   */
  public withCgtDiscount(applied: boolean): TransactionTaxTreatmentModel {
    if (!this.isCgtEligible) {
      throw new Error('Cannot apply CGT discount to non-CGT eligible transaction');
    }

    return new TransactionTaxTreatmentModel({
      eventType: this.eventType,
      classification: this.classification,
      isPersonalUse: this.isPersonalUse,
      isCgtEligible: this.isCgtEligible,
      cgtDiscountApplied: applied,
      treatmentReason: applied
        ? `${this.treatmentReason} - CGT discount applied due to 12+ month holding period`
        : this.treatmentReason.replace(' - CGT discount applied due to 12+ month holding period', ''),
      applicableRules: this.applicableRules
    });
  }

  /**
   * Creates a copy with additional rules
   */
  public withAdditionalRules(rules: TaxRule[]): TransactionTaxTreatmentModel {
    return new TransactionTaxTreatmentModel({
      eventType: this.eventType,
      classification: this.classification,
      isPersonalUse: this.isPersonalUse,
      isCgtEligible: this.isCgtEligible,
      cgtDiscountApplied: this.cgtDiscountApplied,
      treatmentReason: this.treatmentReason,
      applicableRules: [...this.applicableRules, ...rules]
    });
  }

  /**
   * Validates the transaction tax treatment data integrity
   */
  public validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.validateInput(this);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
    }

    // Check rule consistency
    const activeRules = this.getActiveRules();
    if (activeRules.length === 0 && this.applicableRules.length > 0) {
      warnings.push('No currently active rules found, but rules are specified');
    }

    // Check treatment reason completeness
    if (this.treatmentReason.length < 20) {
      warnings.push('Treatment reason is very short - consider adding more detail');
    }

    // Check for conflicting rules
    const cgtRules = this.getRulesByCategory('CAPITAL_GAINS');
    const incomeRules = this.getRulesByCategory('INCOME');

    if (cgtRules.length > 0 && incomeRules.length > 0) {
      warnings.push('Transaction has both CGT and income rules - ensure treatment is correct');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Converts the transaction tax treatment to a plain object
   */
  public toJSON(): TransactionTaxTreatment {
    return {
      eventType: this.eventType,
      classification: this.classification,
      isPersonalUse: this.isPersonalUse,
      isCgtEligible: this.isCgtEligible,
      cgtDiscountApplied: this.cgtDiscountApplied,
      treatmentReason: this.treatmentReason,
      applicableRules: [...this.applicableRules]
    };
  }
}

export default TransactionTaxTreatmentModel;