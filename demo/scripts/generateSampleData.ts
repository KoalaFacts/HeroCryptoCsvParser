/**
 * Generate realistic Binance sample transaction data
 * Usage: npx tsx demo/scripts/generateSampleData.ts > demo/public/samples/binance-sample.csv
 */

interface Transaction {
  userId: string;
  timestamp: Date;
  account: string;
  operation: string;
  coin: string;
  change: number;
  remark: string;
}

// Configuration
const USER_ID = '123456789';
// Generate data for the last 3 years based on current date
const now = new Date();
const currentYear = now.getUTCFullYear();
const START_DATE = new Date(Date.UTC(currentYear - 2, 0, 1)); // 3 years ago
const END_DATE = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59)); // End of current year

// Asset pools
const MAJOR_ASSETS = ['BTC', 'ETH', 'BNB', 'SOL', 'AVAX'];
const MID_ASSETS = ['ADA', 'MATIC', 'LINK', 'DOT', 'OP', 'ARB'];
const SMALL_ASSETS = ['CAKE', 'SUI', 'ZETA'];
const STABLECOINS = ['USDT', 'USDC', 'BUSD'];
const ALL_ASSETS = [...MAJOR_ASSETS, ...MID_ASSETS, ...SMALL_ASSETS];

// Price ranges for realistic amounts
const ASSET_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  BTC: { min: 20000, max: 70000 },
  ETH: { min: 1200, max: 4000 },
  BNB: { min: 200, max: 600 },
  SOL: { min: 10, max: 200 },
  ADA: { min: 0.25, max: 1.2 },
  MATIC: { min: 0.5, max: 2.5 },
  LINK: { min: 5, max: 25 },
  DOT: { min: 4, max: 12 },
  AVAX: { min: 10, max: 50 },
  OP: { min: 1, max: 5 },
  ARB: { min: 0.5, max: 3 },
  CAKE: { min: 1, max: 10 },
  SUI: { min: 0.5, max: 3 },
  ZETA: { min: 0.5, max: 2 },
};

