/**
 * Transaction Validator
 *
 * Validates transactions for tax reporting purposes.
 * Ensures data integrity and completeness before tax calculations.
 */

import type { Transaction } from "../../types/transactions";
import type { TaxableTransaction } from "../models/TaxableTransaction";
import {
  getBaseAmount,
  getTransactionAsset,
  getTransactionTimestamp,
} from "../utils/transactionHelpers";

/**
 * Validation error severity
 */
export type ValidationSeverity = "error" | "warning" | "info";

/**
 * Validation result for a single check
 */
export interface ValidationIssue {
  field: string;
  message: string;
  severity: ValidationSeverity;
  code: string;
  suggestion?: string;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
}

/**
 * Validation options
 */
export interface ValidationOptions {
  strict?: boolean; // Fail on warnings
  checkDuplicates?: boolean;
  requirePricing?: boolean;
  taxYear?: number;
}

/**
 * Transaction Validator
 */
export class TransactionValidator {
  /**
   * Validate a single transaction
   */
  validateTransaction(
    transaction: Transaction,
    options: ValidationOptions = {},
  ): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Required field validations
    this.validateRequiredFields(transaction, issues);

    // Data type validations
    this.validateDataTypes(transaction, issues);

    // Business logic validations
    this.validateBusinessRules(transaction, issues, options);

    // Tax-specific validations
    this.validateTaxRequirements(transaction, issues, options);

