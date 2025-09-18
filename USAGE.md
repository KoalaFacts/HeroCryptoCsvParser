# HeroCryptoCsvParser Usage Guide

## Basic Usage

```typescript
import { process, exportToCSV } from 'hero-crypto-csv-parser';

// Process Binance CSV data
const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-15 10:30:45","Spot","Buy","BTC","0.00125000","Spot Trading BTC/USDT"
"123456789","2024-01-15 14:22:10","Spot","Sell","ETH","-0.55000000","Spot Trading ETH/BUSD"`;

const result = await process('binance', csvContent);

// Export to CSV
const outputCsv = exportToCSV(result.transactions);
console.log(outputCsv);
```

## Custom Operation Categorization

### Simple Operation Overrides

```typescript
const result = await process('binance', csvContent, {
  operationOverrides: {
    'Custom Operation': 'TRANSFER',
    'Special Fee': 'FEE',
    'My Reward': 'INTEREST'
  }
});
```

### Advanced Pattern Mapping

```typescript
import { OperationMapping } from 'hero-crypto-csv-parser';

const customMappings: OperationMapping[] = [
  { 
    pattern: /\bmy custom operation\b/i, 
    type: 'TRANSFER', 
    priority: 150 
  },
  { 
    pattern: /special reward/i, 
    type: 'INTEREST', 
    subType: 'custom',
    priority: 140 
  }
];

const result = await process('binance', csvContent, {
  customMappings
});
```

## Using BinanceTransactionCategorizer Directly

```typescript
import { 
  BinanceAdapter, 
  BinanceParser, 
  BinanceTransactionCategorizer,
  Source 
} from 'hero-crypto-csv-parser';

// Create custom categorizer
const categorizer = new BinanceTransactionCategorizer();
categorizer.addMapping({
  pattern: /\bspecial\b/i,
  type: 'INTEREST',
  priority: 200
});

// Create adapter with custom categorizer
const adapter = new BinanceAdapter(categorizer);

// Create source
const source = new Source(
  { 
    name: 'binance', 
    displayName: 'Binance',
    type: 'exchange',
    supportedFormats: ['csv']
  },
  new BinanceParser(),
  adapter
);

// Process data
const result = await source.process(csvContent);
```

## CSV Export Options

```typescript
import { exportToCSV, CsvExportOptions } from 'hero-crypto-csv-parser';

const options: CsvExportOptions = {
  includeHeaders: true,
  dateFormat: 'iso', // or 'unix', 'utc', or custom function
  delimiter: ',',
  fields: ['id', 'timestamp', 'type', 'asset', 'amount', 'description']
};

const csv = exportToCSV(result.transactions, options);
```

## Architecture Overview

### Core Components

1. **SourceParser** - Parses CSV to records
2. **TransactionCategorizer** - Maps operations to transaction types
3. **SourceAdapter** - Converts records to transactions
4. **CsvExporter** - Exports transactions to CSV

### Extension Points

1. **Custom Categorization** 
   - Use `operationOverrides` for simple mappings
   - Use `customMappings` for pattern-based rules
   - Create custom `TransactionCategorizer` for full control

2. **Custom Adapters**
   - Extend `SourceAdapter` for new sources
   - Override `convertRecord` method

3. **Custom Export**
   - Use `CsvExporter` with custom field selection
   - Implement custom mapper function

## Transaction Types

- `SPOT_TRADE` - Buy/sell operations
- `TRANSFER` - Deposits, withdrawals
- `FEE` - Trading fees, commissions
- `STAKING_DEPOSIT` - Staking purchases
- `STAKING_WITHDRAWAL` - Staking redemptions  
- `STAKING_REWARD` - Staking rewards
- `INTEREST` - Interest earnings, rewards
- `AIRDROP` - Token airdrops
- `SWAP` - Token conversions
- `LIQUIDITY_ADD` - Adding liquidity
- `LIQUIDITY_REMOVE` - Removing liquidity
- `UNKNOWN` - Unrecognized operations