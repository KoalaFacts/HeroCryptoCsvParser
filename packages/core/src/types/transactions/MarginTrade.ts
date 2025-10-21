import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface MarginTrade extends BaseTransaction {
  type: "MARGIN_TRADE";

  // Trading pair
  baseAsset: AssetAmount;
  quoteAsset: AssetAmount;

  // Trade details
  side: "BUY" | "SELL";
  price: string;

  // Margin details
  margin: {
    leverage?: string;
    borrowedAsset?: AssetAmount;
    collateral?: AssetAmount;
    interestRate?: string;
  };

  // Fees
  fee?: AssetAmount;

  // Order details
  orderId?: string;
  orderType?: "market" | "limit" | "stop" | "stop_limit";
}
