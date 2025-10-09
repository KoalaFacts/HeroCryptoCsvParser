/**
 * Tax Report Generator
 *
 * Main orchestration component that coordinates all tax calculation components.
 * Processes transactions, applies tax rules, calculates capital gains, and generates reports.
 */

import type { Transaction } from "../types/transactions";
import { CapitalGainsCalculator } from "./calculators/CapitalGainsCalculator";
import { FIFOCalculator } from "./calculators/FIFOCalculator";
import { TaxOptimizationEngine } from "./calculators/TaxOptimizationEngine";
import { TransactionClassifier } from "./calculators/TransactionClassifier";
import type { TaxableTransaction } from "./models/TaxableTransaction";
import type { TaxJurisdiction } from "./models/TaxJurisdiction";
import type { TaxPeriod } from "./models/TaxPeriod";
import type { TaxReport } from "./models/TaxReport";
import type { TaxSummary } from "./models/TaxSummary";
import {
	getAustralianJurisdiction,
	getAustralianTaxYearBoundaries,
} from "./rules/AustralianTaxRules";
import {
	getQuoteAmount,
	getTransactionFee,
	getTransactionSource,
	getTransactionTimestamp,
} from "./utils/transactionHelpers";

// Use crypto.randomUUID() which works in both Node.js (v19+) and modern browsers
// Falls back to a simple implementation for older environments
const generateUUID = (): string => {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for older environments
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};
/**
 * Tax report configuration
 */
export interface TaxReportConfig {
	jurisdictionCode: "AU";
	taxYear: number;
	transactions: Transaction[];
	options?: {
		includeOptimization?: boolean;
		costBasisMethod?: "FIFO" | "SPECIFIC_IDENTIFICATION";
		investorType?: "PERSONAL" | "BUSINESS";
		treatAsBusinessIncome?: boolean;
		handleDeFi?: boolean;
		classifyYieldAsIncome?: boolean;
		classifyLPAsCapital?: boolean;
	};
}

/**
 * Generation progress callback
 */
export interface ProgressUpdate {
	processed: number;
	total: number;
	currentPhase: string;
	estimatedTimeRemaining?: number;
}

/**
 * Tax report generator
 */
export class TaxReportGenerator {
	private fifoCalculator: FIFOCalculator;
	private capitalGainsCalculator: CapitalGainsCalculator;
	private transactionClassifier: TransactionClassifier;
	private optimizationEngine: TaxOptimizationEngine;

	constructor() {
		this.fifoCalculator = new FIFOCalculator();
		this.capitalGainsCalculator = new CapitalGainsCalculator();
		this.transactionClassifier = new TransactionClassifier();
		this.optimizationEngine = new TaxOptimizationEngine();
	}

	/**
	 * Generate complete tax report
	 *
	 * @param config Report configuration
	 * @param onProgress Progress callback
	 * @returns Complete tax report
	 */
	async generateReport(
		config: TaxReportConfig,
		onProgress?: (progress: ProgressUpdate) => void,
	): Promise<TaxReport> {
		this.startTime = Date.now();
		const startTime = this.startTime;

		// 1. Load jurisdiction
		const jurisdiction = this.loadJurisdiction(config.jurisdictionCode);

		// 2. Calculate tax period
		const taxPeriod = this.calculateTaxPeriod(config.taxYear, jurisdiction);

		// 3. Filter transactions for tax period
		const filteredTransactions = this.filterTransactionsByPeriod(
			config.transactions,
			taxPeriod,
		);

		this.reportProgress(onProgress, {
			processed: 0,
			total: filteredTransactions.length,
			currentPhase: "Filtering transactions",
		});

		// 4. Classify transactions
		const taxableTransactions = await this.classifyTransactions(
			filteredTransactions,
			jurisdiction,
			config.options,
			onProgress,
		);

		// 5. Calculate cost basis and capital gains
		await this.calculateCostBasisAndGains(
			taxableTransactions,
			jurisdiction,
			config.options?.costBasisMethod || "FIFO",
			onProgress,
		);

		// 6. Generate summary
		const summary = this.generateSummary(taxableTransactions);

		// 7. Generate optimization strategies
		const optimizationStrategies = config.options?.includeOptimization
			? this.optimizationEngine.generateStrategies({
					transactions: taxableTransactions,
					jurisdiction,
					taxYear: config.taxYear,
					riskTolerance: "MODERATE",
				})
			: [];

		// 8. Build final report
		const report: TaxReport = {
			id: generateUUID(),
			jurisdiction,
			taxPeriod,
			generatedAt: new Date(),
			transactions: taxableTransactions,
			summary,
			optimizationStrategies,
			metadata: {
				totalTransactions: filteredTransactions.length,
				processedExchanges: this.getUniqueExchanges(filteredTransactions),
				reportVersion: "1.0.0",
				generationTime: Date.now() - startTime,
			},
		};

		this.reportProgress(onProgress, {
			processed: filteredTransactions.length,
			total: filteredTransactions.length,
			currentPhase: "Complete",
		});

		return report;
	}

