import { TransactionCategorizer, OperationMapping } from '../../core/TransactionCategorizer';

/**
 * Binance-specific transaction categorizer
 * Extends TransactionCategorizer with Binance operation mappings
 */
export class BinanceTransactionCategorizer extends TransactionCategorizer {
  constructor(customMappings?: OperationMapping[], useDefaults: boolean = false) {
    super({
      mappings: customMappings,
      useDefaults: useDefaults,
      caseSensitive: false
    });
    
    // Always add Binance-specific mappings
    this.addBinanceMappings();
  }
  
  /**
   * Add Binance-specific operation mappings
   */
  private addBinanceMappings(): void {
    const binanceMappings: OperationMapping[] = [
      // Fee operations - highest priority for compound fee operations
      { pattern: /\bwithdraw fee\b/i, type: 'FEE', subType: 'withdrawal', priority: 110 },
      
      // High priority exact matches - match at word boundaries
      { pattern: /\bbuy\b/i, type: 'SPOT_TRADE', subType: 'buy', priority: 100 },
      { pattern: /\bsell\b/i, type: 'SPOT_TRADE', subType: 'sell', priority: 100 },
      { pattern: /\bdeposit\b/i, type: 'TRANSFER', subType: 'deposit', priority: 100 },
      { pattern: /\bwithdraw\b(?! fee)/i, type: 'TRANSFER', subType: 'withdrawal', priority: 100 },
      
      // Staking operations - more specific patterns have higher priority
      { pattern: /\bstaking rewards\b/i, type: 'STAKING_REWARD', priority: 95 },
      { pattern: /\bstaking redemption\b/i, type: 'STAKING_WITHDRAWAL', priority: 95 },
      { pattern: /\blocked staking redemption\b/i, type: 'STAKING_WITHDRAWAL', priority: 95 },
      { pattern: /\bstaking purchase\b/i, type: 'STAKING_DEPOSIT', priority: 90 },
      { pattern: /\blocked staking purchase\b/i, type: 'STAKING_DEPOSIT', priority: 90 },
      { pattern: /\beth 2\.0 staking(?!.*rewards)(?!.*redemption)/i, type: 'STAKING_DEPOSIT', priority: 90 },
      
      // Fee operations
      { pattern: /\bcommission\b/i, type: 'FEE', subType: 'commission', priority: 93 },
      { pattern: /\bfee\b/i, type: 'FEE', subType: 'trading', priority: 90 },
      
      // Earn operations  
      { pattern: /\blaunchpool interest\b/i, type: 'INTEREST', priority: 85 },
      { pattern: /\bsimple earn flexible interest\b/i, type: 'INTEREST', priority: 85 },
      { pattern: /\bsimple earn locked rewards\b/i, type: 'STAKING_REWARD', priority: 85 },
      
      // Convert/Swap
      { pattern: /\bconvert\b/i, type: 'SWAP', subType: 'instant', priority: 85 },
      { pattern: /\bsmall assets exchange bnb\b/i, type: 'SWAP', subType: 'dust', priority: 85 },
      
      // Liquidity operations
      { pattern: /\bliquid swap add\b/i, type: 'LIQUIDITY_ADD', priority: 85 },
      { pattern: /\bliquidity farming\b/i, type: 'LIQUIDITY_ADD', priority: 85 },
      { pattern: /\bliquid swap remove\b/i, type: 'LIQUIDITY_REMOVE', priority: 85 },
      { pattern: /\bliquid swap rewards\b/i, type: 'INTEREST', subType: 'liquidity', priority: 85 },
      { pattern: /\bliquidity farming rewards\b/i, type: 'INTEREST', subType: 'liquidity', priority: 85 },
      
      // Airdrops and distributions
      { pattern: /\bairdrop\b/i, type: 'AIRDROP', priority: 80 },
      { pattern: /\bdistribution\b/i, type: 'AIRDROP', priority: 80 },
      
      // Interest and rewards - more specific patterns first
      { pattern: /\breferral commission\b/i, type: 'INTEREST', subType: 'referral', priority: 94 },
      { pattern: /\bcashback voucher\b/i, type: 'INTEREST', subType: 'cashback', priority: 80 },
      { pattern: /\brebate\b/i, type: 'INTEREST', subType: 'rebate', priority: 80 },
      { pattern: /\bmining revenues\b/i, type: 'INTEREST', subType: 'mining', priority: 80 },
      
      // Transfers
      { pattern: /\btransfer\b/i, type: 'TRANSFER', subType: 'internal', priority: 75 },
      { pattern: /\binternal transfer\b/i, type: 'TRANSFER', subType: 'internal', priority: 75 },
      
      // Futures operations (special handling - check amount sign)
      { pattern: /\brealized profit and loss\b/i, type: 'INTEREST', priority: 70 },
      { pattern: /\bfunding fee\b/i, type: 'FEE', priority: 70 },
    ];
    
    this.addMappings(binanceMappings);
  }
}

/**
 * Factory function to create a Binance categorizer with custom mappings
 */
export function createBinanceCategorizer(
  customMappings?: OperationMapping[],
  operationOverrides?: Record<string, string>
): BinanceTransactionCategorizer {
  const mappings = customMappings || [];
  
  // Add operation overrides as high-priority exact matches
  if (operationOverrides) {
    Object.entries(operationOverrides).forEach(([operation, type]) => {
      mappings.push({
        pattern: new RegExp(`^${operation}$`, 'i'),
        type: type as any,
        priority: 200 // High priority for user overrides
      });
    });
  }
  
  return new BinanceTransactionCategorizer(mappings);
}