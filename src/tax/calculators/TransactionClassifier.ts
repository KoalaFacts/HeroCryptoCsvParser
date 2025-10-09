/**
 * Transaction Classifier
 *
 * Classifies cryptocurrency transactions for tax treatment.
 * Supports traditional trades, DeFi operations, and various transaction types.
 */

import type { Transaction } from '../../../types/transactions/Transaction';
import type {
  TransactionTaxTreatment,
  TaxEventType
} from '../models/TransactionTaxTreatment';
import type { TaxRule } from '../models/TaxRule';

/**
 * Classification context
 */
export interface ClassificationContext {
  transaction: Transaction;
  jurisdiction: string;
  previousTransactions?: Transaction[];
  isPersonalUse?: boolean;
}

/**
 * Classification result
 */
export interface ClassificationResult extends TransactionTaxTreatment {
  confidence: number; // 0-1
  alternativeClassifications?: TransactionTaxTreatment[];
}

/**
 * Transaction classifier
 */
export class TransactionClassifier {
  private rules: Map<string, TaxRule[]> = new Map();

  /**
   * Classify a transaction for tax treatment
   *
   * @param context Classification context
   * @returns Tax treatment classification
   */
  classifyTransaction(context: ClassificationContext): TransactionTaxTreatment {
    const { transaction } = context;

    // Determine event type based on transaction characteristics
    const eventType = this.determineEventType(transaction);

    // Get applicable classification
    const classification = this.getDetailedClassification(transaction, eventType);

    // Check if personal use asset
    const isPersonalUse = context.isPersonalUse || false;

    // Determine CGT eligibility
    const isCgtEligible = this.isCGTEligible(transaction, eventType, isPersonalUse);

    // Get applicable rules
    const applicableRules = this.getApplicableRules(
      context.jurisdiction,
      eventType,
      classification
    );

    // Build tax treatment
    const treatment: TransactionTaxTreatment = {
      eventType,
      classification,
      isPersonalUse,
      isCgtEligible,
      cgtDiscountApplied: false, // Will be determined during capital gains calculation
      treatmentReason: this.buildTreatmentReason(eventType, classification, isPersonalUse),
      applicableRules
    };

    return treatment;
  }

  /**
   * Classify multiple transactions in batch
   *
   * @param contexts Array of classification contexts
   * @returns Array of classified transactions
   */
  classifyBatch(contexts: ClassificationContext[]): TransactionTaxTreatment[] {
    return contexts.map(ctx => this.classifyTransaction(ctx));
  }

  /**
   * Classify DeFi-specific transactions
   *
   * @param transaction Transaction to classify
   * @returns DeFi classification
   */
  classifyDeFiTransaction(transaction: Transaction): string {
    const type = transaction.type?.toLowerCase() || '';
    const description = transaction.description?.toLowerCase() || '';

    // Staking rewards
    if (type.includes('staking') || description.includes('staking reward')) {
      return 'DeFi Staking Reward - Ordinary Income';
    }

    // Liquidity pool operations
    if (
      type.includes('liquidity') ||
      description.includes('add liquidity') ||
      description.includes('remove liquidity')
    ) {
      return 'DeFi Liquidity Pool - Capital Transaction';
    }

    // Yield farming
    if (type.includes('farm') || description.includes('yield')) {
      return 'DeFi Yield Farming - Ordinary Income';
    }

    // Lending/borrowing
    if (
      type.includes('lend') ||
      type.includes('borrow') ||
      description.includes('interest')
    ) {
      return 'DeFi Lending/Borrowing - Interest Income/Expense';
    }

    // Airdrops
    if (type.includes('airdrop') || description.includes('airdrop')) {
      return 'DeFi Airdrop - Ordinary Income';
    }

    // Swaps
    if (type.includes('swap') || description.includes('swap')) {
      return 'DeFi Swap - Disposal and Acquisition';
    }

    return 'DeFi Transaction - Requires Manual Review';
  }

  /**
   * Register custom tax rules
   *
   * @param jurisdiction Jurisdiction code
   * @param rules Tax rules to register
   */
  registerRules(jurisdiction: string, rules: TaxRule[]): void {
    this.rules.set(jurisdiction, rules);
  }

  // Private helper methods

  /**
   * Determine the tax event type
   */
  private determineEventType(transaction: Transaction): TaxEventType {
    const type = transaction.type?.toLowerCase() || '';
    const baseAmount = transaction.baseAmount;

    // Check for income events
    if (this.isIncomeEvent(transaction)) {
      return 'INCOME';
    }

    // Check for deductible events
    if (this.isDeductibleEvent(transaction)) {
      return 'DEDUCTIBLE';
    }

    // Check for non-taxable events
    if (this.isNonTaxableEvent(transaction)) {
      return 'NON_TAXABLE';
    }

    // Disposal: selling, trading away, spending
    if (baseAmount < 0) {
      return 'DISPOSAL';
    }

    // Acquisition: buying, receiving
    if (baseAmount > 0) {
      return 'ACQUISITION';
    }

    // Default to non-taxable if unclear
    return 'NON_TAXABLE';
  }

