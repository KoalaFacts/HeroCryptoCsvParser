import { BaseTransaction } from '../common/BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface Airdrop extends BaseTransaction {
  type: 'AIRDROP';
  
  // Airdrop details
  received: AssetAmount;
  
  // Airdrop information
  airdrop: {
    project?: string;
    reason?: string;
    eligibilityCriteria?: string;
  };
}