import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface LiquidityRemove extends BaseTransaction {
	type: "LIQUIDITY_REMOVE";

	// LP tokens burned
	lpTokens: AssetAmount;

	// Assets received
	assets: AssetAmount[];

	// Pool information
	pool: {
		protocol: string;
		address?: string;
		name?: string;
	};
}
