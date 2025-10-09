/**
 * TaxSummary Model
 *
 * Aggregated tax information for reporting.
 * Contains totals and breakdowns by asset, exchange, and time period.
 */

export interface AssetSummary {
	asset: string;
	disposals: number;
	acquisitions: number;
	netGain: number;
	netLoss: number;
}

export interface ExchangeSummary {
	exchange: string;
	transactions: number;
	totalValue: number;
	netGain: number;
}

export interface MonthlySummary {
	month: string;
	transactions: number;
	gains: number;
	losses: number;
}

export interface TaxSummary {
	totalDisposals: number;
	totalAcquisitions: number;
	totalCapitalGains: number;
	totalCapitalLosses: number;
	netCapitalGain: number;
	cgtDiscount: number;
	taxableCapitalGain: number;
	ordinaryIncome: number;
	totalDeductions: number;
	netTaxableAmount: number;
	byAsset: Map<string, AssetSummary>;
	byExchange: Map<string, ExchangeSummary>;
	byMonth: Map<string, MonthlySummary>;
}

export class AssetSummaryModel implements AssetSummary {
	public readonly asset: string;
	public readonly disposals: number;
	public readonly acquisitions: number;
	public readonly netGain: number;
	public readonly netLoss: number;

	constructor(data: AssetSummary) {
		this.validateInput(data);

		this.asset = data.asset;
		this.disposals = data.disposals;
		this.acquisitions = data.acquisitions;
		this.netGain = data.netGain;
		this.netLoss = data.netLoss;
	}

	private validateInput(data: AssetSummary): void {
		if (!data) {
			throw new Error("Asset summary data is required");
		}

		if (!data.asset || data.asset.trim().length === 0) {
			throw new Error("Asset symbol is required");
		}

		if (typeof data.disposals !== "number" || data.disposals < 0) {
			throw new Error("Disposals must be a non-negative number");
		}

		if (typeof data.acquisitions !== "number" || data.acquisitions < 0) {
			throw new Error("Acquisitions must be a non-negative number");
		}

		if (typeof data.netGain !== "number" || data.netGain < 0) {
			throw new Error("Net gain must be a non-negative number");
		}

		if (typeof data.netLoss !== "number" || data.netLoss < 0) {
			throw new Error("Net loss must be a non-negative number");
		}
	}

	public getNetPosition(): number {
		return this.netGain - this.netLoss;
	}

	public getTotalTransactions(): number {
		return this.disposals + this.acquisitions;
	}

	public toJSON(): AssetSummary {
		return {
			asset: this.asset,
			disposals: this.disposals,
			acquisitions: this.acquisitions,
			netGain: this.netGain,
			netLoss: this.netLoss,
		};
	}
}

export class ExchangeSummaryModel implements ExchangeSummary {
	public readonly exchange: string;
	public readonly transactions: number;
	public readonly totalValue: number;
	public readonly netGain: number;

	constructor(data: ExchangeSummary) {
		this.validateInput(data);

		this.exchange = data.exchange;
		this.transactions = data.transactions;
		this.totalValue = data.totalValue;
		this.netGain = data.netGain;
	}

	private validateInput(data: ExchangeSummary): void {
		if (!data) {
			throw new Error("Exchange summary data is required");
		}

		if (!data.exchange || data.exchange.trim().length === 0) {
			throw new Error("Exchange name is required");
		}

		if (typeof data.transactions !== "number" || data.transactions < 0) {
			throw new Error("Transactions must be a non-negative number");
		}

		if (typeof data.totalValue !== "number" || data.totalValue < 0) {
			throw new Error("Total value must be a non-negative number");
		}

		if (typeof data.netGain !== "number") {
			throw new Error("Net gain must be a number");
		}
	}

	public getAverageTransactionValue(): number {
		if (this.transactions === 0) return 0;
		return this.totalValue / this.transactions;
	}

	public toJSON(): ExchangeSummary {
		return {
			exchange: this.exchange,
			transactions: this.transactions,
			totalValue: this.totalValue,
			netGain: this.netGain,
		};
	}
}

export class MonthlySummaryModel implements MonthlySummary {
	public readonly month: string;
	public readonly transactions: number;
	public readonly gains: number;
	public readonly losses: number;

	constructor(data: MonthlySummary) {
		this.validateInput(data);

		this.month = data.month;
		this.transactions = data.transactions;
		this.gains = data.gains;
		this.losses = data.losses;
	}

