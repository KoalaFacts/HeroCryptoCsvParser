# Hero Crypto CSV Parser

Universal cryptocurrency transaction parser for exchange exports, tax reporting, and portfolio tracking.

## Features

- 🔄 **Multiple Format Support** - Not limited to CSV, extensible to support any format
- 🏗️ **Fluent API** - Type-safe field definitions with builder pattern
- 🔌 **Plugin System** - Extend with custom sources and processors
- 📊 **Tax Ready** - Structured for tax reporting requirements
- 🎯 **TypeScript First** - Full type safety and IntelliSense support

## Installation

```bash
npm install hero-crypto-csv-parser
```

## Quick Start

```typescript
import { process } from 'hero-crypto-csv-parser';

// Process Binance export
const result = await process('binance', csvContent);

console.log(result.transactions); // Parsed transactions
console.log(result.metadata);     // Summary metadata
```

## Adding Custom Sources

```typescript
import { BatchEntryRecord, buildSource, Source } from 'hero-crypto-csv-parser';

// Define your record structure
class MyExchangeRecord extends BatchEntryRecord<MyExchangeRecord> {
  txId: string = '';
  asset: string = '';
  amount: string = '';
  
  constructor() {
    super();
    this.fieldFor(r => r.txId, 'TransactionID', 0)
      .validateWith(v => v.required('Transaction ID required'));
    this.fieldFor(r => r.asset, 'Asset', 1);
    this.fieldFor(r => r.amount, 'Amount', 2);
  }
}

// Build and register your source
const mySource = buildSource<MyExchangeRecord>()
  .withInfo({
    name: 'myexchange',
    displayName: 'My Exchange',
    type: 'exchange',
    supportedFormats: ['csv']
  })
  .withRecordClass(MyExchangeRecord)
  .withAdapter(new MyExchangeAdapter())
  .build();

registerSource('myexchange', mySource);
```

## Transaction Types

Supports comprehensive transaction types:
- Spot trades
- Futures trades
- Staking deposits/withdrawals/rewards
- Transfers
- Airdrops
- Mining rewards
- DeFi operations (swaps, liquidity)
- And more...

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run tests with coverage
npm run test:coverage
```

## License

MIT