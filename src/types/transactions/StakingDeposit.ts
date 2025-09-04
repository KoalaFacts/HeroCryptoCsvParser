import { BaseTransaction } from './BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface StakingDeposit extends BaseTransaction {
  type: 'STAKING_DEPOSIT';
  
  // Staking details
  asset: AssetAmount;
  
  // Staking information
  staking: {
    validator?: string;
    pool?: string;
    lockupPeriod?: number; // in days
    apr?: string;
    protocol?: string;
  };
}