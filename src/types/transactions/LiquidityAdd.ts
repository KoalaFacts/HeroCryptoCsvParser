import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface LiquidityAdd extends BaseTransaction {
	type: "LIQUIDITY_ADD";

	// Assets provided
	assets: AssetAmount[];

	// LP tokens received
	lpTokens: AssetAmount;

	// Pool information
	pool: {
		protocol: string;
		address?: string;
		name?: string;
		fee?: string;
	};
}