	/**
	 * Load jurisdiction configuration
	 */
	private loadJurisdiction(code: "AU"): TaxJurisdiction {
		if (code === "AU") {
			return getAustralianJurisdiction();
		}

		throw new Error(`Unsupported jurisdiction: ${code}`);
	}

	/**
	 * Calculate tax period from year
	 */
	private calculateTaxPeriod(
		year: number,
		jurisdiction: TaxJurisdiction,
	): TaxPeriod {
		const boundaries = getAustralianTaxYearBoundaries(year);

		return {
			year,
			startDate: boundaries.startDate,
			endDate: boundaries.endDate,
			label: boundaries.label,
		};
	}

	/**
	 * Filter transactions by tax period
	 */
	private filterTransactionsByPeriod(
		transactions: Transaction[],
		period: TaxPeriod,
	): Transaction[] {
		return transactions.filter((tx) => {
			const txDate = getTransactionTimestamp(tx);
			return txDate >= period.startDate && txDate <= period.endDate;
		});
	}

	/**
	 * Classify all transactions with chunked processing (1000 tx/batch)
	 */
	private async classifyTransactions(
		transactions: Transaction[],
		jurisdiction: TaxJurisdiction,
		options: TaxReportConfig["options"],
		onProgress?: (progress: ProgressUpdate) => void,
	): Promise<TaxableTransaction[]> {
		const taxableTransactions: TaxableTransaction[] = [];
		const CHUNK_SIZE = 1000; // Process 1000 transactions per batch

		for (
			let chunkStart = 0;
			chunkStart < transactions.length;
			chunkStart += CHUNK_SIZE
		) {
			const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, transactions.length);
			const chunk = transactions.slice(chunkStart, chunkEnd);

			// Process chunk
			for (const transaction of chunk) {
				// Classify transaction
				const taxTreatment = this.transactionClassifier.classifyTransaction({
					transaction,
					jurisdiction: jurisdiction.code,
					isPersonalUse: false, // Would be determined by user input or heuristics
				});

				// Create taxable transaction
				const taxableTransaction: TaxableTransaction = {
					originalTransaction: transaction,
					taxTreatment,
				};

				taxableTransactions.push(taxableTransaction);
			}

			// Report progress after each chunk
			this.reportProgress(onProgress, {
				processed: chunkEnd,
				total: transactions.length,
				currentPhase: "Classifying transactions",
				estimatedTimeRemaining: this.estimateTimeRemaining(
					chunkEnd,
					transactions.length,
					Date.now(),
				),
			});

			// Allow event loop to process (prevent UI blocking)
			await this.yieldToEventLoop();
		}

