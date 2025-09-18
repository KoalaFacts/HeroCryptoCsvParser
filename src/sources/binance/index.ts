import { buildSource } from '../../core/SourceBuilder';
import { BinanceTransactionRecord } from './BinanceTransactionRecord';
import { BinanceAdapter } from './BinanceAdapter';

/**
 * Build and export the Binance source
 */
export const BinanceSource = buildSource<BinanceTransactionRecord>()
  .withInfo({
    name: 'binance',
    displayName: 'Binance',
    type: 'exchange',
    supportedFormats: ['csv'],
    website: 'https://www.binance.com',
    documentation: 'https://www.binance.com/en/support/faq'
  })
  .withRecordClass(BinanceTransactionRecord)
  .withAdapter(new BinanceAdapter())
  .build();

// Re-export components for advanced usage
export { BinanceTransactionRecord } from './BinanceTransactionRecord';
export { BinanceParser } from './BinanceParser';
export { BinanceAdapter } from './BinanceAdapter';
export { BinanceTransactionCategorizer, createBinanceCategorizer } from './BinanceTransactionCategorizer';