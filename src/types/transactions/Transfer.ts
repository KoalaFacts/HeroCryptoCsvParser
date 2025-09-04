import { BaseTransaction } from '../common/BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface Transfer extends BaseTransaction {
  type: 'TRANSFER';
  
  // Transfer details
  asset: AssetAmount;
  direction: 'IN' | 'OUT' | 'INTERNAL';
  
  // Source/destination
  from?: {
    address?: string;
    platform?: string;
    label?: string;
  };
  
  to?: {
    address?: string;
    platform?: string;
    label?: string;
  };
  
  // Network fee (for withdrawals)
  networkFee?: AssetAmount;
  
  // Transfer type
  transferType?: 'deposit' | 'withdrawal' | 'internal' | 'cross_chain';
  memo?: string;
}