	private validateInput(data: MonthlySummary): void {
		if (!data) {
			throw new Error("Monthly summary data is required");
		}

		if (!data.month || data.month.trim().length === 0) {
			throw new Error("Month is required");
		}

		if (typeof data.transactions !== "number" || data.transactions < 0) {
			throw new Error("Transactions must be a non-negative number");
		}

		if (typeof data.gains !== "number" || data.gains < 0) {
			throw new Error("Gains must be a non-negative number");
		}

		if (typeof data.losses !== "number" || data.losses < 0) {
			throw new Error("Losses must be a non-negative number");
		}
	}

	public getNetResult(): number {
		return this.gains - this.losses;
	}

	public toJSON(): MonthlySummary {
		return {
			month: this.month,
			transactions: this.transactions,
			gains: this.gains,
			losses: this.losses,
		};
	}
}

export class TaxSummaryModel implements TaxSummary {
	public readonly totalDisposals: number;
	public readonly totalAcquisitions: number;
	public readonly totalCapitalGains: number;
	public readonly totalCapitalLosses: number;
	public readonly netCapitalGain: number;
	public readonly cgtDiscount: number;
	public readonly taxableCapitalGain: number;
	public readonly ordinaryIncome: number;
	public readonly totalDeductions: number;
	public readonly netTaxableAmount: number;
	public readonly byAsset: Map<string, AssetSummary>;
	public readonly byExchange: Map<string, ExchangeSummary>;
	public readonly byMonth: Map<string, MonthlySummary>;

	constructor(data: TaxSummary) {
		// Validate required fields
		this.validateInput(data);

		this.totalDisposals = data.totalDisposals;
		this.totalAcquisitions = data.totalAcquisitions;
		this.totalCapitalGains = data.totalCapitalGains;
		this.totalCapitalLosses = data.totalCapitalLosses;
		this.netCapitalGain = data.netCapitalGain;
		this.cgtDiscount = data.cgtDiscount;
		this.taxableCapitalGain = data.taxableCapitalGain;
		this.ordinaryIncome = data.ordinaryIncome;
		this.totalDeductions = data.totalDeductions;
		this.netTaxableAmount = data.netTaxableAmount;

		// Convert Maps
		this.byAsset = new Map(data.byAsset);
		this.byExchange = new Map(data.byExchange);
		this.byMonth = new Map(data.byMonth);
	}

	/**
	 * Creates an empty tax summary
	 */
	public static createEmpty(): TaxSummaryModel {
		return new TaxSummaryModel({
			totalDisposals: 0,
			totalAcquisitions: 0,
			totalCapitalGains: 0,
			totalCapitalLosses: 0,
			netCapitalGain: 0,
			cgtDiscount: 0,
			taxableCapitalGain: 0,
			ordinaryIncome: 0,
			totalDeductions: 0,
			netTaxableAmount: 0,
			byAsset: new Map(),
			byExchange: new Map(),
			byMonth: new Map(),
		});
	}

	/**
	 * Creates a tax summary from transaction data
	 */
	public static create(params: {
		totalDisposals: number;
		totalAcquisitions: number;
		totalCapitalGains: number;
		totalCapitalLosses: number;
		cgtDiscountAmount: number;
		ordinaryIncome: number;
		totalDeductions: number;
		assetSummaries: AssetSummary[];
		exchangeSummaries: ExchangeSummary[];
		monthlySummaries: MonthlySummary[];
	}): TaxSummaryModel {
		const netCapitalGain = params.totalCapitalGains - params.totalCapitalLosses;
		const taxableCapitalGain = netCapitalGain - params.cgtDiscountAmount;
		const netTaxableAmount =
			Math.max(0, taxableCapitalGain) +
			params.ordinaryIncome -
			params.totalDeductions;

		// Convert arrays to Maps
		const byAsset = new Map<string, AssetSummary>();
		params.assetSummaries.forEach((summary) => {
			byAsset.set(summary.asset, summary);
		});

		const byExchange = new Map<string, ExchangeSummary>();
		params.exchangeSummaries.forEach((summary) => {
			byExchange.set(summary.exchange, summary);
		});

		const byMonth = new Map<string, MonthlySummary>();
		params.monthlySummaries.forEach((summary) => {
			byMonth.set(summary.month, summary);
		});

		return new TaxSummaryModel({
			totalDisposals: params.totalDisposals,
			totalAcquisitions: params.totalAcquisitions,
			totalCapitalGains: params.totalCapitalGains,
			totalCapitalLosses: params.totalCapitalLosses,
			netCapitalGain,
			cgtDiscount: params.cgtDiscountAmount,
			taxableCapitalGain: Math.max(0, taxableCapitalGain),
			ordinaryIncome: params.ordinaryIncome,
			totalDeductions: params.totalDeductions,
			netTaxableAmount,
			byAsset,
			byExchange,
			byMonth,
		});
	}

