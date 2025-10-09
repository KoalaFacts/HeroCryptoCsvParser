import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface Loan extends BaseTransaction {
  type: "LOAN";

  // Loan details
  asset: AssetAmount;
  operation: "BORROW" | "REPAY";

  // Loan terms
  loan: {
    protocol?: string;
    interestRate?: string;
    collateral?: AssetAmount[];
    duration?: number; // in days
  };
}
