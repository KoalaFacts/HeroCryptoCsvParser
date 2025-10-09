import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface Swap extends BaseTransaction {
  type: "SWAP";

  // Swap details
  from: AssetAmount;
  to: AssetAmount;

  // Route information
  route?: {
    protocol?: string; // Uniswap, SushiSwap, etc.
    pools?: string[];
    slippage?: string;
  };

  // Price and fees
  price?: string;
  fee?: AssetAmount;
  gasUsed?: AssetAmount;
}