	/**
	 * Validates the input data for tax summary
	 */
	private validateInput(data: TaxSummary): void {
		if (!data) {
			throw new Error("Tax summary data is required");
		}

		const numericFields = [
			"totalDisposals",
			"totalAcquisitions",
			"totalCapitalGains",
			"totalCapitalLosses",
			"netCapitalGain",
			"cgtDiscount",
			"taxableCapitalGain",
			"ordinaryIncome",
			"totalDeductions",
			"netTaxableAmount",
		];

		for (const field of numericFields) {
			const value = (data as any)[field];
			if (typeof value !== "number") {
				throw new Error(`${field} must be a number`);
			}
		}

		// Validate non-negative fields
		const nonNegativeFields = [
			"totalDisposals",
			"totalAcquisitions",
			"totalCapitalGains",
			"totalCapitalLosses",
			"cgtDiscount",
			"taxableCapitalGain",
			"ordinaryIncome",
			"totalDeductions",
		];

		for (const field of nonNegativeFields) {
			const value = (data as any)[field];
			if (value < 0) {
				throw new Error(`${field} must be non-negative`);
			}
		}

		// Validate Maps
		if (!(data.byAsset instanceof Map)) {
			throw new Error("byAsset must be a Map");
		}

		if (!(data.byExchange instanceof Map)) {
			throw new Error("byExchange must be a Map");
		}

		if (!(data.byMonth instanceof Map)) {
			throw new Error("byMonth must be a Map");
		}

		// Business logic validation
		const expectedNetCapitalGain =
			data.totalCapitalGains - data.totalCapitalLosses;
		if (Math.abs(data.netCapitalGain - expectedNetCapitalGain) > 0.01) {
			throw new Error(
				`Net capital gain (${data.netCapitalGain}) should equal total gains (${data.totalCapitalGains}) minus total losses (${data.totalCapitalLosses})`,
			);
		}
	}

	/**
	 * Gets total transactions count
	 */
	public getTotalTransactions(): number {
		return this.totalDisposals + this.totalAcquisitions;
	}

	/**
	 * Gets the overall tax position (positive = tax owed, negative = refund)
	 */
	public getTaxPosition(): number {
		return this.netTaxableAmount;
	}

	/**
	 * Checks if there are capital losses to carry forward
	 */
	public hasCapitalLossesToCarryForward(): boolean {
		return this.netCapitalGain < 0;
	}

	/**
	 * Gets capital losses available to carry forward
	 */
	public getCapitalLossCarryForward(): number {
		return this.netCapitalGain < 0 ? Math.abs(this.netCapitalGain) : 0;
	}

	/**
	 * Gets the CGT discount rate applied
	 */
	public getCgtDiscountRate(): number {
		if (this.totalCapitalGains === 0) return 0;
		return this.cgtDiscount / this.totalCapitalGains;
	}

	/**
	 * Gets assets sorted by net position (highest gains first)
	 */
	public getAssetsByPerformance(): AssetSummary[] {
		const assets = Array.from(this.byAsset.values());
		return assets.sort((a, b) => {
			const aNet = a.netGain - a.netLoss;
			const bNet = b.netGain - b.netLoss;
			return bNet - aNet; // Descending order
		});
	}

	/**
	 * Gets exchanges sorted by total value
	 */
	public getExchangesByVolume(): ExchangeSummary[] {
		const exchanges = Array.from(this.byExchange.values());
		return exchanges.sort((a, b) => b.totalValue - a.totalValue);
	}

	/**
	 * Gets months sorted chronologically
	 */
	public getMonthsChronologically(): MonthlySummary[] {
		const months = Array.from(this.byMonth.values());
		return months.sort((a, b) => a.month.localeCompare(b.month));
	}

	/**
	 * Gets the most profitable asset
	 */
	public getMostProfitableAsset(): AssetSummary | null {
		const assets = this.getAssetsByPerformance();
		if (assets.length === 0) return null;

		const topAsset = assets[0];
		const netPosition = topAsset.netGain - topAsset.netLoss;
		return netPosition > 0 ? topAsset : null;
	}

