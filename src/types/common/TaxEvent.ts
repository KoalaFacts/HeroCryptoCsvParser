import { AssetAmount } from './AssetAmount';
import { Source } from './Source';

export interface TaxEvent {
  type: 'INCOME' | 'CAPITAL_GAIN' | 'CAPITAL_LOSS' | 'EXPENSE';
  
  // Event details
  timestamp: Date;
  description: string;
  
  // Financial details
  amount?: AssetAmount;
  costBasis?: string;
  proceeds?: string;
  gain?: string;
  
  // References
  transactionId: string;
  source?: Source;
  
  // Tax jurisdiction hints
  jurisdiction?: string;
  taxYear?: number;
}