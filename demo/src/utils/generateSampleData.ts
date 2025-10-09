/**
 * Generate realistic Binance sample transaction data dynamically
 */

// Asset pools
const MAJOR_ASSETS = ["BTC", "ETH", "BNB", "SOL", "AVAX"];
const MID_ASSETS = ["ADA", "MATIC", "LINK", "DOT", "OP", "ARB"];
const SMALL_ASSETS = ["CAKE", "SUI", "ZETA"];
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
	return new Date(
		start.getTime() + Math.random() * (end.getTime() - start.getTime()),
	);
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
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hour = String(date.getUTCHours()).padStart(2, "0");
	const minute = String(date.getUTCMinutes()).padStart(2, "0");
	const second = String(date.getUTCSeconds()).padStart(2, "0");
	return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function calculateAmount(asset: string, usdAmount: number): number {
	const priceRange = ASSET_PRICE_RANGES[asset];
	if (!priceRange) return randomDecimal(0.1, 1000, 8);

	const avgPrice = (priceRange.min + priceRange.max) / 2;
	const amount = usdAmount / avgPrice;
	return parseFloat(amount.toFixed(8));
}

interface CSVRow {
	userId: string;
	timestamp: Date;
	account: string;
	operation: string;
	coin: string;
	change: number;
	remark: string;
}

class SampleDataGenerator {
	private rows: CSVRow[] = [];
	private holdings: Map<string, number> = new Map();

	constructor() {
		// Initialize with USDT
		this.holdings.set("USDT", 20000);
	}

	private addRow(row: CSVRow): void {
		this.rows.push(row);
		const current = this.holdings.get(row.coin) || 0;
		this.holdings.set(row.coin, current + row.change);
	}

	private generateDeposit(date: Date): void {
		const amount = randomChoice([5000, 10000, 15000]);
		this.addRow({
			userId: "123456789",
			timestamp: date,
			account: "Spot",
			operation: "Deposit",
			coin: "USDT",
			change: amount,
			remark: "",
		});
	}

	private generateBuy(date: Date): void {
		const usdtBalance = this.holdings.get("USDT") || 0;
		if (usdtBalance < 100) return;

		const asset = randomChoice(ALL_ASSETS);
		const usdAmount = randomInt(
			100,
			Math.min(3000, Math.floor(usdtBalance * 0.2)),
		);
		const amount = calculateAmount(asset, usdAmount);

		this.addRow({
			userId: "123456789",
			timestamp: date,
			account: "Spot",
			operation: "Buy",
			coin: asset,
			change: amount,
			remark: "",
		});

		// Add trading fee
		const fee = randomDecimal(0.5, 5, 2);
		this.addRow({
			userId: "123456789",
			timestamp: new Date(date.getTime()),
			account: "Spot",
			operation: "Fee",
			coin: "USDT",
			change: -fee,
			remark: "Trading Fee",
		});
	}

	private generateSell(date: Date): void {
		const sellableAssets = ALL_ASSETS.filter((asset) => {
			const balance = this.holdings.get(asset) || 0;
			return balance > 0;
		});

		if (sellableAssets.length === 0) return;

		const asset = randomChoice(sellableAssets);
		const balance = this.holdings.get(asset)!;
		const sellPercentage = randomDecimal(0.2, 0.6, 2);
		const amount = parseFloat((balance * sellPercentage).toFixed(8));

		this.addRow({
			userId: "123456789",
			timestamp: date,
			account: "Spot",
			operation: "Sell",
			coin: asset,
			change: -amount,
			remark: "",
		});

		// Add trading fee
		const fee = randomDecimal(0.5, 3, 2);
		this.addRow({
			userId: "123456789",
			timestamp: new Date(date.getTime()),
			account: "Spot",
			operation: "Fee",
			coin: "USDT",
			change: -fee,
			remark: "Trading Fee",
		});
	}

	private generateStakingReward(date: Date): void {
		const stakingAssets = ["DOT", "ETH", "ADA", "SOL"];
		const asset = randomChoice(stakingAssets);
		const amount =
			asset === "DOT"
				? randomDecimal(15, 30, 8)
				: asset === "ETH"
					? randomDecimal(0.01, 0.05, 8)
					: randomDecimal(10, 50, 8);

		const operations = [
			"Staking Rewards",
			"ETH 2.0 Staking Rewards",
			"POS savings interest",
		];

		const operation = randomChoice(operations);

		this.addRow({
			userId: "123456789",
			timestamp: date,
			account: "Spot",
			operation,
			coin: asset,
			change: amount,
			remark: operation,
		});
	}

