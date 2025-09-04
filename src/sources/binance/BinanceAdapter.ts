import { SourceAdapter, ConversionOptions } from '../../core/SourceAdapter';
import { Transaction, SpotTrade, Asset, Amount, DataSource } from '../../types/transactions';
import { BinanceTransactionRecord } from './BinanceTransactionRecord';

/**
 * Adapts Binance transaction records to unified transaction format
 */
export class BinanceAdapter extends SourceAdapter<BinanceTransactionRecord> {
  get sourceName(): string {
    return 'binance';
  }
  
  protected convertRecord(record: BinanceTransactionRecord, options?: ConversionOptions): Transaction {
    // For now, create a simple trade transaction
    // This should be expanded based on the operation type
    const changeAmount = new Amount(record.change);
    
    const trade: SpotTrade = {
      type: 'SPOT_TRADE',
      id: `binance-${record.userId}-${record.utcTime}`,
      timestamp: new Date(record.utcTime),
      source: DataSource.BINANCE,
      taxEvents: [],
      baseAsset: {
        asset: new Asset(record.coin),
        amount: changeAmount.abs()
      },
      quoteAsset: {
        asset: new Asset('USDT'), // This should be parsed from the remark field
        amount: new Amount('0') // This should be calculated based on the trade
      },
      side: changeAmount.isPositive() ? 'BUY' : 'SELL',
      price: '0' // This should be calculated or parsed
    };
    
    return trade;
  }
}