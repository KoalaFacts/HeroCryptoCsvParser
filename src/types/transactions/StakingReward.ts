import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface StakingReward extends BaseTransaction {
	type: "STAKING_REWARD";

	// Reward details
	reward: AssetAmount;

	// Staking information
	staking: {
		stakedAsset?: AssetAmount;
		validator?: string;
		pool?: string;
		apr?: string;
		protocol?: string;
	};
}
