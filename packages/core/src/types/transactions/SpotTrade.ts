import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface SpotTrade extends BaseTransaction {
  type: "SPOT_TRADE";

  // Trading pair
  baseAsset: AssetAmount;
  quoteAsset: AssetAmount;

  // Trade details
  side: "BUY" | "SELL";
  price: string;

  // Fees
  fee?: AssetAmount;

  // Order details
  orderId?: string;
  orderType?: "market" | "limit" | "stop" | "stop_limit";
}
