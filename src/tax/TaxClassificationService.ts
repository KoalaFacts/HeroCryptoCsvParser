/**
 * Tax Classification Service
 *
 * High-level service for classifying transactions for tax purposes.
 * Wraps the TransactionClassifier with additional business logic.
 */

import type { Transaction } from '../types/transactions';
import type { TransactionTaxTreatment } from './models/TransactionTaxTreatment';
import type { TaxJurisdiction } from './models/TaxJurisdiction';
import type { TaxRule } from './models/TaxRule';
import {
  TransactionClassifier,
  type ClassificationContext
} from './calculators/TransactionClassifier';

/**
 * Tax Classification Service
 */
export class TaxClassificationService {
  private classifier: TransactionClassifier;

  constructor(jurisdiction?: TaxJurisdiction) {
    this.classifier = new TransactionClassifier();

    if (jurisdiction?.rules) {
      this.classifier.registerRules(jurisdiction.code, jurisdiction.rules);
    }
  }

  /**
   * Classify a single transaction
   */
  classifyTransaction(
    transaction: Transaction,
    jurisdiction: string,
    options?: {
      isPersonalUse?: boolean;
      previousTransactions?: Transaction[];
    }
  ): TransactionTaxTreatment {
    const context: ClassificationContext = {
      transaction,
      jurisdiction,
      isPersonalUse: options?.isPersonalUse,
      previousTransactions: options?.previousTransactions
    };

    return this.classifier.classifyTransaction(context);
  }

  /**
   * Classify multiple transactions in batch
   */
  classifyBatch(
    transactions: Transaction[],
    jurisdiction: string,
    options?: {
      isPersonalUse?: boolean;
    }
  ): TransactionTaxTreatment[] {
    const contexts: ClassificationContext[] = transactions.map(tx => ({
      transaction: tx,
      jurisdiction,
      isPersonalUse: options?.isPersonalUse
    }));

    return this.classifier.classifyBatch(contexts);
  }

  /**
   * Register custom tax rules
   */
  registerRules(jurisdiction: string, rules: TaxRule[]): void {
    this.classifier.registerRules(jurisdiction, rules);
  }

  /**
   * Classify DeFi transaction
   */
  classifyDeFiTransaction(transaction: Transaction): string {
    return this.classifier.classifyDeFiTransaction(transaction);
  }
}

/**
 * Create a tax classification service
 */
export function createTaxClassificationService(
  jurisdiction?: TaxJurisdiction
): TaxClassificationService {
  return new TaxClassificationService(jurisdiction);
}
