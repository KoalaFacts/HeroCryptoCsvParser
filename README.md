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

Try our [live demo](https://hero-crypto-csv-parser.vercel.app) to process transactions directly in your browser - no installation required!

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

## 💰 Tax Reporting (NEW!)

**Privacy-First Australian Cryptocurrency Tax Reports**

Generate complete, ATO-compliant tax reports entirely on your device - no data ever leaves your browser or app.

### ✨ Features

- **🇦🇺 Australian Tax Rules** - CGT discount, personal use exemptions, DeFi classification
- **🔒 Privacy-First** - All calculations happen locally, zero external API calls
- **📊 Multiple Formats** - PDF, ATO XML, CSV exports
- **⚡ High Performance** - Process 100,000+ transactions in under 30 seconds
- **🎯 FIFO Cost Basis** - Automatic capital gains calculation
- **💡 Tax Optimization** - Actionable strategies to reduce tax liability
- **💾 Offline Storage** - Browser (IndexedDB), Mobile (MMKV), Unified (RxDB)

### Quick Example

```typescript
import { generateTaxReport, exportTaxReportPDF } from 'hero-crypto-csv-parser/tax';

// Generate comprehensive tax report
const report = await generateTaxReport({
  jurisdictionCode: 'AU',
  taxYear: 2024,
  transactions: myTransactions,
  options: {
    includeOptimization: true,
    costBasisMethod: 'FIFO',
    handleDeFi: true
  }
}, (progress) => {
  console.log(`${progress.currentPhase}: ${progress.processed}/${progress.total}`);
});

// View summary
console.log(`Capital Gains: $${report.summary.totalCapitalGains}`);
console.log(`CGT Discount: $${report.summary.cgtDiscount}`);
console.log(`Net Taxable: $${report.summary.netTaxableAmount}`);

// Export to PDF
const pdfBuffer = await exportTaxReportPDF(report, {
  includeTransactionDetails: true,
  includeOptimizationStrategies: true
});

// Export to ATO XML format
import { exportTaxReportATO } from 'hero-crypto-csv-parser/tax';
const atoXml = await exportTaxReportATO(report, {
  taxpayerDetails: { tfn: '123456789', name: 'John Smith', address: '...' }
});
```

### What Gets Calculated

- **Capital Gains/Losses** - Using FIFO cost basis method (ATO default)
- **CGT Discount** - Automatic 50% discount for assets held >12 months
- **Personal Use Exemption** - Purchases under $10,000 AUD
- **DeFi Income** - Staking rewards, yield farming, airdrops as ordinary income
- **Deductions** - Transaction fees and trading costs
- **Tax Optimization** - Loss harvesting, timing strategies, lot selection

### Storage & Privacy

```typescript
import { initializeStorage, getStorageManager } from 'hero-crypto-csv-parser/tax';

// Browser storage (IndexedDB)
await initializeStorage({
  platform: 'browser',
  encryptionKey: 'your-encryption-key' // Optional
});

const storage = getStorageManager();
await storage.saveReport(report);

// Retrieve later
const reports = await storage.getReports({ taxYear: 2024 });
```

**Privacy Guarantee:**
- ✅ All calculations happen on your device
- ✅ No external API calls
- ✅ No data sent to servers
- ✅ Optional encryption for stored data
- ✅ Complete data ownership

### Documentation

- **[Usage Examples](docs/tax-report-examples.md)** - Comprehensive code examples
- **[ATO References](docs/ato-references.md)** - Australian tax law guidance
- **[API Documentation](src/tax/index.ts)** - Complete API reference

### Supported Features

| Feature | Status | Description |
|---------|--------|-------------|
| Australian Jurisdiction | ✅ | Full CGT, personal use, DeFi support |
| FIFO Cost Basis | ✅ | ATO default method |
| Specific Identification | ✅ | Manual lot selection |
| CGT Discount (50%) | ✅ | >12 months holding period |
| Personal Use Exemption | ✅ | <$10k AUD threshold |
| DeFi Classification | ✅ | Staking, yield, LP tokens |
| PDF Export | ✅ | Professional tax reports |
| ATO XML Export | ✅ | Direct myTax integration |
| Tax Optimization | ✅ | 5 strategy types |
| Multi-Platform Storage | ✅ | Browser, Mobile, Desktop |
| Progress Tracking | ✅ | Real-time updates with ETA |
| Other Jurisdictions | 🔄 | US, UK, EU coming soon |

### Performance

Optimized for large transaction volumes:

- **1,000 transactions**: <1 second
- **10,000 transactions**: <5 seconds
- **100,000 transactions**: <30 seconds
- **Chunked processing**: 1,000 tx/batch
- **Progress callbacks**: Real-time updates
- **Memory efficient**: Streaming architecture

## 🗺️ Roadmap

- [x] **Core Engine** - Type-safe parsing and categorization
- [x] **Binance** - Full support with 150+ patterns
- [x] **Web Demo** - Browser-based processing
- [x] **Australian Tax Reports** - Privacy-first, ATO-compliant (NEW!)
- [ ] **Community Exchanges** - Coinbase, Kraken, KuCoin
- [ ] **More Jurisdictions** - US (IRS), UK (HMRC), EU tax support
- [ ] **Advanced Features** - Portfolio tracking, PnL calculation
- [ ] **Mobile App** - iOS/Android transaction processing

## 🆘 Support

- 🐛 **Bug Reports** - [Open an issue](../../issues)

## 📄 License

MIT License - feel free to use in your projects!

---

**Made with ❤️ by the community for the community**

*Star ⭐ this repo if you find it useful!*