import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface Airdrop extends BaseTransaction {
  type: "AIRDROP";

  // Airdrop details
  received: AssetAmount;

  // Airdrop information
  airdrop: {
    project?: string;
    reason?: string;
    eligibilityCriteria?: string;
  };
}
