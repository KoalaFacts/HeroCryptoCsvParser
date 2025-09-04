import { BaseTransaction } from '../common/BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface LiquidityAdd extends BaseTransaction {
  type: 'LIQUIDITY_ADD';
  
  // Assets provided
  assets: AssetAmount[];
  
  // LP tokens received
  lpTokens: AssetAmount;
  
  // Pool information
  pool: {
    protocol: string;
    address?: string;
    name?: string;
    fee?: string;
  };
}