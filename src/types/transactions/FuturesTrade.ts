import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface FuturesTrade extends BaseTransaction {
  type: "FUTURES_TRADE";

  // Contract details
  contract: {
    symbol: string;
    expiry?: Date;
    type: "perpetual" | "dated";
  };

  // Trade details
  side: "LONG" | "SHORT";
  operation: "OPEN" | "CLOSE" | "LIQUIDATION";

  // Position details
  position: {
    size: string; // Number of contracts
    notionalValue: AssetAmount;
    entryPrice: string;
    exitPrice?: string;
    leverage?: string;
  };

  // P&L
  realizedPnl?: AssetAmount;
  unrealizedPnl?: AssetAmount;

  // Fees
  fee?: AssetAmount;
  fundingRate?: string;
}
