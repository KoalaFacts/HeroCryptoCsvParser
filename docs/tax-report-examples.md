# Tax Report Usage Examples

This guide provides comprehensive examples for using the cryptocurrency tax reporting module.

## Table of Contents
- [Quick Start](#quick-start)
- [Basic Tax Report Generation](#basic-tax-report-generation)
- [Advanced Configuration](#advanced-configuration)
- [Cost Basis Methods](#cost-basis-methods)
- [Export Formats](#export-formats)
- [Storage and Persistence](#storage-and-persistence)
- [Tax Optimization](#tax-optimization)
- [DeFi Transactions](#defi-transactions)
- [Progress Tracking](#progress-tracking)

## Quick Start

Generate a simple Australian tax report for the 2024 tax year:

```typescript
import { generateTaxReport } from '@/tax';
import type { Transaction } from '@/types/transactions';

// Your transaction data
const transactions: Transaction[] = [...];

// Generate report
const report = await generateTaxReport({
  jurisdictionCode: 'AU',
  taxYear: 2024,
  transactions
});

console.log(`Total Capital Gains: $${report.summary.totalCapitalGains}`);
console.log(`CGT Discount Applied: $${report.summary.cgtDiscount}`);
console.log(`Net Taxable Amount: $${report.summary.netTaxableAmount}`);
```

## Basic Tax Report Generation

### Personal Investor (Default)

```typescript
import { TaxReportGenerator } from '@/tax';

const generator = new TaxReportGenerator();

const report = await generator.generateReport({
  jurisdictionCode: 'AU',
  taxYear: 2024,
  transactions: myTransactions,
  options: {
    investorType: 'PERSONAL',
    costBasisMethod: 'FIFO',
    handleDeFi: true
  }
});

// Access report data
console.log('Report Summary:', {
  disposals: report.summary.totalDisposals,
  acquisitions: report.summary.totalAcquisitions,
  capitalGains: report.summary.totalCapitalGains,
  capitalLosses: report.summary.totalCapitalLosses,
  netGain: report.summary.netCapitalGain,
  cgtDiscount: report.summary.cgtDiscount,
  taxableGain: report.summary.taxableCapitalGain,
  ordinaryIncome: report.summary.ordinaryIncome,
  deductions: report.summary.totalDeductions,
  netTaxable: report.summary.netTaxableAmount
});
```

### Business Investor

```typescript
const businessReport = await generator.generateReport({
  jurisdictionCode: 'AU',
  taxYear: 2024,
  transactions: businessTransactions,
  options: {
    investorType: 'BUSINESS',
    treatAsBusinessIncome: true, // Treat gains as ordinary income
    costBasisMethod: 'FIFO'
  }
});
```

## Advanced Configuration

### Full Configuration Example

```typescript
import { TaxReportGenerator, QUICK_START_AU } from '@/tax';

const generator = new TaxReportGenerator();

const report = await generator.generateReport({
  jurisdictionCode: 'AU',
  taxYear: 2024,
  transactions: allTransactions,
  options: {
    // Investor profile
    investorType: 'PERSONAL',

    // Cost basis method
    costBasisMethod: 'FIFO', // or 'SPECIFIC_IDENTIFICATION'

    // DeFi handling
    handleDeFi: true,
    classifyYieldAsIncome: true,
    classifyLPAsCapital: true,

    // Tax optimization
    includeOptimization: true
  }
}, (progress) => {
  // Progress callback
  console.log(`Progress: ${progress.processed}/${progress.total} (${progress.currentPhase})`);
  if (progress.estimatedTimeRemaining) {
    console.log(`ETA: ${Math.round(progress.estimatedTimeRemaining / 1000)}s`);
  }
});

// Use quick start config
const quickReport = await generator.generateReport({
  ...QUICK_START_AU,
  taxYear: 2024,
  transactions: allTransactions
});
```

## Cost Basis Methods

### FIFO (First-In-First-Out)

Default method that matches the earliest acquisitions with disposals:

```typescript
import { FIFOCalculator } from '@/tax';

const calculator = new FIFOCalculator();

// Add acquisitions in chronological order
acquisitions.forEach(acq => calculator.addAcquisition(acq));

// Calculate cost basis for a disposal
const disposal = myDisposal;
const costBasis = calculator.calculateCostBasis(disposal, acquisitions);

console.log('Cost Basis:', {
  method: costBasis.method, // 'FIFO'
  acquisitionDate: costBasis.acquisitionDate,
  acquisitionPrice: costBasis.acquisitionPrice,
  fees: costBasis.acquisitionFees,
  totalCost: costBasis.totalCost,
  holdingPeriod: costBasis.holdingPeriod, // days
  lots: costBasis.lots
});

// Check remaining balance
const btcBalance = calculator.getRemainingBalance('BTC');
console.log(`Remaining BTC: ${btcBalance}`);
```

### Specific Identification

Select specific acquisition lots for optimization:

```typescript
import { SpecificIdentificationCalculator } from '@/tax';

const calculator = new SpecificIdentificationCalculator();

// Identify specific lots to use
const lotIdentifiers = [
  { transactionId: 'acq-123', amount: 0.5 },
  { transactionId: 'acq-456', amount: 0.3 }
];

const costBasis = calculator.calculateCostBasis(
  disposal,
  lotIdentifiers,
  availableAcquisitions
);

// This allows tax loss harvesting by selecting high-cost lots
```

## Export Formats

### PDF Export

```typescript
import { exportTaxReportPDF } from '@/tax';

const pdfBuffer = await exportTaxReportPDF(report, {
  title: 'Cryptocurrency Tax Report 2024',
  includeTransactionDetails: true,
  includeOptimizationStrategies: true,
  includeSummaryCharts: true,
  pageSize: 'A4',
  orientation: 'portrait'
});

// Save to file (Node.js)
import fs from 'fs';
fs.writeFileSync('tax-report-2024.pdf', pdfBuffer);

// Download in browser
const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'tax-report-2024.pdf';
a.click();
```

### ATO XML Export

Export in Australian Taxation Office format:

```typescript
import { exportTaxReportATO } from '@/tax';

const xmlString = await exportTaxReportATO(report, {
  taxpayerDetails: {
    tfn: '123456789',
    name: 'John Smith',
    address: '123 Main St, Sydney NSW 2000'
  },
  includeTransactionDetails: true,
  validateBeforeExport: true
});

// Save XML
fs.writeFileSync('ato-crypto-report-2024.xml', xmlString);
```

### CSV Export

```typescript
import { exportTransactionsToCSV, exportSummaryToCSV } from '@/tax';

// Export all transactions
const transactionsCsv = await exportTransactionsToCSV(report, {
  includeHeaders: true,
  dateFormat: 'YYYY-MM-DD',
  includeCalculations: true
});

fs.writeFileSync('transactions-2024.csv', transactionsCsv);

// Export summary
const summaryCsv = await exportSummaryToCSV(report, {
  includeAssetBreakdown: true,
  includeExchangeBreakdown: true,
  includeMonthlyBreakdown: true
});

fs.writeFileSync('summary-2024.csv', summaryCsv);
```

## Storage and Persistence

### Browser Storage (IndexedDB)

```typescript
import { initializeStorage, getStorageManager } from '@/tax';

// Initialize storage
await initializeStorage({
  platform: 'browser',
  databaseName: 'my-crypto-tax-db',
  encryptionKey: 'user-encryption-key-here' // Optional
});

const storage = getStorageManager();

// Save report
await storage.saveReport(report);

// Save transactions
await storage.saveTransactions(transactions);

// Query reports
const reports = await storage.getReports({
  taxYear: 2024,
  jurisdictionCode: 'AU'
});

// Get transactions
const savedTransactions = await storage.getTransactions({
  startDate: new Date('2023-07-01'),
  endDate: new Date('2024-06-30')
});

// Statistics
const stats = await storage.getStorageStats();
console.log('Storage Stats:', {
  totalReports: stats.totalReports,
  totalTransactions: stats.totalTransactions,
  storageSize: stats.storageSize,
  lastSync: stats.lastSync
});
```

### Mobile Storage (MMKV)

```typescript
// React Native
await initializeStorage({
  platform: 'mobile',
  databaseName: 'crypto-tax',
  encryptionKey: await getSecureKey() // From secure storage
});

const storage = getStorageManager();
await storage.saveReport(report);
```

### Cross-Platform (RxDB)

```typescript
await initializeStorage({
  platform: 'unified',
  databaseName: 'crypto-tax-unified',
  syncEnabled: true, // Enable sync across devices
  encryptionKey: userEncryptionKey
});

const storage = getStorageManager();
// Works on web, mobile, and desktop
```

## Tax Optimization

### Generate Optimization Strategies

```typescript
import { generateOptimizationStrategies } from '@/tax';

const strategies = generateOptimizationStrategies({
  transactions: myTransactions,
  jurisdiction: australianJurisdiction,
  taxYear: 2024,
  riskTolerance: 'MODERATE', // 'CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'
  investmentHorizon: 'LONG_TERM' // 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'
});

strategies.forEach(strategy => {
  console.log(`Strategy: ${strategy.type}`);
  console.log(`Potential Saving: $${strategy.potentialSaving}`);
  console.log(`Complexity: ${strategy.complexityLevel}`);
  console.log(`Steps:`, strategy.steps);
  console.log(`Risks:`, strategy.risks);
  console.log(`Compliance: ${strategy.complianceLevel}`);
});

// Example strategies:
// - TAX_LOSS_HARVESTING: Sell assets at a loss to offset gains
// - CGT_DISCOUNT_TIMING: Defer sales to qualify for 50% CGT discount
// - PERSONAL_USE_CLASSIFICATION: Classify small purchases as personal use (<$10k)
// - LOT_SELECTION: Choose specific lots to minimize tax
```

### Apply Specific Strategy

```typescript
import { TaxOptimizationEngine } from '@/tax';

const engine = new TaxOptimizationEngine();

// Tax loss harvesting
const lossHarvestingActions = engine.suggestTaxLossHarvesting({
  holdings: currentHoldings,
  capitalGains: currentCapitalGains,
  taxYear: 2024
});

lossHarvestingActions.forEach(action => {
  console.log(`Consider selling ${action.amount} ${action.asset}`);
  console.log(`Current loss: $${action.unrealizedLoss}`);
  console.log(`Tax saving: $${action.taxSaving}`);
});
```

## DeFi Transactions

### Automatic DeFi Classification

```typescript
import { TransactionClassifier } from '@/tax';

const classifier = new TransactionClassifier();

// Staking rewards
const stakingReward = { type: 'STAKING_REWARD', ... };
const classification = classifier.classifyDeFiTransaction(stakingReward);
// Result: 'DeFi Staking Reward - Ordinary Income'

// Liquidity pool operations
const lpAdd = { type: 'LIQUIDITY_ADD', ... };
const lpClassification = classifier.classifyDeFiTransaction(lpAdd);
// Result: 'DeFi Liquidity Pool - Capital Transaction'

// Yield farming
const yieldIncome = { type: 'YIELD_INTEREST', ... };
const yieldClassification = classifier.classifyDeFiTransaction(yieldIncome);
// Result: 'DeFi Yield Farming - Ordinary Income'
```

### Custom DeFi Configuration

```typescript
const defiReport = await generator.generateReport({
  jurisdictionCode: 'AU',
  taxYear: 2024,
  transactions: defiTransactions,
  options: {
    handleDeFi: true,
    classifyYieldAsIncome: true, // Treat yield/interest as ordinary income
    classifyLPAsCapital: true    // Treat LP tokens as capital assets
  }
});
```

## Progress Tracking

### Real-time Progress Updates

```typescript
let lastProgress = 0;

const report = await generator.generateReport(
  config,
  (progress) => {
    const percent = Math.round((progress.processed / progress.total) * 100);

    if (percent !== lastProgress) {
      console.log(`[${progress.currentPhase}] ${percent}% complete`);

      if (progress.estimatedTimeRemaining) {
        const eta = Math.round(progress.estimatedTimeRemaining / 1000);
        console.log(`ETA: ${eta}s`);
      }

      lastProgress = percent;
    }
  }
);
```

### Progress Bar Integration

```typescript
// With a progress bar library
import ProgressBar from 'progress';

const bar = new ProgressBar(':phase [:bar] :percent :etas', {
  complete: '=',
  incomplete: ' ',
  width: 40,
  total: 100
});

const report = await generator.generateReport(
  config,
  (progress) => {
    const percent = (progress.processed / progress.total) * 100;
    bar.tick(percent - bar.curr, {
      phase: progress.currentPhase.padEnd(25)
    });
  }
);
```

## Complete Example: Full Workflow

```typescript
import {
  generateTaxReport,
  exportTaxReportPDF,
  exportTaxReportATO,
  initializeStorage,
  getStorageManager
} from '@/tax';

async function generateAndExportTaxReport() {
  // 1. Initialize storage
  await initializeStorage({
    platform: 'browser',
    encryptionKey: 'user-key'
  });

  const storage = getStorageManager();

  // 2. Load transactions from storage
  const transactions = await storage.getTransactions({
    startDate: new Date('2023-07-01'),
    endDate: new Date('2024-06-30')
  });

  console.log(`Loaded ${transactions.length} transactions`);

  // 3. Generate tax report with progress tracking
  console.log('Generating tax report...');

  const report = await generateTaxReport(
    {
      jurisdictionCode: 'AU',
      taxYear: 2024,
      transactions,
      options: {
        includeOptimization: true,
        costBasisMethod: 'FIFO',
        handleDeFi: true
      }
    },
    (progress) => {
      const percent = Math.round((progress.processed / progress.total) * 100);
      console.log(`${progress.currentPhase}: ${percent}%`);
    }
  );

  // 4. Save report to storage
  await storage.saveReport(report);
  console.log('Report saved to storage');

  // 5. Export to PDF
  const pdfBuffer = await exportTaxReportPDF(report, {
    includeTransactionDetails: true,
    includeOptimizationStrategies: true
  });

  // Save PDF
  const fs = require('fs');
  fs.writeFileSync('tax-report-2024.pdf', pdfBuffer);
  console.log('PDF exported');

  // 6. Export to ATO XML
  const xmlString = await exportTaxReportATO(report, {
    taxpayerDetails: {
      tfn: '123456789',
      name: 'John Smith',
      address: '123 Main St, Sydney NSW 2000'
    },
    validateBeforeExport: true
  });

  fs.writeFileSync('ato-report-2024.xml', xmlString);
  console.log('ATO XML exported');

  // 7. Print summary
  console.log('\n=== Tax Report Summary ===');
  console.log(`Total Disposals: ${report.summary.totalDisposals}`);
  console.log(`Total Capital Gains: $${report.summary.totalCapitalGains.toFixed(2)}`);
  console.log(`Total Capital Losses: $${report.summary.totalCapitalLosses.toFixed(2)}`);
  console.log(`Net Capital Gain: $${report.summary.netCapitalGain.toFixed(2)}`);
  console.log(`CGT Discount: $${report.summary.cgtDiscount.toFixed(2)}`);
  console.log(`Taxable Capital Gain: $${report.summary.taxableCapitalGain.toFixed(2)}`);
  console.log(`Ordinary Income: $${report.summary.ordinaryIncome.toFixed(2)}`);
  console.log(`Total Deductions: $${report.summary.totalDeductions.toFixed(2)}`);
  console.log(`Net Taxable Amount: $${report.summary.netTaxableAmount.toFixed(2)}`);

  // 8. Print optimization strategies
  if (report.optimizationStrategies.length > 0) {
    console.log('\n=== Optimization Strategies ===');
    report.optimizationStrategies.forEach((strategy, i) => {
      console.log(`${i + 1}. ${strategy.type}`);
      console.log(`   Potential Saving: $${strategy.potentialSaving.toFixed(2)}`);
      console.log(`   Complexity: ${strategy.complexityLevel}`);
    });
  }
}

// Run the workflow
generateAndExportTaxReport().catch(console.error);
```

## Privacy and Security

All calculations happen locally on your device:

```typescript
// ✅ Privacy-first: No data sent to external servers
const report = await generateTaxReport(config);

// ✅ Encrypted storage (optional)
await initializeStorage({
  platform: 'browser',
  encryptionKey: userProvidedKey // User controls encryption
});

// ✅ All processing is local
// ✅ No API calls
// ✅ No cloud dependencies
// ✅ Complete data ownership
```

## Error Handling

```typescript
import { TransactionValidator, TaxReportValidator } from '@/tax';

try {
  // Validate transactions before processing
  const validator = new TransactionValidator();

  for (const tx of transactions) {
    const result = validator.validateTransaction(tx, {
      strictMode: true,
      validateForTax: true
    });

    if (!result.isValid) {
      console.error('Invalid transaction:', tx.id);
      console.error('Errors:', result.errors);
    }
  }

  // Generate report
  const report = await generateTaxReport(config);

  // Validate report
  const reportValidator = new TaxReportValidator();
  const reportValidation = reportValidator.validateReport(report);

  if (!reportValidation.isValid) {
    console.error('Report validation failed:', reportValidation.errors);
  }

} catch (error) {
  console.error('Tax report generation failed:', error);

  // Error recovery
  if (error.message.includes('Insufficient acquisition lots')) {
    console.log('Possible missing transactions - check your transaction history');
  }
}
```

## Next Steps

- See [ATO References](./ato-references.md) for Australian tax law information
- Check the [API Documentation](../README.md#tax-reporting) for complete API reference
- Review [Privacy Architecture](./privacy-architecture.md) for security details
