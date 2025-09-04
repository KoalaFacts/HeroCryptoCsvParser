import { BaseTransaction } from '../common/BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface StakingWithdrawal extends BaseTransaction {
  type: 'STAKING_WITHDRAWAL';
  
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