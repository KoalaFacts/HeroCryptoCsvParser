import { BaseTransaction } from './BaseTransaction';
import { AssetAmount } from '../common/AssetAmount';

export interface SpotTrade extends BaseTransaction {
  type: 'SPOT_TRADE';
  
  // Trading pair
  baseAsset: AssetAmount;
  quoteAsset: AssetAmount;
  
  // Trade details
  side: 'BUY' | 'SELL';
  price: string;
  
  // Fees
  fee?: AssetAmount;
  
  // Order details
  orderId?: string;
  orderType?: 'market' | 'limit' | 'stop' | 'stop_limit';
}