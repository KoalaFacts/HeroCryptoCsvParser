import { BaseTransaction } from '../common/BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface Fee extends BaseTransaction {
  type: 'FEE';
  
  // Fee details
  fee: AssetAmount;
  
  // Fee context
  feeType: 'trading' | 'network' | 'platform' | 'other';
  relatedTransactionId?: string;
  description?: string;
}