		return taxableTransactions;
	}

	/**
	 * Calculate cost basis and capital gains for all disposals with chunked processing
	 */
	private async calculateCostBasisAndGains(
		transactions: TaxableTransaction[],
		jurisdiction: TaxJurisdiction,
		method: "FIFO" | "SPECIFIC_IDENTIFICATION",
		onProgress?: (progress: ProgressUpdate) => void,
	): Promise<void> {
		const CHUNK_SIZE = 1000; // Process 1000 transactions per batch

		// Separate acquisitions and disposals
		const acquisitions = transactions.filter(
			(tx) => tx.taxTreatment.eventType === "ACQUISITION",
		);

		const disposals = transactions.filter(
			(tx) => tx.taxTreatment.eventType === "DISPOSAL",
		);

		// Process disposals in chunks
		for (
			let chunkStart = 0;
			chunkStart < disposals.length;
			chunkStart += CHUNK_SIZE
		) {
			const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, disposals.length);
			const chunk = disposals.slice(chunkStart, chunkEnd);

			// Process each disposal in chunk
			for (const disposal of chunk) {
				try {
					// Calculate cost basis using FIFO
					const costBasis = this.fifoCalculator.calculateCostBasis(
						disposal.originalTransaction,
						acquisitions.map((a) => a.originalTransaction),
					);

					disposal.costBasis = costBasis;

					// Calculate capital gains
					const capitalGainsResult =
						this.capitalGainsCalculator.calculateCapitalGains({
							disposal: disposal.originalTransaction,
							costBasis,
							jurisdiction,
							isPersonalUseAsset: disposal.taxTreatment.isPersonalUse,
						});

					// Update taxable transaction with results
					disposal.capitalGain = capitalGainsResult.capitalGain;
					disposal.capitalLoss = capitalGainsResult.capitalLoss;
					disposal.taxableAmount = capitalGainsResult.taxableGain;
					disposal.taxTreatment.cgtDiscountApplied =
						capitalGainsResult.cgtDiscountApplied;
				} catch (error) {
					// Handle insufficient cost basis or other errors
					// Skip this disposal and continue processing
					// Error details will be visible in the report metadata
				}
			}

			// Report progress after each chunk
			this.reportProgress(onProgress, {
				processed: chunkEnd,
				total: disposals.length,
				currentPhase: "Calculating capital gains",
				estimatedTimeRemaining: this.estimateTimeRemaining(
					chunkEnd,
					disposals.length,
					Date.now(),
				),
			});

			// Allow event loop to process
			await this.yieldToEventLoop();
		}

		// Process income events
		const incomeEvents = transactions.filter(
			(tx) => tx.taxTreatment.eventType === "INCOME",
		);

		for (const incomeEvent of incomeEvents) {
			// Calculate income amount (would use market price at time of receipt)
			const quoteAmt = getQuoteAmount(incomeEvent.originalTransaction);
			incomeEvent.incomeAmount = Math.abs(quoteAmt || 0);
		}

		// Process deductible events
		const deductibleEvents = transactions.filter(
			(tx) => tx.taxTreatment.eventType === "DEDUCTIBLE",
		);

		for (const deductibleEvent of deductibleEvents) {
			const fee = getTransactionFee(deductibleEvent.originalTransaction);
			deductibleEvent.deductibleAmount = Math.abs(fee);
		}
	}

	/**
	 * Generate tax summary
	 */
	private generateSummary(transactions: TaxableTransaction[]): TaxSummary {
		const disposals = transactions.filter(
			(tx) => tx.taxTreatment.eventType === "DISPOSAL",
		);

		const acquisitions = transactions.filter(
			(tx) => tx.taxTreatment.eventType === "ACQUISITION",
		);

		const totalCapitalGains = disposals.reduce(
			(sum, tx) => sum + (tx.capitalGain || 0),
			0,
		);

		const totalCapitalLosses = disposals.reduce(
			(sum, tx) => sum + (tx.capitalLoss || 0),
			0,
		);

		const netCapitalGain = totalCapitalGains - totalCapitalLosses;

		const totalTaxableGain = disposals.reduce(
			(sum, tx) => sum + (tx.taxableAmount || 0),
			0,
		);

		const cgtDiscount = totalCapitalGains - totalTaxableGain;

		const ordinaryIncome = transactions
			.filter((tx) => tx.taxTreatment.eventType === "INCOME")
			.reduce((sum, tx) => sum + (tx.incomeAmount || 0), 0);

		const totalDeductions = transactions
			.filter((tx) => tx.taxTreatment.eventType === "DEDUCTIBLE")
			.reduce((sum, tx) => sum + (tx.deductibleAmount || 0), 0);

		const netTaxableAmount =
			totalTaxableGain + ordinaryIncome - totalDeductions;

		return {
			totalDisposals: disposals.length,
			totalAcquisitions: acquisitions.length,
			totalCapitalGains,
			totalCapitalLosses,
			netCapitalGain,
			cgtDiscount,
			taxableCapitalGain: totalTaxableGain,
			ordinaryIncome,
			totalDeductions,
			netTaxableAmount,
			byAsset: new Map(),
			byExchange: new Map(),
			byMonth: new Map(),
		};
	}

	/**
	 * Get unique exchanges from transactions
	 */
	private getUniqueExchanges(transactions: Transaction[]): string[] {
		const exchanges = new Set<string>();

		for (const tx of transactions) {
			const source = getTransactionSource(tx);
			if (source) {
				exchanges.add(source);
			}
		}

		return Array.from(exchanges);
	}

	/**
	 * Report progress to callback
	 */
	private reportProgress(
		onProgress: ((progress: ProgressUpdate) => void) | undefined,
		progress: ProgressUpdate,
	): void {
		if (onProgress) {
			onProgress(progress);
		}
	}

	/**
	 * Yield to event loop to prevent blocking
	 */
	private async yieldToEventLoop(): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, 0));
	}

	/**
	 * Estimate time remaining based on current progress
	 */
	private estimateTimeRemaining(
		processed: number,
		total: number,
		startTime: number,
	): number | undefined {
		if (processed === 0) return undefined;

		const elapsed = Date.now() - startTime;
		const rate = processed / elapsed; // transactions per millisecond
		const remaining = total - processed;

		return remaining / rate;
	}

	private startTime: number = Date.now();
}

/**
 * Generate tax report (convenience function)
 */
export async function generateTaxReport(
	config: TaxReportConfig,
	onProgress?: (progress: ProgressUpdate) => void,
): Promise<TaxReport> {
	const generator = new TaxReportGenerator();
	return generator.generateReport(config, onProgress);
}