// Utility functions
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomDecimal(min: number, max: number, decimals: number = 8): number {
  const value = min + Math.random() * (max - min);
  return parseFloat(value.toFixed(decimals));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function calculateAmount(asset: string, usdAmount: number): number {
  const priceRange = ASSET_PRICE_RANGES[asset];
  if (!priceRange) return randomDecimal(0.1, 1000, 8);

  const avgPrice = (priceRange.min + priceRange.max) / 2;
  const amount = usdAmount / avgPrice;

  // More decimals for expensive assets like BTC
  const decimals = asset === 'BTC' ? 8 : asset === 'ETH' ? 8 : 8;
  return parseFloat(amount.toFixed(decimals));
}

// Transaction generators
class TransactionGenerator {
  private transactions: Transaction[] = [];
  private holdings: Map<string, number> = new Map();
  private purchaseDates: Map<string, Date[]> = new Map();

  constructor() {
    // Initialize with some USDT
    this.holdings.set('USDT', 20000);
  }

  private addTransaction(tx: Transaction): void {
    this.transactions.push(tx);

    // Update holdings
    const current = this.holdings.get(tx.coin) || 0;
    this.holdings.set(tx.coin, current + tx.change);
  }

  generateDeposit(date: Date): void {
    const amount = randomChoice([5000, 10000, 15000, 20000]);
    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Deposit',
      coin: 'USDT',
      change: amount,
      remark: '',
    });
  }

  generateWithdraw(date: Date): void {
    const usdtBalance = this.holdings.get('USDT') || 0;
    if (usdtBalance < 1000) return;

    const amount = randomInt(1000, Math.min(5000, Math.floor(usdtBalance * 0.3)));
    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Withdraw',
      coin: 'USDT',
      change: -amount,
      remark: '',
    });

    // Add withdrawal fee
    const feeDate = new Date(date.getTime());
    this.addTransaction({
      userId: USER_ID,
      timestamp: feeDate,
      account: 'Spot',
      operation: 'Fee',
      coin: 'USDT',
      change: -1.0,
      remark: 'Withdraw Fee',
    });
  }

  generateBuy(date: Date): void {
    const usdtBalance = this.holdings.get('USDT') || 0;
    if (usdtBalance < 100) return;

    const asset = randomChoice(ALL_ASSETS);
    const usdAmount = randomInt(100, Math.min(3000, Math.floor(usdtBalance * 0.2)));
    const amount = calculateAmount(asset, usdAmount);

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Buy',
      coin: asset,
      change: amount,
      remark: '',
    });

    // Track purchase date for CGT
    if (!this.purchaseDates.has(asset)) {
      this.purchaseDates.set(asset, []);
    }
    this.purchaseDates.get(asset)!.push(date);

    // Add trading fee
    const feeDate = new Date(date.getTime());
    const fee = randomDecimal(0.5, 5, 2);
    this.addTransaction({
      userId: USER_ID,
      timestamp: feeDate,
      account: 'Spot',
      operation: 'Fee',
      coin: 'USDT',
      change: -fee,
      remark: 'Trading Fee',
    });
  }

  generateSell(date: Date): void {
    // Find assets we can sell
    const sellableAssets = ALL_ASSETS.filter(asset => {
      const balance = this.holdings.get(asset) || 0;
      return balance > 0;
    });

    if (sellableAssets.length === 0) return;

    const asset = randomChoice(sellableAssets);
    const balance = this.holdings.get(asset)!;
    const sellPercentage = randomDecimal(0.2, 0.6, 2);
    const amount = parseFloat((balance * sellPercentage).toFixed(8));

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Sell',
      coin: asset,
      change: -amount,
      remark: '',
    });

    // Add trading fee
    const feeDate = new Date(date.getTime());
    const fee = randomDecimal(0.5, 3, 2);
    this.addTransaction({
      userId: USER_ID,
      timestamp: feeDate,
      account: 'Spot',
      operation: 'Fee',
      coin: 'USDT',
      change: -fee,
      remark: 'Trading Fee',
    });
  }

  generateConvert(date: Date): void {
    const convertibleAssets = MID_ASSETS.filter(asset => {
      const balance = this.holdings.get(asset) || 0;
      return balance > 0;
    });

    if (convertibleAssets.length === 0) return;

    const fromAsset = randomChoice(convertibleAssets);
    const balance = this.holdings.get(fromAsset)!;
    const amount = parseFloat((balance * randomDecimal(0.3, 0.7, 2)).toFixed(8));

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Convert',
      coin: fromAsset,
      change: -amount,
      remark: '',
    });

    // Calculate USDT received
    const priceRange = ASSET_PRICE_RANGES[fromAsset];
    const avgPrice = priceRange ? (priceRange.min + priceRange.max) / 2 : 1;
    const usdtReceived = parseFloat((amount * avgPrice).toFixed(2));

    const convertDate = new Date(date.getTime());
    this.addTransaction({
      userId: USER_ID,
      timestamp: convertDate,
      account: 'Spot',
      operation: 'Convert',
      coin: 'USDT',
      change: usdtReceived,
      remark: '',
    });
  }

  generateStakingReward(date: Date): void {
    const stakingAssets = ['DOT', 'ETH', 'ADA', 'SOL'];
    const asset = randomChoice(stakingAssets);
    const amount = asset === 'DOT'
      ? randomDecimal(15, 30, 8)
      : asset === 'ETH'
      ? randomDecimal(0.01, 0.05, 8)
      : randomDecimal(10, 50, 8);

    const operations = [
      'Staking Rewards',
      'ETH 2.0 Staking Rewards',
      'POS savings interest',
    ];

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: randomChoice(operations),
      coin: asset,
      change: amount,
      remark: randomChoice(operations),
    });
  }

  generateInterest(date: Date): void {
    const stablecoin = randomChoice(['USDT', 'USDC']);
    const amount = randomDecimal(8, 25, 8);

    const operations = [
      'Savings Interest',
      'Simple Earn Flexible Interest',
    ];

    const operation = randomChoice(operations);

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation,
      coin: stablecoin,
      change: amount,
      remark: operation,
    });
  }

  generateLaunchpool(date: Date): void {
    const asset = randomChoice(['CAKE', 'BNB']);
    const amount = randomDecimal(8, 20, 8);

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Launchpool Interest',
      coin: asset,
      change: amount,
      remark: 'Launchpool Interest',
    });
  }

  generateAirdrop(date: Date): void {
    const airdropAssets = ['ARB', 'OP', 'ZETA', 'SUI'];
    const asset = randomChoice(airdropAssets);
    const amount = randomDecimal(100, 300, 8);

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Airdrop Assets',
      coin: asset,
      change: amount,
      remark: 'Airdrop Assets',
    });
  }

  generateDistribution(date: Date): void {
    const amount = randomDecimal(0.1, 0.3, 8);

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Distribution',
      coin: 'BNB',
      change: amount,
      remark: 'Referral Kickback',
    });
  }

  generateLiquidSwap(date: Date): void {
    const amount = randomInt(500, 1000);

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Liquid Swap add',
      coin: 'BUSD',
      change: -amount,
      remark: '',
    });

    const swapDate = new Date(date.getTime() + 1000);
    this.addTransaction({
      userId: USER_ID,
      timestamp: swapDate,
      account: 'Spot',
      operation: 'Liquid Swap add',
      coin: 'USDT',
      change: -amount,
      remark: '',
    });
  }

  generateLiquidSwapReward(date: Date): void {
    const amount = randomDecimal(2, 6, 8);

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Liquid Swap rewards',
      coin: 'BUSD',
      change: amount,
      remark: 'Liquid Swap rewards',
    });
  }

  generateSmallAssetsExchange(date: Date): void {
    const amount = randomDecimal(0.005, 0.015, 8);

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Small assets exchange BNB',
      coin: 'BNB',
      change: amount,
      remark: 'Small assets exchange BNB',
    });

    const exchangeDate = new Date(date.getTime());
    this.addTransaction({
      userId: USER_ID,
      timestamp: exchangeDate,
      account: 'Spot',
      operation: 'Small assets exchange BNB',
      coin: 'USDT',
      change: -randomDecimal(0.2, 0.5, 2),
      remark: 'Small assets exchange BNB',
    });
  }

  generateBNBMining(date: Date): void {
    const amount = randomDecimal(0.02, 0.05, 8);

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: 'Super BNB Mining',
      coin: 'BNB',
      change: amount,
      remark: 'Super BNB Mining',
    });
  }

  generateCashback(date: Date): void {
    const amount = randomDecimal(0.01, 0.02, 8);

    const operations = [
      { op: 'Cash Voucher distribution', remark: 'Cash Voucher distribution' },
      { op: 'Transaction Related', remark: 'Cashback Voucher' },
    ];

    const { op, remark } = randomChoice(operations);

    this.addTransaction({
      userId: USER_ID,
      timestamp: date,
      account: 'Spot',
      operation: op,
      coin: 'BNB',
      change: amount,
      remark,
    });
  }

  generate(): void {
    // Start with deposits spread across 3 years
    this.generateDeposit(new Date(Date.UTC(currentYear - 2, 0, 15, 8, 30, 15)));
    this.generateDeposit(new Date(Date.UTC(currentYear - 2, 6, 15, 11, 8, 19)));
    this.generateDeposit(new Date(Date.UTC(currentYear - 1, 2, 10, 14, 20, 30)));
    this.generateDeposit(new Date(Date.UTC(currentYear, 7, 28, 16, 40, 55)));

    // Generate trading activity
    const monthsToGenerate = 36; // 3 years

    for (let month = 0; month < monthsToGenerate; month++) {
      const monthDate = new Date(START_DATE);
      monthDate.setMonth(START_DATE.getMonth() + month);

      // 2-4 buys per month
      const buyCount = randomInt(2, 4);
      for (let i = 0; i < buyCount; i++) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateBuy(date);
      }

      // 1-2 sells per month (after first 2 months)
      if (month > 2) {
        const sellCount = randomInt(1, 2);
        for (let i = 0; i < sellCount; i++) {
          const date = randomDate(
            new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
            new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
          );
          this.generateSell(date);
        }
      }

      // Staking rewards monthly
      if (month % 1 === 0) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateStakingReward(date);
      }

      // Interest monthly
      if (month % 1 === 0) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateInterest(date);
      }

      // Other activities (less frequent)
      if (month % 2 === 0) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateLaunchpool(date);
      }

      if (month % 3 === 0) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateDistribution(date);
      }

      if (month % 4 === 0) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateConvert(date);
      }

      if (month % 5 === 0 && month > 5) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateAirdrop(date);
      }

      if (month % 4 === 0) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateBNBMining(date);
      }

      if (month % 6 === 0) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateCashback(date);
      }

      if (month % 8 === 0 && month > 6) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateLiquidSwap(date);
      }

      if (month % 8 === 1 && month > 6) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateLiquidSwapReward(date);
      }

      if (month % 6 === 0) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateSmallAssetsExchange(date);
      }

      // Occasional withdrawal
      if (month % 12 === 0 && month > 0) {
        const date = randomDate(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        );
        this.generateWithdraw(date);
      }
    }
  }

  output(): void {
    // Sort by timestamp
    this.transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Output CSV
    console.log('User_ID,UTC_Time,Account,Operation,Coin,Change,Remark');

    for (const tx of this.transactions) {
      console.log(
        `${tx.userId},${formatDate(tx.timestamp)},${tx.account},${tx.operation},${tx.coin},${tx.change},${tx.remark}`
      );
    }
  }
}

// Generate and output
const generator = new TransactionGenerator();
generator.generate();
generator.output();
