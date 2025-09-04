import { BaseTransaction } from './BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface Loan extends BaseTransaction {
  type: 'LOAN';
  
  // Loan details
  asset: AssetAmount;
  operation: 'BORROW' | 'REPAY';
  
  // Loan terms
  loan: {
    protocol?: string;
    interestRate?: string;
    collateral?: AssetAmount[];
    duration?: number; // in days
  };
}