    return this.buildResult(issues, options.strict);
  }

  /**
   * Validate multiple transactions
   */
  validateTransactions(
    transactions: Transaction[],
    options: ValidationOptions = {},
  ): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    // Validate each transaction
    for (const tx of transactions) {
      results.set(tx.id, this.validateTransaction(tx, options));
    }

    // Cross-transaction validations
    if (options.checkDuplicates) {
      this.checkForDuplicates(transactions, results);
    }

    return results;
  }

  /**
   * Validate taxable transaction
   */
  validateTaxableTransaction(
    taxableTransaction: TaxableTransaction,
    options: ValidationOptions = {},
  ): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Validate base transaction
    const baseResult = this.validateTransaction(
      taxableTransaction.originalTransaction,
      options,
    );
    issues.push(...baseResult.issues);

    // Validate tax treatment
    if (!taxableTransaction.taxTreatment) {
      issues.push({
        field: "taxTreatment",
        message: "Tax treatment is required",
        severity: "error",
        code: "MISSING_TAX_TREATMENT",
      });
    }

    // Validate amounts are consistent
    this.validateTaxableAmounts(taxableTransaction, issues);

    return this.buildResult(issues, options.strict);
  }

  /**
   * Get validation summary for multiple results
   */
  getSummary(results: Map<string, ValidationResult>): {
    total: number;
    valid: number;
    invalid: number;
    errors: number;
    warnings: number;
  } {
    let valid = 0;
    let errors = 0;
    let warnings = 0;

    for (const result of results.values()) {
      if (result.isValid) {
        valid++;
      }
      errors += result.errors.length;
      warnings += result.warnings.length;
    }

    return {
      total: results.size,
      valid,
      invalid: results.size - valid,
      errors,
      warnings,
    };
  }

  // Private validation methods

  /**
   * Validate required fields
   */
  private validateRequiredFields(
    transaction: Transaction,
    issues: ValidationIssue[],
  ): void {
    // Transaction ID
    if (!transaction.id || transaction.id.trim().length === 0) {
      issues.push({
        field: "id",
        message: "Transaction ID is required",
        severity: "error",
        code: "MISSING_ID",
      });
    }

    // Transaction type
    if (!transaction.type) {
      issues.push({
        field: "type",
        message: "Transaction type is required",
        severity: "error",
        code: "MISSING_TYPE",
      });
    }

    // Timestamp
    if (!transaction.timestamp) {
      issues.push({
        field: "timestamp",
        message: "Transaction timestamp is required",
        severity: "error",
        code: "MISSING_TIMESTAMP",
      });
    }

    // Data source
    if (!transaction.source) {
      issues.push({
        field: "source",
        message: "Transaction source is required",
        severity: "error",
        code: "MISSING_SOURCE",
      });
    }
  }

  /**
   * Validate data types
   */
  private validateDataTypes(
    transaction: Transaction,
    issues: ValidationIssue[],
  ): void {
    // Timestamp should be a valid date
    if (transaction.timestamp) {
      const timestamp = getTransactionTimestamp(transaction);
      if (Number.isNaN(timestamp.getTime())) {
        issues.push({
          field: "timestamp",
          message: "Invalid timestamp format",
          severity: "error",
          code: "INVALID_TIMESTAMP",
        });
      }
    }

    // Amount should be a number
    try {
      const amount = getBaseAmount(transaction);
      if (Number.isNaN(amount)) {
        issues.push({
          field: "amount",
          message: "Invalid amount value",
          severity: "error",
          code: "INVALID_AMOUNT",
        });
      }
    } catch (_error) {
      issues.push({
        field: "amount",
        message: "Cannot extract amount from transaction",
        severity: "error",
        code: "MISSING_AMOUNT",
      });
    }
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(
    transaction: Transaction,
    issues: ValidationIssue[],
    _options: ValidationOptions,
  ): void {
    // Amount should not be zero (usually)
    try {
      const amount = getBaseAmount(transaction);
      if (amount === 0) {
        issues.push({
          field: "amount",
          message: "Transaction amount is zero",
          severity: "warning",
          code: "ZERO_AMOUNT",
          suggestion: "Verify this is intentional",
        });
      }
    } catch {
      // Already caught in data type validation
    }

    // Timestamp should be reasonable
    if (transaction.timestamp) {
      const timestamp = getTransactionTimestamp(transaction);
      const now = new Date();
      const minDate = new Date("2009-01-01"); // Bitcoin genesis

      if (timestamp > now) {
        issues.push({
          field: "timestamp",
          message: "Transaction timestamp is in the future",
          severity: "error",
          code: "FUTURE_TIMESTAMP",
        });
      }

      if (timestamp < minDate) {
        issues.push({
          field: "timestamp",
          message: "Transaction timestamp predates cryptocurrency",
          severity: "warning",
          code: "SUSPICIOUS_TIMESTAMP",
        });
      }
    }
  }

  /**
   * Validate tax-specific requirements
   */
  private validateTaxRequirements(
    transaction: Transaction,
    issues: ValidationIssue[],
    options: ValidationOptions,
  ): void {
    // Asset information should be present
    try {
      const asset = getTransactionAsset(transaction);
      if (!asset) {
        issues.push({
          field: "asset",
          message: "Asset information is required for tax reporting",
          severity: "error",
          code: "MISSING_ASSET",
        });
      }
    } catch {
      issues.push({
        field: "asset",
        message: "Cannot extract asset from transaction",
        severity: "error",
        code: "INVALID_ASSET",
      });
    }

    // Pricing information
    if (options.requirePricing) {
      // Check if pricing information exists (implementation depends on transaction structure)
      if (transaction.type === "SPOT_TRADE") {
        if (!transaction.quoteAsset?.amount) {
          issues.push({
            field: "pricing",
            message: "Quote asset amount required for pricing",
            severity: "error",
            code: "MISSING_PRICING",
            suggestion: "Add market price data",
          });
        }
      }
    }

    // Tax year check
    if (options.taxYear) {
      const timestamp = getTransactionTimestamp(transaction);
      const txYear = timestamp.getFullYear();

      // Allow transactions from previous year (for carry-forward)
      if (Math.abs(txYear - options.taxYear) > 5) {
        issues.push({
          field: "timestamp",
          message: `Transaction year ${txYear} is far from tax year ${options.taxYear}`,
          severity: "warning",
          code: "YEAR_MISMATCH",
          suggestion: "Verify this transaction should be included",
        });
      }
    }
  }

  /**
   * Validate taxable amounts consistency
   */
  private validateTaxableAmounts(
    taxableTransaction: TaxableTransaction,
    issues: ValidationIssue[],
  ): void {
    const {
      capitalGain,
      capitalLoss,
      incomeAmount,
      deductibleAmount: _deductibleAmount,
    } = taxableTransaction;

    // Cannot have both capital gain and loss
    if (capitalGain && capitalGain > 0 && capitalLoss && capitalLoss > 0) {
      issues.push({
        field: "capitalGain/capitalLoss",
        message: "Transaction cannot have both capital gain and capital loss",
        severity: "error",
        code: "INVALID_CAPITAL_AMOUNTS",
      });
    }

    // Amounts should be non-negative
    if (capitalGain !== undefined && capitalGain < 0) {
      issues.push({
        field: "capitalGain",
        message: "Capital gain cannot be negative",
        severity: "error",
        code: "NEGATIVE_GAIN",
      });
    }

    if (capitalLoss !== undefined && capitalLoss < 0) {
      issues.push({
        field: "capitalLoss",
        message: "Capital loss cannot be negative",
        severity: "error",
        code: "NEGATIVE_LOSS",
      });
    }

    if (incomeAmount !== undefined && incomeAmount < 0) {
      issues.push({
        field: "incomeAmount",
        message: "Income amount cannot be negative",
        severity: "error",
        code: "NEGATIVE_INCOME",
      });
    }
  }

  /**
   * Check for duplicate transactions
   */
  private checkForDuplicates(
    transactions: Transaction[],
    results: Map<string, ValidationResult>,
  ): void {
    const seen = new Map<string, string>(); // hash -> id

    for (const tx of transactions) {
      const hash = this.hashTransaction(tx);
      const existing = seen.get(hash);

      if (existing) {
        const issue: ValidationIssue = {
          field: "id",
          message: `Duplicate transaction detected (matches ${existing})`,
          severity: "warning",
          code: "DUPLICATE_TRANSACTION",
          suggestion: "Remove duplicate or verify it is a separate transaction",
        };

        const result = results.get(tx.id);
        if (result) {
          result.issues.push(issue);
          result.warnings.push(issue);
        }
      } else {
        seen.set(hash, tx.id);
      }
    }
  }

  /**
   * Create a hash for duplicate detection
   */
  private hashTransaction(transaction: Transaction): string {
    const parts = [
      transaction.type,
      getTransactionTimestamp(transaction).toISOString(),
      getTransactionAsset(transaction),
      getBaseAmount(transaction).toString(),
      transaction.source.name,
    ];

    return parts.join("|");
  }

  /**
   * Build validation result
   */
  private buildResult(
    issues: ValidationIssue[],
    strict?: boolean,
  ): ValidationResult {
    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");
    const info = issues.filter((i) => i.severity === "info");

    const isValid = strict
      ? errors.length === 0 && warnings.length === 0
      : errors.length === 0;

    return {
      isValid,
      issues,
      errors,
      warnings,
      info,
    };
  }
}

/**
 * Create a transaction validator
 */
export function createTransactionValidator(): TransactionValidator {
  return new TransactionValidator();
}

/**
 * Validate a single transaction
 */
export function validateTransaction(
  transaction: Transaction,
  options?: ValidationOptions,
): ValidationResult {
  const validator = createTransactionValidator();
  return validator.validateTransaction(transaction, options);
}
