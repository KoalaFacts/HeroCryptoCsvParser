/**
 * Represents a data source for transactions
 */
export type SourceType = 'exchange' | 'wallet' | 'defi' | 'blockchain' | 'manual';

export class Source {
  readonly id: string;
  readonly type: SourceType;
  readonly name: string;

  // Common sources as static instances
  static readonly BINANCE = new Source('binance', 'exchange', 'Binance');
  static readonly COINBASE = new Source('coinbase', 'exchange', 'Coinbase');
  static readonly KRAKEN = new Source('kraken', 'exchange', 'Kraken');
  static readonly KUCOIN = new Source('kucoin', 'exchange', 'KuCoin');
  static readonly GEMINI = new Source('gemini', 'exchange', 'Gemini');
  static readonly FTX = new Source('ftx', 'exchange', 'FTX');
  
  static readonly METAMASK = new Source('metamask', 'wallet', 'MetaMask');
  static readonly LEDGER = new Source('ledger', 'wallet', 'Ledger');
  static readonly TREZOR = new Source('trezor', 'wallet', 'Trezor');
  static readonly EXODUS = new Source('exodus', 'wallet', 'Exodus');
  
  static readonly UNISWAP = new Source('uniswap', 'defi', 'Uniswap');
  static readonly SUSHISWAP = new Source('sushiswap', 'defi', 'SushiSwap');
  static readonly AAVE = new Source('aave', 'defi', 'Aave');
  static readonly COMPOUND = new Source('compound', 'defi', 'Compound');
  static readonly CURVE = new Source('curve', 'defi', 'Curve');
  
  static readonly ETHEREUM = new Source('ethereum', 'blockchain', 'Ethereum');
  static readonly BITCOIN = new Source('bitcoin', 'blockchain', 'Bitcoin');
  static readonly BSC = new Source('bsc', 'blockchain', 'Binance Smart Chain');
  static readonly POLYGON = new Source('polygon', 'blockchain', 'Polygon');
  static readonly ARBITRUM = new Source('arbitrum', 'blockchain', 'Arbitrum');
  
  static readonly MANUAL = new Source('manual', 'manual', 'Manual Entry');

  constructor(id: string, type: SourceType, name: string) {
    this.id = id;
    this.type = type;
    this.name = name;
  }

  toString(): string {
    return this.id;
  }

  equals(other: Source | string): boolean {
    if (typeof other === 'string') {
      return this.id === other;
    }
    return this.id === other.id;
  }

  /**
   * Create a custom source if not in the predefined list
   */
  static custom(id: string, type: SourceType, name?: string): Source {
    return new Source(id, type, name || id);
  }

  /**
   * Parse a string to a Source
   */
  static parse(value: string): Source {
    // Check predefined sources
    const predefined = [
      Source.BINANCE, Source.COINBASE, Source.KRAKEN, Source.KUCOIN, Source.GEMINI, Source.FTX,
      Source.METAMASK, Source.LEDGER, Source.TREZOR, Source.EXODUS,
      Source.UNISWAP, Source.SUSHISWAP, Source.AAVE, Source.COMPOUND, Source.CURVE,
      Source.ETHEREUM, Source.BITCOIN, Source.BSC, Source.POLYGON, Source.ARBITRUM,
      Source.MANUAL
    ];

    const found = predefined.find(s => s.id === value.toLowerCase());
    if (found) {
      return found;
    }

    // Default to exchange type for unknown sources
    return Source.custom(value, 'exchange');
  }
}