	/**
	 * Gets the most active exchange
	 */
	public getMostActiveExchange(): ExchangeSummary | null {
		const exchanges = Array.from(this.byExchange.values());
		if (exchanges.length === 0) return null;

		return exchanges.reduce((most, current) =>
			current.transactions > most.transactions ? current : most,
		);
	}

	/**
	 * Gets the peak month for gains
	 */
	public getPeakGainsMonth(): MonthlySummary | null {
		const months = Array.from(this.byMonth.values());
		if (months.length === 0) return null;

		return months.reduce((peak, current) =>
			current.gains > peak.gains ? current : peak,
		);
	}

	/**
	 * Gets summary statistics
	 */
	public getStatistics(): {
		totalTransactions: number;
		netTaxableAmount: number;
		capitalGainLossRatio: number;
		averageGainPerDisposal: number;
		cgtDiscountSavings: number;
		assetsTraded: number;
		exchangesUsed: number;
		monthsActive: number;
		largestGain: number;
		largestLoss: number;
	} {
		const assets = Array.from(this.byAsset.values());
		const exchanges = Array.from(this.byExchange.values());
		const months = Array.from(this.byMonth.values());

		const largestGain = Math.max(...assets.map((a) => a.netGain), 0);
		const largestLoss = Math.max(...assets.map((a) => a.netLoss), 0);

		return {
			totalTransactions: this.getTotalTransactions(),
			netTaxableAmount: this.netTaxableAmount,
			capitalGainLossRatio:
				this.totalCapitalLosses > 0
					? this.totalCapitalGains / this.totalCapitalLosses
					: Infinity,
			averageGainPerDisposal:
				this.totalDisposals > 0
					? this.totalCapitalGains / this.totalDisposals
					: 0,
			cgtDiscountSavings: this.cgtDiscount,
			assetsTraded: assets.length,
			exchangesUsed: exchanges.length,
			monthsActive: months.length,
			largestGain,
			largestLoss,
		};
	}

	/**
	 * Gets a breakdown by category
	 */
	public getCategoryBreakdown(): {
		capitalGains: {
			gross: number;
			discount: number;
			taxable: number;
		};
		ordinaryIncome: number;
		deductions: number;
		netTaxable: number;
	} {
		return {
			capitalGains: {
				gross: this.netCapitalGain > 0 ? this.netCapitalGain : 0,
				discount: this.cgtDiscount,
				taxable: this.taxableCapitalGain,
			},
			ordinaryIncome: this.ordinaryIncome,
			deductions: this.totalDeductions,
			netTaxable: this.netTaxableAmount,
		};
	}

	/**
	 * Validates the tax summary data integrity
	 */
	public validate(): {
		isValid: boolean;
		errors: string[];
		warnings: string[];
	} {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			this.validateInput(this);
		} catch (error) {
			errors.push(
				error instanceof Error ? error.message : "Unknown validation error",
			);
		}

		// Validate asset summaries
		const assetEntries = Array.from(this.byAsset.entries());
		for (const [asset, summary] of assetEntries) {
			if (summary.asset !== asset) {
				errors.push(
					`Asset summary key '${asset}' does not match summary asset '${summary.asset}'`,
				);
			}
		}

		// Validate exchange summaries
		const exchangeEntries = Array.from(this.byExchange.entries());
		for (const [exchange, summary] of exchangeEntries) {
			if (summary.exchange !== exchange) {
				errors.push(
					`Exchange summary key '${exchange}' does not match summary exchange '${summary.exchange}'`,
				);
			}
		}

		// Check for reasonable values
		if (this.netTaxableAmount > 1000000) {
			warnings.push(
				"Net taxable amount is very high - ensure calculations are accurate",
			);
		}

		if (this.cgtDiscount > this.totalCapitalGains) {
			errors.push("CGT discount cannot exceed total capital gains");
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Converts the tax summary to a plain object
	 */
	public toJSON(): TaxSummary {
		return {
			totalDisposals: this.totalDisposals,
			totalAcquisitions: this.totalAcquisitions,
			totalCapitalGains: this.totalCapitalGains,
			totalCapitalLosses: this.totalCapitalLosses,
			netCapitalGain: this.netCapitalGain,
			cgtDiscount: this.cgtDiscount,
			taxableCapitalGain: this.taxableCapitalGain,
			ordinaryIncome: this.ordinaryIncome,
			totalDeductions: this.totalDeductions,
			netTaxableAmount: this.netTaxableAmount,
			byAsset: new Map(this.byAsset),
			byExchange: new Map(this.byExchange),
			byMonth: new Map(this.byMonth),
		};
	}
}

export default TaxSummaryModel;
