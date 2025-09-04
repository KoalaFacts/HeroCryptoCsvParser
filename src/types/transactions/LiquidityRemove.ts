import { BaseTransaction } from './BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface LiquidityRemove extends BaseTransaction {
  type: 'LIQUIDITY_REMOVE';
  
  // LP tokens burned
  lpTokens: AssetAmount;
  
  // Assets received
  assets: AssetAmount[];
  
  // Pool information
  pool: {
    protocol: string;
    address?: string;
    name?: string;
  };
}