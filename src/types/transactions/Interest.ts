import { BaseTransaction } from './BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface Interest extends BaseTransaction {
  type: 'INTEREST';
  
  // Interest details
  interest: AssetAmount;
  interestType: 'EARNED' | 'PAID';
  
  // Context
  context: {
    protocol?: string;
    principal?: AssetAmount;
    rate?: string;
    period?: string; // e.g., "daily", "monthly"
  };
}