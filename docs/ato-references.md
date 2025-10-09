# Australian Taxation Office (ATO) References

This document provides references to Australian tax law and ATO guidance relevant to cryptocurrency tax reporting.

## Table of Contents
- [Overview](#overview)
- [Capital Gains Tax (CGT)](#capital-gains-tax-cgt)
- [Personal Use Asset Exemption](#personal-use-asset-exemption)
- [DeFi and Staking](#defi-and-staking)
- [Record Keeping](#record-keeping)
- [ATO Guidance Documents](#ato-guidance-documents)
- [Legal Framework](#legal-framework)

## Overview

The Australian Taxation Office treats cryptocurrency as property for tax purposes, not as money or foreign currency. This classification has significant implications for how cryptocurrency transactions are taxed.

### Key Principles

1. **Property Treatment**: Cryptocurrencies are treated as CGT assets
2. **Capital Gains**: Disposal of cryptocurrency may trigger capital gains or losses
3. **Personal Use Exemption**: Purchases under $10,000 AUD may be exempt
4. **Income Treatment**: Mining, staking rewards, and airdrops are ordinary income
5. **Record Keeping**: Detailed records must be maintained for all transactions

## Capital Gains Tax (CGT)

### CGT Discount

**Reference**: Income Tax Assessment Act 1997, Division 115

For individual taxpayers (not companies):
- **50% CGT discount** applies to assets held for **more than 12 months**
- Discount applies to the net capital gain, not individual gains
- Holding period calculated from acquisition to disposal

**Example Calculation**:
```
Purchase: 1 BTC at $50,000 on 1 Jan 2023
Sale: 1 BTC at $80,000 on 1 Feb 2024 (>12 months)

Capital Gain: $80,000 - $50,000 = $30,000
CGT Discount (50%): $15,000
Taxable Capital Gain: $15,000
```

**Implementation in Module**:
```typescript
import { CGTDiscountRules } from '@/tax';

// Check if CGT discount applies
const appliesDiscount = CGTDiscountRules.appliesCGTDiscount(
  holdingPeriodDays,  // e.g., 366 days
  isIndividual,       // true for personal investors
  isCompany          // false for personal investors
);

// Calculate discount amount
const discountAmount = CGTDiscountRules.calculateDiscount(
  capitalGain,        // e.g., $30,000
  holdingPeriodDays,  // e.g., 366 days
  isIndividual       // true
);
// Result: $15,000 (50% discount)
```

### Cost Basis Methods

**ATO Accepted Methods**:
1. **First-In-First-Out (FIFO)** - Default method used by most taxpayers
2. **Specific Identification** - Requires detailed records of specific parcels

**ATO Guidance**: QC 45989 (Record keeping for crypto assets)

The ATO requires consistent application of the chosen method across all cryptocurrency holdings.

### Wash Sale Rules

**Important**: Australia does NOT have wash sale rules like the United States. You can:
- Sell assets at a loss
- Immediately repurchase the same asset
- Claim the capital loss in the current tax year

This enables **tax loss harvesting** strategies.

## Personal Use Asset Exemption

**Reference**: Income Tax Assessment Act 1997, Section 108-20

### Exemption Criteria

A cryptocurrency disposal is exempt from CGT if:
1. The cryptocurrency was acquired for **personal use or enjoyment**
2. The cost of acquisition was **less than $10,000 AUD**
3. The cryptocurrency was used to purchase items for personal use

### What Qualifies

**Exempt (if under $10k)**:
- ✅ Buying goods or services for personal consumption
- ✅ Purchasing items for personal enjoyment
- ✅ Gifts for personal relationships

**NOT Exempt**:
- ❌ Purchasing cryptocurrency as an investment
- ❌ Trading cryptocurrency for profit
- ❌ Acquiring cryptocurrency through mining or staking
- ❌ Purchases of $10,000 or more

### Multiple Purchases

**Important**: The $10,000 threshold applies to each individual purchase transaction, not aggregate holdings.

**Example**:
```
Purchase 1: 0.1 BTC at $8,000 → Use to buy laptop for $9,000
Result: Exempt (under $10k)

Purchase 2: 0.5 BTC at $35,000 → Use to buy car for $40,000
Result: NOT exempt (over $10k) → CGT applies
```

**Implementation**:
```typescript
import { PersonalUseAssetRules } from '@/tax';

// Check if personal use exemption applies
const isExempt = PersonalUseAssetRules.isPersonalUseAsset(
  acquisitionCost,  // e.g., $9,500
  usage            // 'PERSONAL' or 'INVESTMENT'
);

// Calculate taxable amount (returns 0 if exempt)
const taxableAmount = PersonalUseAssetRules.calculateTaxableAmount(
  capitalGain,      // e.g., $2,000
  acquisitionCost,  // e.g., $9,500
  usage            // 'PERSONAL'
);
// Result: $0 (exempt)
```

## DeFi and Staking

### Staking Rewards

**Tax Treatment**: Ordinary Income

**ATO Position**: Staking rewards are assessable income at the time of receipt.

**Valuation**: Fair market value in AUD at the time of receipt

**Example**:
```
Receive: 10 ETH staking rewards on 1 March 2024
ETH Price: $3,000 AUD per ETH
Income: 10 × $3,000 = $30,000 ordinary income
```

**Later Sale**:
- Cost base for CGT: $30,000 (the amount included as income)
- Acquisition date: 1 March 2024

### Mining Rewards

**Tax Treatment**:
- **Hobby Mining**: Ordinary income (no deductions)
- **Business Mining**: Business income (deductions allowed for expenses)

### Airdrops

**Tax Treatment**: Ordinary income at fair market value when received

**Exception**: If the airdrop has no market value at receipt, it may not be assessable until disposal.

### Yield Farming / Liquidity Provision

**Tax Treatment**: Complex and case-dependent

**General Principles**:
1. **LP Token Receipt**: May be treated as a swap (CGT event)
2. **Yield/Interest**: Ordinary income when received
3. **LP Token Redemption**: CGT event (disposal of LP tokens)

**ATO Guidance**: Emerging area - guidance is still developing

### DeFi Loans

**Borrowing**: Not a taxable event (receiving loan)
**Interest Paid**: May be deductible if loan used for investment purposes
**Repayment**: Not a taxable event

**Lending**:
- Interest received: Ordinary income
- Liquidation of collateral: CGT event

## Record Keeping

**Reference**: Taxation Administration Act 1953, Section 262A

### Required Records

The ATO requires taxpayers to keep records for **5 years** from the date of the transaction.

**Minimum Required Information**:
1. **Date and time** of transaction
2. **Type** of transaction (buy, sell, trade, receive, spend)
3. **Quantity** of cryptocurrency
4. **Value in AUD** at time of transaction
5. **Exchange or wallet** used
6. **Purpose** of transaction (personal use vs investment)
7. **Counterparty** details (if known)

### Acceptable Record Formats

- ✅ CSV exports from exchanges
- ✅ Blockchain transaction records
- ✅ Wallet transaction histories
- ✅ Screenshots with timestamps
- ✅ Tax software reports

### Cost Basis Tracking

Must maintain records to establish cost basis:
- Acquisition date and price
- Transaction fees
- Associated costs (e.g., transfer fees)

## ATO Guidance Documents

### Primary References

1. **QC 45989** - Record keeping for cryptocurrency transactions
   - URL: ato.gov.au/General/Gen/Tax-treatment-of-crypto-currencies-in-Australia

2. **Taxation Ruling TR 2014/3** - Income tax: digital currencies
   - Establishes cryptocurrency as property for tax purposes

3. **PS LA 2014/3** - Goods and Services Tax: digital currency
   - GST treatment of cryptocurrency (no GST on cryptocurrency itself)

4. **ATO Crypto Asset Guide**
   - Comprehensive guide for individuals
   - URL: ato.gov.au/Individuals/Investments-and-assets/Crypto-asset-investments/

### Recent Updates

**2024 Tax Year Changes**:
- Enhanced data matching with exchanges
- Mandatory reporting by exchanges to ATO
- Increased scrutiny of DeFi transactions
- Updated guidance on NFTs and wrapped tokens

## Legal Framework

### Relevant Legislation

1. **Income Tax Assessment Act 1997**
   - Division 104: CGT events
   - Division 108: CGT assets
   - Division 115: CGT discount
   - Division 118: CGT exemptions

2. **Income Tax Assessment Act 1936**
   - Section 6-5: Ordinary income
   - Section 25-10: Interest deductions

3. **Taxation Administration Act 1953**
   - Section 262A: Record keeping requirements

### Case Law

While there are limited Australian court cases specifically about cryptocurrency, general CGT principles apply:

1. **FC of T v McNeil (2007)** - Hobby vs business determination
2. **Cooling v FCT (1990)** - Personal use asset principles
3. **FCT v Whitfords Beach (1982)** - Profit-making intention

## Tax Year Boundaries

**Australian Financial Year**: 1 July - 30 June

**Important Dates**:
- **1 July**: Start of tax year
- **30 June**: End of tax year
- **31 October**: Tax return due date (if lodging yourself)
- **15 May (following year)**: Tax return due date (if using tax agent)

**Example**:
- 2023-2024 tax year: 1 July 2023 to 30 June 2024
- Transactions in this period are reported in the 2024 tax return

**Implementation**:
```typescript
import { getAustralianTaxYearBoundaries } from '@/tax';

const boundaries = getAustralianTaxYearBoundaries(2024);
console.log(boundaries);
// {
//   startDate: Date(2023-07-01),
//   endDate: Date(2024-06-30),
//   label: '2023-2024'
// }
```

## ATO Data Matching

### Exchange Reporting

Since 2020, the ATO receives data from major cryptocurrency exchanges:
- Binance Australia
- CoinSpot
- Independent Reserve
- Swyftx
- Others

**Data Shared**:
- Account holder details
- Transaction volumes
- Wallet addresses
- Capital gains/losses

### Compliance Expectations

The ATO expects taxpayers to:
1. Report all cryptocurrency transactions accurately
2. Maintain detailed records
3. Include cryptocurrency in tax returns
4. Declare foreign exchange accounts (if applicable)

### Penalties for Non-Compliance

- **Failure to lodge**: Administrative penalties
- **Understatement of income**: Penalties up to 75% of the shortfall
- **Intentional disregard**: Criminal prosecution possible

## Common ATO Questions

### Q1: Do I need to report cryptocurrency if I haven't sold?

**A**: No, simply holding cryptocurrency is not a taxable event. You only report when you dispose of cryptocurrency (sell, trade, spend, or gift).

### Q2: What if I lost access to my cryptocurrency?

**A**: Lost or stolen cryptocurrency may be eligible for a capital loss claim. Requires evidence of loss and original acquisition.

### Q3: Do I need to report international exchange transactions?

**A**: Yes, all cryptocurrency transactions are reportable regardless of where the exchange is located.

### Q4: How do I report NFT transactions?

**A**: NFTs are treated as CGT assets. Same rules apply as for cryptocurrency.

### Q5: What about wrapped tokens (WBTC, wETH)?

**ATO Position**: Wrapping/unwrapping may be a CGT event (emerging guidance). Conservative approach: treat as disposal and acquisition.

## Disclaimer

This document provides general information about Australian cryptocurrency tax obligations. It should not be considered professional tax advice. Tax laws are complex and subject to change.

**Always consult with**:
- A registered tax agent
- The ATO directly
- A qualified accountant specializing in cryptocurrency

**Official ATO Resources**:
- Website: ato.gov.au
- Phone: 13 28 61
- Online services: myGov

## Module Implementation

This tax reporting module implements the following ATO requirements:

✅ **FIFO cost basis calculation** (default ATO method)
✅ **CGT discount calculation** (50% for >12 months)
✅ **Personal use asset exemption** (<$10k threshold)
✅ **Australian tax year periods** (1 July - 30 June)
✅ **DeFi classification** (staking, yield, LP tokens)
✅ **Record keeping** (5-year retention)
✅ **ATO XML export format** (myTax integration)
✅ **Privacy-first** (all calculations local, no data sharing)

### Limitations

This module provides tax calculations based on current ATO guidance. It does NOT:
- Provide tax advice
- Guarantee ATO acceptance of calculations
- Cover all edge cases or complex scenarios
- Replace professional tax advice

**Always verify calculations with a tax professional before lodging your tax return.**

## Updates and Changes

**Last Updated**: January 2025

Tax laws and ATO guidance change regularly. Check the ATO website for the most current information:
- ato.gov.au/crypto

**Future Considerations**:
- Proposed cryptocurrency regulatory framework
- Enhanced reporting requirements
- DeFi-specific guidance
- NFT marketplace reporting

## Resources

### Official ATO Resources
- ATO Crypto Guide: ato.gov.au/Individuals/Investments-and-assets/Crypto-asset-investments/
- ATO Calculators: ato.gov.au/Calculators-and-tools/
- myGov: my.gov.au

### Third-Party Resources
- Treasury.gov.au: Cryptocurrency consultation papers
- ASIC: Consumer warnings and guidance
- Industry associations: Blockchain Australia

### Technical Standards
- ISO 4217: Currency codes
- ISO 8601: Date/time formats (used in this module)
- XML Schema: ATO submission formats

---

**Note**: This module is designed to assist with tax reporting obligations. The user remains responsible for the accuracy of their tax return and should seek professional advice for complex situations.