  /**
   * Check if transaction is an income event
   */
  private isIncomeEvent(transaction: Transaction): boolean {
    const type = transaction.type?.toLowerCase() || '';
    const description = transaction.description?.toLowerCase() || '';

    const incomeKeywords = [
      'staking',
      'reward',
      'mining',
      'airdrop',
      'interest',
      'dividend',
      'cashback',
      'referral',
      'bonus'
    ];

    return incomeKeywords.some(
      keyword => type.includes(keyword) || description.includes(keyword)
    );
  }

  /**
   * Check if transaction is a deductible event
   */
  private isDeductibleEvent(transaction: Transaction): boolean {
    const type = transaction.type?.toLowerCase() || '';

    const deductibleKeywords = ['fee', 'cost', 'expense'];

    return deductibleKeywords.some(keyword => type.includes(keyword));
  }

  /**
   * Check if transaction is non-taxable
   */
  private isNonTaxableEvent(transaction: Transaction): boolean {
    const type = transaction.type?.toLowerCase() || '';
    const description = transaction.description?.toLowerCase() || '';

    const nonTaxableKeywords = [
      'transfer',
      'deposit',
      'withdrawal',
      'internal'
    ];

    return nonTaxableKeywords.some(
      keyword => type.includes(keyword) || description.includes(keyword)
    );
  }

  /**
   * Get detailed classification
   */
  private getDetailedClassification(
    transaction: Transaction,
    eventType: TaxEventType
  ): string {
    const type = transaction.type?.toLowerCase() || '';

    switch (eventType) {
      case 'DISPOSAL':
        if (type.includes('sell')) return 'Sale of Cryptocurrency';
        if (type.includes('trade')) return 'Trade/Exchange of Cryptocurrency';
        if (type.includes('spend')) return 'Spending Cryptocurrency';
        if (type.includes('gift')) return 'Gift of Cryptocurrency';
        return 'Disposal of Cryptocurrency';

      case 'ACQUISITION':
        if (type.includes('buy')) return 'Purchase of Cryptocurrency';
        if (type.includes('trade')) return 'Trade/Exchange of Cryptocurrency';
        if (type.includes('receive')) return 'Receipt of Cryptocurrency';
        return 'Acquisition of Cryptocurrency';

      case 'INCOME':
        return this.classifyDeFiTransaction(transaction);

      case 'DEDUCTIBLE':
        if (type.includes('fee')) return 'Transaction Fee';
        return 'Deductible Expense';

      case 'NON_TAXABLE':
        if (type.includes('transfer')) return 'Internal Transfer';
        return 'Non-Taxable Event';

      default:
        return 'Unclassified Transaction';
    }
  }

  /**
   * Check if transaction is eligible for CGT treatment
   */
  private isCGTEligible(
    transaction: Transaction,
    eventType: TaxEventType,
    isPersonalUse: boolean
  ): boolean {
    // Only disposal and some acquisition events are CGT eligible
    if (eventType !== 'DISPOSAL' && eventType !== 'ACQUISITION') {
      return false;
    }

    // Personal use assets may have different treatment
    // They're still CGT eligible but may be exempt
    return true;
  }

  /**
   * Build treatment reason explanation
   */
  private buildTreatmentReason(
    eventType: TaxEventType,
    classification: string,
    isPersonalUse: boolean
  ): string {
    let reason = `Classified as ${eventType} - ${classification}`;

    if (isPersonalUse) {
      reason += '. Designated as personal use asset.';
    }

    return reason;
  }

  /**
   * Get applicable tax rules
   */
  private getApplicableRules(
    jurisdiction: string,
    eventType: TaxEventType,
    classification: string
  ): TaxRule[] {
    const jurisdictionRules = this.rules.get(jurisdiction) || [];

    return jurisdictionRules.filter(rule => {
      // Match by category
      const categoryMatch = this.matchRuleCategory(rule.category, eventType);

      // Match by transaction type
      const typeMatch =
        rule.applicableTransactionTypes.length === 0 ||
        rule.applicableTransactionTypes.some(type =>
          classification.toLowerCase().includes(type.toLowerCase())
        );

      return categoryMatch && typeMatch;
    });
  }

  /**
   * Match rule category to event type
   */
  private matchRuleCategory(
    category: string,
    eventType: TaxEventType
  ): boolean {
    const categoryMap: Record<TaxEventType, string[]> = {
      DISPOSAL: ['CAPITAL_GAINS', 'REPORTING'],
      ACQUISITION: ['CAPITAL_GAINS', 'REPORTING'],
      INCOME: ['INCOME', 'REPORTING'],
      DEDUCTIBLE: ['DEDUCTIONS', 'REPORTING'],
      NON_TAXABLE: ['EXEMPTIONS', 'REPORTING']
    };

    const matchingCategories = categoryMap[eventType] || [];
    return matchingCategories.includes(category);
  }
}

/**
 * Create transaction classifier instance
 */
export function createTransactionClassifier(): TransactionClassifier {
  return new TransactionClassifier();
}

/**
 * Classify a single transaction
 */
export function classifyTransaction(
  transaction: Transaction,
  jurisdiction: string,
  isPersonalUse = false
): TransactionTaxTreatment {
  const classifier = createTransactionClassifier();
  return classifier.classifyTransaction({
    transaction,
    jurisdiction,
    isPersonalUse
  });
}