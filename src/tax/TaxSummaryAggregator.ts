/**
 * Tax Summary Aggregator
 *
 * Aggregates transaction data into comprehensive tax summaries.
 * Calculates totals, breakdowns by asset/exchange/month, and summary statistics.
 */

import type { TaxableTransaction } from "./models/TaxableTransaction";
import type { AssetSummary, TaxSummary } from "./models/TaxSummary";
import {
	getTransactionAsset,
	getTransactionTimestamp,
} from "./utils/transactionHelpers";

/**
 * Tax Summary Aggregator Service
 */
export class TaxSummaryAggregator {
	/**
	 * Generate tax summary from taxable transactions
	 */
	generateSummary(transactions: TaxableTransaction[]): TaxSummary {
		const summary: TaxSummary = {
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
		};

		// Process each transaction
		for (const tx of transactions) {
			this.processTransaction(tx, summary);
		}

		// Calculate net amounts
		summary.netCapitalGain =
			summary.totalCapitalGains - summary.totalCapitalLosses;
		summary.taxableCapitalGain = Math.max(
			0,
			summary.netCapitalGain - summary.cgtDiscount,
		);
		summary.netTaxableAmount =
			summary.taxableCapitalGain +
			summary.ordinaryIncome -
			summary.totalDeductions;

		return summary;
	}

	/**
	 * Generate summary for a specific asset
	 */
	generateAssetSummary(
		transactions: TaxableTransaction[],
		assetSymbol: string,
	): AssetSummary {
		const assetTransactions = transactions.filter(
			(tx) => getTransactionAsset(tx.originalTransaction) === assetSymbol,
		);

		const summary: AssetSummary = {
			asset: assetSymbol,
			disposals: 0,
			acquisitions: 0,
			netGain: 0,
			netLoss: 0,
		};

		for (const tx of assetTransactions) {
			if (tx.taxTreatment.eventType === "DISPOSAL") {
				summary.disposals++;
			} else if (tx.taxTreatment.eventType === "ACQUISITION") {
				summary.acquisitions++;
			}

			if (tx.capitalGain) {
				summary.netGain += tx.capitalGain;
			}

			if (tx.capitalLoss) {
				summary.netLoss += tx.capitalLoss;
			}
		}

		return summary;
	}

	/**
	 * Generate summary by date range
	 */
	generateRangeSummary(
		transactions: TaxableTransaction[],
		startDate: Date,
		endDate: Date,
	): TaxSummary {
		const filteredTransactions = transactions.filter((tx) => {
			const txDate = getTransactionTimestamp(tx.originalTransaction);
			return txDate >= startDate && txDate <= endDate;
		});

		return this.generateSummary(filteredTransactions);
	}

	/**
	 * Get top assets by capital gains
	 */
	getTopGainers(summary: TaxSummary, limit: number = 10): AssetSummary[] {
		return Array.from(summary.byAsset.values())
			.sort((a, b) => b.netGain - a.netGain)
			.slice(0, limit);
	}

	/**
	 * Get top assets by capital losses
	 */
	getTopLosers(summary: TaxSummary, limit: number = 10): AssetSummary[] {
		return Array.from(summary.byAsset.values())
			.sort((a, b) => b.netLoss - a.netLoss)
			.slice(0, limit);
	}

	// Private helper methods

	/**
	 * Process a single transaction into summary
	 */
	private processTransaction(
		tx: TaxableTransaction,
		summary: TaxSummary,
	): void {
		// Count event types
		if (tx.taxTreatment.eventType === "DISPOSAL") {
			summary.totalDisposals++;
		} else if (tx.taxTreatment.eventType === "ACQUISITION") {
			summary.totalAcquisitions++;
		}

		// Aggregate capital gains/losses
		if (tx.capitalGain !== undefined && tx.capitalGain > 0) {
			summary.totalCapitalGains += tx.capitalGain;

			// Track CGT discount if applied
			if (tx.taxTreatment.cgtDiscountApplied && tx.costBasis) {
				const discount = tx.capitalGain * 0.5; // Assuming 50% discount
				summary.cgtDiscount += discount;
			}
		}

		if (tx.capitalLoss !== undefined && tx.capitalLoss > 0) {
			summary.totalCapitalLosses += tx.capitalLoss;
		}

		// Aggregate income
		if (tx.incomeAmount !== undefined && tx.incomeAmount > 0) {
			summary.ordinaryIncome += tx.incomeAmount;
		}

		// Aggregate deductions
		if (tx.deductibleAmount !== undefined && tx.deductibleAmount > 0) {
			summary.totalDeductions += tx.deductibleAmount;
		}

		// Update asset breakdown
		this.updateAssetSummary(tx, summary);

		// Update exchange breakdown
		this.updateExchangeSummary(tx, summary);

		// Update monthly breakdown
		this.updateMonthlySummary(tx, summary);
	}

	/**
	 * Update asset summary
	 */
	private updateAssetSummary(
		tx: TaxableTransaction,
		summary: TaxSummary,
	): void {
		const asset = getTransactionAsset(tx.originalTransaction) || "UNKNOWN";

		if (!summary.byAsset.has(asset)) {
			summary.byAsset.set(asset, {
				asset,
				disposals: 0,
				acquisitions: 0,
				netGain: 0,
				netLoss: 0,
			});
		}

		const assetSummary = summary.byAsset.get(asset)!;

		if (tx.taxTreatment.eventType === "DISPOSAL") {
			assetSummary.disposals++;
		} else if (tx.taxTreatment.eventType === "ACQUISITION") {
			assetSummary.acquisitions++;
		}

		if (tx.capitalGain) {
			assetSummary.netGain += tx.capitalGain;
		}

		if (tx.capitalLoss) {
			assetSummary.netLoss += tx.capitalLoss;
		}
	}

	/**
	 * Update exchange summary
	 */
	private updateExchangeSummary(
		tx: TaxableTransaction,
		summary: TaxSummary,
	): void {
		const exchange = tx.originalTransaction.source.name || "UNKNOWN";
		const disposalValue = tx.taxableAmount || 0;

		if (!summary.byExchange.has(exchange)) {
			summary.byExchange.set(exchange, {
				exchange,
				transactions: 0,
				totalValue: 0,
				netGain: 0,
			});
		}

		const exchangeSummary = summary.byExchange.get(exchange)!;
		exchangeSummary.transactions++;
		exchangeSummary.totalValue += Math.abs(disposalValue);

		if (tx.capitalGain) {
			exchangeSummary.netGain += tx.capitalGain;
		}

		if (tx.capitalLoss) {
			exchangeSummary.netGain -= tx.capitalLoss;
		}
	}

	/**
	 * Update monthly summary
	 */
	private updateMonthlySummary(
		tx: TaxableTransaction,
		summary: TaxSummary,
	): void {
		const date = getTransactionTimestamp(tx.originalTransaction);
		const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

		if (!summary.byMonth.has(monthKey)) {
			summary.byMonth.set(monthKey, {
				month: monthKey,
				transactions: 0,
				gains: 0,
				losses: 0,
			});
		}

		const monthlySummary = summary.byMonth.get(monthKey)!;
		monthlySummary.transactions++;

		if (tx.capitalGain && tx.capitalGain > 0) {
			monthlySummary.gains += tx.capitalGain;
		}

		if (tx.capitalLoss && tx.capitalLoss > 0) {
			monthlySummary.losses += tx.capitalLoss;
		}
	}
}

/**
 * Create a tax summary aggregator instance
 */
export function createTaxSummaryAggregator(): TaxSummaryAggregator {
	return new TaxSummaryAggregator();
}
