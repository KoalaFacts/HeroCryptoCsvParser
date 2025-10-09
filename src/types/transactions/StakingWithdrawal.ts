import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface StakingWithdrawal extends BaseTransaction {
	type: "STAKING_WITHDRAWAL";

	// Withdrawal details
	asset: AssetAmount;

	// Staking information
	staking: {
		validator?: string;
		pool?: string;
		unbondingPeriod?: number; // in days
		protocol?: string;
	};
}
