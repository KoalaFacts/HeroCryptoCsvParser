/**
 * TaxEvent model
 * Represents a taxable event in the system
 */

import type { TaxableTransaction } from "./TaxableTransaction";
import type { TaxEventType } from "./TransactionTaxTreatment";

export interface TaxEvent {
  id: string;
  timestamp: Date;
  type: TaxEventType;
  transactions: TaxableTransaction[]; // May involve multiple transactions
  netEffect: {
    taxableIncome?: number;
    capitalGain?: number;
    capitalLoss?: number;
    deduction?: number;
  };
  documentation: string[]; // Required supporting docs
}

/**
 * Creates a TaxEvent
 */
export function createTaxEvent(
  id: string,
  timestamp: Date,
  type: TaxEventType,
  transactions: TaxableTransaction[],
  documentation: string[] = [],
): TaxEvent {
  if (transactions.length === 0) {
    throw new Error("Tax event must contain at least one transaction");
  }

  const netEffect = calculateNetEffect(transactions);

  return {
    id,
    timestamp,
    type,
    transactions,
    netEffect,
    documentation,
  };
}

/**
 * Calculates the net effect of transactions in an event
 */
function calculateNetEffect(
  transactions: TaxableTransaction[],
): TaxEvent["netEffect"] {
  const effect: TaxEvent["netEffect"] = {
    taxableIncome: 0,
    capitalGain: 0,
    capitalLoss: 0,
    deduction: 0,
  };

  for (const tx of transactions) {
    if (tx.incomeAmount) {
      effect.taxableIncome = (effect.taxableIncome || 0) + tx.incomeAmount;
    }
    if (tx.capitalGain) {
      effect.capitalGain = (effect.capitalGain || 0) + tx.capitalGain;
    }
    if (tx.capitalLoss) {
      effect.capitalLoss = (effect.capitalLoss || 0) + tx.capitalLoss;
    }
    if (tx.deductibleAmount) {
      effect.deduction = (effect.deduction || 0) + tx.deductibleAmount;
    }
  }

  return effect;
}

/**
 * Gets the total tax impact of an event
 */
export function getTotalTaxImpact(event: TaxEvent): number {
  const gains =
    (event.netEffect.taxableIncome || 0) + (event.netEffect.capitalGain || 0);
  const losses =
    (event.netEffect.capitalLoss || 0) + (event.netEffect.deduction || 0);
  return gains - losses;
}

/**
 * Checks if an event is taxable
 */
export function isTaxableEvent(event: TaxEvent): boolean {
  return getTotalTaxImpact(event) !== 0;
}

/**
 * Checks if an event requires documentation
 */
export function requiresDocumentation(event: TaxEvent): boolean {
  return event.type === "DISPOSAL" || event.type === "INCOME";
}

/**
 * Adds documentation to an event
 */
export function addDocumentation(event: TaxEvent, doc: string): TaxEvent {
  return {
    ...event,
    documentation: [...event.documentation, doc],
  };
}

/**
 * Groups transactions into events by date
 */
export function groupTransactionsByDate(
  transactions: TaxableTransaction[],
): Map<string, TaxableTransaction[]> {
  const groups = new Map<string, TaxableTransaction[]>();

  for (const tx of transactions) {
    const dateKey = tx.originalTransaction.timestamp
      .toISOString()
      .split("T")[0];
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, tx]);
  }

  return groups;
}
