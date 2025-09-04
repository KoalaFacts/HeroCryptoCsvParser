import { BaseTransaction } from '../common/BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface StakingReward extends BaseTransaction {
  type: 'STAKING_REWARD';
  
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