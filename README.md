# Hero Crypto CSV Parser

🚀 **Open Source Universal Cryptocurrency Transaction Parser**

Transform transaction exports from any cryptocurrency exchange into standardized, tax-ready formats. Built with TypeScript, designed for extensibility, and powered by community contributions.

## 🌟 Features

- **🔄 Universal Exchange Support** - Binance integrated, community-driven exchange additions
- **🏗️ Type-Safe Architecture** - Full TypeScript support with fluent API
- **🎯 Smart Categorization** - 150+ priority-based transaction patterns
- **📊 Tax-Ready Exports** - Multiple CSV formats for accounting software
- **🔌 Plugin Ecosystem** - Extensible with custom processors
- **🌐 Web Demo** - Browser-based transaction processing
- **⚡ High Performance** - Handles large transaction histories efficiently

## 🚀 Quick Start

### Node.js/TypeScript

```bash
npm install hero-crypto-csv-parser
```

```typescript
import { process, exportToCSV } from 'hero-crypto-csv-parser';

// Process Binance transaction export
const result = await process('binance', csvContent, {
  customMappings: [
    { pattern: /custom operation/i, type: 'SPOT_TRADE', priority: 200 }
  ]
});

// Export to standardized CSV
const csv = await exportToCSV(result.transactions, {
  includeMetadata: true,
  timezone: 'America/New_York'
});
```

### Web Demo

Try our [live demo](https://hero-crypto-parser.vercel.app) to process transactions directly in your browser - no installation required!

To run the demo locally:
```bash
cd demo
npm install
npm run dev
```

## 📈 Supported Exchanges

| Exchange | Status | Contributor | Transaction Types |
|----------|--------|-------------|-------------------|
| **Binance** | ✅ Full Support | Core Team | All (150+ patterns) |
| **Coinbase** | 🔄 Coming Soon | Community Needed | - |
| **Kraken** | 🔄 Coming Soon | Community Needed | - |
| **KuCoin** | 🔄 Coming Soon | Community Needed | - |
| **Your Exchange** | 💡 [Contribute!](#contributing) | You? | - |

## 🧠 Smart Transaction Categorization

Advanced pattern-based categorization with priority system:

```typescript
// Automatic categorization
"P2P Buy" → SPOT_TRADE (p2p-buy)
"Staking Rewards" → STAKING_REWARD
"Withdraw Fee" → FEE (withdrawal)
"Margin Interest" → FEE (margin-interest)

// Custom overrides
const result = await process('binance', content, {
  operationOverrides: {
    'Custom Operation': 'SPOT_TRADE'
  }
});
```

## 📊 Export Formats

Export to multiple standardized formats:

```typescript
import { exportToCSV } from 'hero-crypto-csv-parser';

const csv = await exportToCSV(transactions, {
  fields: ['timestamp', 'type', 'baseAsset', 'amount', 'feeAsset'],
  includeMetadata: true,
  timezone: 'UTC'
});
```

**Standard Fields:**
- `timestamp` - ISO 8601 timestamp
- `type` - Transaction type (SPOT_TRADE, TRANSFER, etc.)
- `baseAsset/quoteAsset` - Trading pair assets
- `amount/price` - Transaction amounts
- `feeAsset/feeAmount` - Fee information
- `metadata` - Exchange-specific data

## 🏗️ Architecture

Extensible, type-safe architecture designed for community contributions:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Portal    │    │   Node.js API    │    │   CLI Tool      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
              ┌───────────────────────────────────────┐
              │           Core Engine                 │
              │  ┌─────────────┐  ┌─────────────────┐ │
              │  │   Parser    │  │   Categorizer   │ │
              │  └─────────────┘  └─────────────────┘ │
              │  ┌─────────────┐  ┌─────────────────┐ │
              │  │   Adapter   │  │    Exporter     │ │
              │  └─────────────┘  └─────────────────┘ │
              └───────────────────────────────────────┘
                                  │
              ┌───────────────────────────────────────┐
              │         Exchange Sources              │
              │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
              │  │ Binance │ │Coinbase │ │ Kraken  │  │
              │  └─────────┘ └─────────┘ └─────────┘  │
              └───────────────────────────────────────┘
```

## 🤝 Contributing

We believe in community-driven development! Here's how you can help:

### 🎯 Quick Contribution: Add an Exchange

1. **Share Sample Data** - Open an issue with anonymized transaction exports
2. **Review Implementation** - We'll create the parser and ask for testing
3. **Get Credit** - Your name in the contributors list and release notes

### 🔧 Full Development

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/hero-crypto-csv-parser.git
   cd hero-crypto-csv-parser
   npm install
   ```

2. **Add Exchange Support**
   ```bash
   # Create new exchange files
   src/sources/yourexchange/
   ├── YourExchangeRecord.ts      # Define CSV structure
   ├── YourExchangeAdapter.ts     # Transform to standard format
   ├── YourExchangeCategorizer.ts # Transaction categorization
   └── index.ts                   # Export everything
   ```

3. **Test Your Implementation**
   ```bash
   npm test
   npm run test:coverage
   ```

4. **Submit PR** - We'll review and merge quickly!

### 🎨 Design Principles

- **Type Safety First** - Full TypeScript coverage
- **Performance Focused** - Handle large datasets efficiently
- **Community Driven** - Easy contribution workflow
- **Extensible Core** - Plugin-based architecture
- **Production Ready** - Comprehensive testing

## 🏷️ Transaction Types

**Trading:**
- `SPOT_TRADE` - Regular buy/sell orders
- `MARGIN_TRADE` - Margin trading operations
- `FUTURES_TRADE` - Futures contracts
- `SWAP` - Instant conversions

**DeFi & Earning:**
- `STAKING_DEPOSIT/WITHDRAWAL/REWARD` - Staking operations
- `LIQUIDITY_ADD/REMOVE` - Liquidity pool operations
- `INTEREST` - Savings, lending rewards

**Transfers:**
- `TRANSFER` - Deposits, withdrawals, internal transfers
- `AIRDROP` - Token airdrops and distributions

**Other:**
- `FEE` - All types of fees
- `LOAN` - Borrowing and repayments

## 📋 Development

```bash
# Setup
git clone <repo>
cd hero-crypto-csv-parser
npm install

# Development
npm run dev          # Watch mode
npm test             # Run tests
npm run test:coverage # Coverage report
npm run typecheck    # Type checking
npm run build        # Production build

# Testing specific exchange
npm test -- --grep "binance"
```

## 🗺️ Roadmap

- [x] **Core Engine** - Type-safe parsing and categorization
- [x] **Binance** - Full support with 150+ patterns
- [x] **Web Demo** - Browser-based processing
- [ ] **Community Exchanges** - Coinbase, Kraken, KuCoin
- [ ] **Advanced Features** - Portfolio tracking, PnL calculation
- [ ] **Mobile App** - iOS/Android transaction processing

## 🆘 Support

- 🐛 **Bug Reports** - [Open an issue](../../issues)

## 📄 License

MIT License - feel free to use in your projects!

---

**Made with ❤️ by the community for the community**

*Star ⭐ this repo if you find it useful!*