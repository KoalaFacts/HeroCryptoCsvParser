# Sample Transaction Data

This directory contains realistic sample CSV files for testing the demo.

## Binance Sample (`binance-sample.csv`)

**Period**: January 2024 - December 2024
**Total Transactions**: 35
**Assets**: BTC, ETH, USDT, DOT, USDC, BNB, ADA, SOL, BUSD, MATIC, ARB, CAKE

### Transaction Types Included

**Trading** (12 transactions):
- 5 Buy operations (BTC, ETH, ADA, MATIC)
- 4 Sell operations (BTC, ETH, ADA)
- 1 Convert (SOL → USDT)
- 2 Small assets exchange to BNB

**Fees** (9 transactions):
- Trading fees (USDT)
- Withdrawal fee (USDT)

**Staking & Rewards** (8 transactions):
- Staking rewards (DOT)
- Savings interest (USDC, USDT)
- Launchpool interest (CAKE)
- ETH 2.0 staking rewards
- POS savings interest (DOT)

**Transfers** (3 transactions):
- 1 Deposit (USDT)
- 1 Withdrawal (USDT)

**DeFi** (2 transactions):
- Liquid Swap add (BUSD, USDT)
- Liquid Swap rewards (BUSD)

**Other** (4 transactions):
- 1 Airdrop (ARB)
- 1 Distribution/Referral kickback (BNB)
- 1 Super BNB Mining
- 1 Cash voucher distribution
- 1 Transaction-related cashback

### Tax Implications

This sample data will generate:
- **Capital Gains/Losses**: From BTC, ETH, SOL, ADA sells
- **CGT Discount**: Some assets held >12 months
- **Ordinary Income**: Staking rewards, interest, airdrops
- **DeFi Events**: Liquidity pool interactions

### Perfect for Testing

✅ Multiple transaction types (15+ different operations)
✅ Cross-year holdings (for CGT discount testing)
✅ DeFi complexity (staking, liquidity pools)
✅ Real-world fee patterns
✅ Various income sources

## Adding More Samples

To add samples for other exchanges:

1. Create `{exchange}-sample.csv` file
2. Follow the exchange's actual CSV format
3. Include diverse transaction types
4. Update demo's `handleLoadSample` to support multiple sources
5. Document here
