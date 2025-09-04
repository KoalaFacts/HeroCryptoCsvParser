/**
 * Represents a data source for transactions (exchange, wallet, etc.)
 */
export type DataSourceType = 'exchange' | 'wallet' | 'defi' | 'blockchain' | 'manual';

export class DataSource {
  readonly id: string;
  readonly type: DataSourceType;
  readonly name: string;

  // Common sources as static instances
  static readonly BINANCE = new DataSource('binance', 'exchange', 'Binance');
  static readonly COINBASE = new DataSource('coinbase', 'exchange', 'Coinbase');
  static readonly KRAKEN = new DataSource('kraken', 'exchange', 'Kraken');
  static readonly KUCOIN = new DataSource('kucoin', 'exchange', 'KuCoin');
  static readonly GEMINI = new DataSource('gemini', 'exchange', 'Gemini');
  static readonly FTX = new DataSource('ftx', 'exchange', 'FTX');
  
  static readonly METAMASK = new DataSource('metamask', 'wallet', 'MetaMask');
  static readonly LEDGER = new DataSource('ledger', 'wallet', 'Ledger');
  static readonly TREZOR = new DataSource('trezor', 'wallet', 'Trezor');
  static readonly EXODUS = new DataSource('exodus', 'wallet', 'Exodus');
  
  static readonly UNISWAP = new DataSource('uniswap', 'defi', 'Uniswap');
  static readonly SUSHISWAP = new DataSource('sushiswap', 'defi', 'SushiSwap');
  static readonly AAVE = new DataSource('aave', 'defi', 'Aave');
  static readonly COMPOUND = new DataSource('compound', 'defi', 'Compound');
  static readonly CURVE = new DataSource('curve', 'defi', 'Curve');
  
  static readonly ETHEREUM = new DataSource('ethereum', 'blockchain', 'Ethereum');
  static readonly BITCOIN = new DataSource('bitcoin', 'blockchain', 'Bitcoin');
  static readonly BSC = new DataSource('bsc', 'blockchain', 'Binance Smart Chain');
  static readonly POLYGON = new DataSource('polygon', 'blockchain', 'Polygon');
  static readonly ARBITRUM = new DataSource('arbitrum', 'blockchain', 'Arbitrum');
  
  static readonly MANUAL = new DataSource('manual', 'manual', 'Manual Entry');

  constructor(id: string, type: DataSourceType, name: string) {
    this.id = id;
    this.type = type;
    this.name = name;
  }

  toString(): string {
    return this.id;
  }

  equals(other: DataSource | string): boolean {
    if (typeof other === 'string') {
      return this.id === other;
    }
    return this.id === other.id;
  }

  /**
   * Create a custom source if not in the predefined list
   */
  static custom(id: string, type: DataSourceType, name?: string): DataSource {
    return new DataSource(id, type, name || id);
  }

  /**
   * Parse a string to a DataSource
   */
  static parse(value: string): DataSource {
    // Check predefined sources
    const predefined = [
      DataSource.BINANCE, DataSource.COINBASE, DataSource.KRAKEN, DataSource.KUCOIN, DataSource.GEMINI, DataSource.FTX,
      DataSource.METAMASK, DataSource.LEDGER, DataSource.TREZOR, DataSource.EXODUS,
      DataSource.UNISWAP, DataSource.SUSHISWAP, DataSource.AAVE, DataSource.COMPOUND, DataSource.CURVE,
      DataSource.ETHEREUM, DataSource.BITCOIN, DataSource.BSC, DataSource.POLYGON, DataSource.ARBITRUM,
      DataSource.MANUAL
    ];

    const found = predefined.find(s => s.id === value.toLowerCase());
    if (found) {
      return found;
    }

    // Default to exchange type for unknown sources
    return DataSource.custom(value, 'exchange');
  }
}