	private generateInterest(date: Date): void {
		const stablecoin = randomChoice(["USDT", "USDC"]);
		const amount = randomDecimal(8, 25, 8);

		const operations = ["Savings Interest", "Simple Earn Flexible Interest"];

		const operation = randomChoice(operations);

		this.addRow({
			userId: "123456789",
			timestamp: date,
			account: "Spot",
			operation,
			coin: stablecoin,
			change: amount,
			remark: operation,
		});
	}

	private generateAirdrop(date: Date): void {
		const airdropAssets = ["ARB", "OP", "ZETA", "SUI"];
		const asset = randomChoice(airdropAssets);
		const amount = randomDecimal(100, 300, 8);

		this.addRow({
			userId: "123456789",
			timestamp: date,
			account: "Spot",
			operation: "Airdrop Assets",
			coin: asset,
			change: amount,
			remark: "Airdrop Assets",
		});
	}

	private generateDistribution(date: Date): void {
		const amount = randomDecimal(0.1, 0.3, 8);

		this.addRow({
			userId: "123456789",
			timestamp: date,
			account: "Spot",
			operation: "Distribution",
			coin: "BNB",
			change: amount,
			remark: "Referral Kickback",
		});
	}

	generate(): string {
		// Generate data for the last 3 years based on current date
		const now = new Date();
		const currentYear = now.getUTCFullYear();
		const startDate = new Date(Date.UTC(currentYear - 2, 0, 1)); // 3 years ago (start of year)
		const endDate = new Date(now.getTime()); // Today (not exceeding current date)

		// Initial deposits spread across 3 years (ensure they're not in the future)
		const deposits = [
			new Date(Date.UTC(currentYear - 2, 0, 15, 8, 30, 15)),
			new Date(Date.UTC(currentYear - 2, 6, 15, 11, 8, 19)),
			new Date(Date.UTC(currentYear - 1, 2, 10, 14, 20, 30)),
			new Date(Date.UTC(currentYear, 0, 15, 16, 40, 55)), // Changed to January of current year
		];

		// Only generate deposits that are not in the future
		deposits.forEach((date) => {
			if (date <= endDate) {
				this.generateDeposit(date);
			}
		});

		// Generate transactions over 36 months (3 years)
		const monthsToGenerate = 36;

		for (let month = 0; month < monthsToGenerate; month++) {
			const monthDate = new Date(startDate);
			monthDate.setMonth(startDate.getMonth() + month);

			// Skip future months
			if (monthDate > endDate) break;

			// Calculate end of month, but not exceeding today
			const monthStart = new Date(
				monthDate.getFullYear(),
				monthDate.getMonth(),
				1,
			);
			const monthEnd = new Date(
				monthDate.getFullYear(),
				monthDate.getMonth() + 1,
				0,
			);
			const effectiveEnd = monthEnd > endDate ? endDate : monthEnd;

			// 2-4 buys per month
			const buyCount = randomInt(2, 4);
			for (let i = 0; i < buyCount; i++) {
				const date = randomDate(monthStart, effectiveEnd);
				if (date <= endDate) {
					this.generateBuy(date);
				}
			}

			// 1-2 sells per month (after first 2 months)
			if (month > 2) {
				const sellCount = randomInt(1, 2);
				for (let i = 0; i < sellCount; i++) {
					const date = randomDate(monthStart, effectiveEnd);
					if (date <= endDate) {
						this.generateSell(date);
					}
				}
			}

			// Monthly rewards
			if (month % 1 === 0) {
				const date = randomDate(monthStart, effectiveEnd);
				if (date <= endDate) {
					this.generateStakingReward(date);
				}
			}

			if (month % 1 === 0) {
				const date = randomDate(monthStart, effectiveEnd);
				if (date <= endDate) {
					this.generateInterest(date);
				}
			}

			// Less frequent events
			if (month % 3 === 0) {
				const date = randomDate(monthStart, effectiveEnd);
				if (date <= endDate) {
					this.generateDistribution(date);
				}
			}

			if (month % 5 === 0 && month > 5) {
				const date = randomDate(monthStart, effectiveEnd);
				if (date <= endDate) {
					this.generateAirdrop(date);
				}
			}
		}

		// Sort by timestamp
		this.rows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

		// Convert to CSV
		let csv = "User_ID,UTC_Time,Account,Operation,Coin,Change,Remark\n";
		for (const row of this.rows) {
			csv += `${row.userId},${formatDate(row.timestamp)},${row.account},${row.operation},${row.coin},${row.change},${row.remark}\n`;
		}

		return csv;
	}
}

export function generateSampleCSV(): string {
	const generator = new SampleDataGenerator();
	return generator.generate();
}
