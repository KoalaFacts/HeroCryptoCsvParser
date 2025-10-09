import type { AssetAmount } from "./AssetAmount";
import type { DataSource } from "./DataSource";

export interface TaxEvent {
  type: "INCOME" | "CAPITAL_GAIN" | "CAPITAL_LOSS" | "EXPENSE";

  // Event details
  timestamp: Date;
  description: string;

  // Financial details
  amount?: AssetAmount;
  costBasis?: string;
  proceeds?: string;
  gain?: string;

  // References
  transactionId: string;
  source?: DataSource;

  // Tax jurisdiction hints
  jurisdiction?: string;
  taxYear?: number;
}
