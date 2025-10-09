# Demo Scripts

This directory contains scripts for generating and managing demo data.

## Generate Sample Data

### Usage

```bash
# Generate new sample data (from project root)
npm run generate:samples
```

This will generate a new `binance-sample.csv` file in `demo/public/samples/` with realistic transaction data.

### What It Generates

The script creates approximately **300+ transactions** spanning **2 years** (2023-2024) with:

- **Trading Activity**: Buys, sells, converts across 17+ different cryptocurrencies
- **Staking & Rewards**: Staking rewards, ETH 2.0 staking, POS savings interest
- **DeFi Operations**: Liquid swap operations and rewards
- **Interest & Yield**: Savings interest, launchpool interest, flexible earn
- **Airdrops**: Multiple airdrop events
- **Fees**: Trading fees, withdrawal fees
- **Distributions**: Referral kickbacks, BNB mining, cashback vouchers
- **Transfers**: Deposits and withdrawals

### Features

- **Random but Realistic**: Each generation produces different data while maintaining realistic patterns
- **High Precision**: 8 decimal places for amounts (e.g., `0.08534210` BTC)
- **Realistic Timestamps**: Full date-time with seconds in UTC
- **Market Pricing**: Amounts calculated based on realistic price ranges
- **Holdings Tracking**: Script maintains virtual holdings to ensure sells are possible
- **Tax Scenarios**: Includes transactions that trigger capital gains, CGT discounts, and ordinary income

### Configuration

You can modify the script to change:

- **Date Range**: `START_DATE` and `END_DATE` constants
- **Asset Pool**: Add or remove assets from `MAJOR_ASSETS`, `MID_ASSETS`, `SMALL_ASSETS`
- **Price Ranges**: Update `ASSET_PRICE_RANGES` for different market conditions
- **Transaction Frequency**: Adjust monthly transaction counts in `generate()` method

### Script Location

The generator script is located at:
```
demo/scripts/generateSampleData.ts
```

### Why Dynamic Generation?

1. **Testing Flexibility**: Generate fresh data for different test scenarios
2. **Reproducibility**: Commit the script, not just the data
3. **Customization**: Easy to modify for different testing needs
4. **Documentation**: The script itself documents what makes realistic sample data
5. **Maintenance**: Update once, regenerate for all environments

## Future Scripts

Potential additions:
- `generateExchangeData.ts` - Generate data for other exchanges (Coinbase, Kraken, etc.)
- `analyzeTransactions.ts` - Analyze generated data for tax implications
- `validateSampleData.ts` - Ensure generated data meets quality standards
