/**
 * Tax Service - High-Level API
 *
 * Provides a unified, user-friendly API for all tax reporting functionality.
 * Main entry point for tax report generation, optimization, and export.
 */

import type { Transaction } from "../types/transactions/Transaction";
import { TaxOptimizationEngine } from "./calculators/TaxOptimizationEngine";
import {
	type ATOExportOptions,
	exportTaxReportATO,
} from "./formatters/ATOXMLFormatter";
import {
	type CSVExportOptions,
	exportSummaryToCSV,
	exportTransactionsToCSV,
} from "./formatters/CSVExporter";
import {
	exportTaxReportPDF,
	type PDFExportOptions,
} from "./formatters/PDFReportFormatter";
import type { TaxJurisdiction } from "./models/TaxJurisdiction";
import type { TaxReport } from "./models/TaxReport";
import type { TaxStrategy } from "./models/TaxStrategy";
import { getAustralianJurisdiction } from "./rules/AustralianTaxRules";
import type { StorageAdapter } from "./storage/StorageAdapter";
import { closeAllStorage, initializeStorage } from "./storage/StorageManager";
import {
	type ProgressUpdate,
	type TaxReportConfig,
	TaxReportGenerator,
} from "./TaxReportGenerator";
import {
	getBaseAmount,
	getQuoteAmount,
	getTransactionAsset,
} from "./utils/transactionHelpers";

/**
 * Tax service configuration
 */
export interface TaxServiceConfig {
	enableStorage?: boolean;
	storageEncryptionKey?: string;
}

/**
 * Tax service - main API facade
 */
export class TaxService {
	private reportGenerator: TaxReportGenerator;
	private optimizationEngine: TaxOptimizationEngine;
	private storage: StorageAdapter | null = null;
	private config: TaxServiceConfig;

	constructor(config: TaxServiceConfig = {}) {
		this.config = config;
		this.reportGenerator = new TaxReportGenerator();
		this.optimizationEngine = new TaxOptimizationEngine();
	}

	/**
	 * Initialize tax service with optional storage
	 */
	async initialize(): Promise<void> {
		if (this.config.enableStorage) {
			this.storage = await initializeStorage({
				encryptionKey: this.config.storageEncryptionKey,
			});
		}
	}

	/**
	 * Generate complete tax report
	 *
	 * @param config Report configuration
	 * @param onProgress Progress callback
	 * @returns Tax report
	 */
	async generateTaxReport(
		config: TaxReportConfig,
		onProgress?: (progress: ProgressUpdate) => void,
	): Promise<TaxReport> {
		const report = await this.reportGenerator.generateReport(
			config,
			onProgress,
		);

		// Store report if storage enabled
		if (this.storage) {
			await this.storage.storeReport(report);
		}

		return report;
	}

	/**
	 * Get tax optimization strategies
	 *
	 * @param transactions Transactions to analyze
	 * @param jurisdictionCode Jurisdiction code
	 * @param taxYear Tax year
	 * @param riskTolerance Risk tolerance
	 * @returns Optimization strategies
	 */
	async getTaxOptimizationStrategies(
		transactions: Transaction[],
		jurisdictionCode: "AU",
		taxYear: number,
		riskTolerance: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE" = "MODERATE",
	): Promise<TaxStrategy[]> {
		// First generate report to get taxable transactions
		const report = await this.generateTaxReport({
			jurisdictionCode,
			taxYear,
			transactions,
			options: { includeOptimization: false },
		});

		// Get jurisdiction
		const jurisdiction = this.getSupportedJurisdiction(jurisdictionCode);

		// Generate strategies
		return this.optimizationEngine.generateStrategies({
			transactions: report.transactions,
			jurisdiction,
			taxYear,
			riskTolerance,
		});
	}

	/**
	 * Export tax report to PDF
	 *
	 * @param report Tax report
	 * @param options Export options
	 * @returns PDF buffer
	 */
	async exportToPDF(
		report: TaxReport,
		options?: PDFExportOptions,
	): Promise<Buffer> {
		return exportTaxReportPDF(report, options);
	}

	/**
	 * Export tax report to ATO format
	 *
	 * @param report Tax report
	 * @param options Export options with TFN/ABN
	 * @returns ATO XML string
	 */
	async exportToATO(
		report: TaxReport,
		options: ATOExportOptions,
	): Promise<string> {
		return exportTaxReportATO(report, options);
	}

	/**
	 * Export transactions to CSV
	 *
	 * @param report Tax report
	 * @param options Export options
	 * @returns CSV string
	 */
	exportTransactionsToCSV(
		report: TaxReport,
		options?: CSVExportOptions,
	): string {
		return exportTransactionsToCSV(report, options);
	}

	/**
	 * Export summary to CSV
	 *
	 * @param report Tax report
	 * @param options Export options
	 * @returns CSV string
	 */
	exportSummaryToCSV(report: TaxReport, options?: CSVExportOptions): string {
		return exportSummaryToCSV(report, options);
	}

	/**
	 * Get supported tax jurisdictions
	 *
	 * @returns Array of supported jurisdictions
	 */
	getSupportedJurisdictions(): TaxJurisdiction[] {
		return [getAustralianJurisdiction()];
	}

	/**
	 * Get specific jurisdiction configuration
	 *
	 * @param code Jurisdiction code
	 * @returns Jurisdiction configuration
	 */
	getSupportedJurisdiction(code: "AU"): TaxJurisdiction {
		if (code === "AU") {
			return getAustralianJurisdiction();
		}

		throw new Error(`Unsupported jurisdiction: ${code}`);
	}

	/**
	 * Get stored tax reports (if storage enabled)
	 *
	 * @returns Array of report summaries
	 */
	async getStoredReports(): Promise<
		Array<{
			id: string;
			jurisdiction: string;
			taxYear: number;
			generatedAt: Date;
			transactionCount: number;
			netTaxableAmount: number;
		}>
	> {
		if (!this.storage) {
			throw new Error("Storage not enabled");
		}

		return this.storage.listReports();
	}

	/**
	 * Get specific stored report by ID
	 *
	 * @param id Report ID
	 * @returns Tax report or null
	 */
	async getStoredReport(id: string): Promise<TaxReport | null> {
		if (!this.storage) {
			throw new Error("Storage not enabled");
		}

		return this.storage.getReport(id);
	}

	/**
	 * Delete stored report
	 *
	 * @param id Report ID
	 */
	async deleteStoredReport(id: string): Promise<void> {
		if (!this.storage) {
			throw new Error("Storage not enabled");
		}

		await this.storage.delete(id);
	}

	/**
	 * Calculate tax preview (estimate without full report generation)
	 *
	 * @param transactions Transactions
	 * @param jurisdictionCode Jurisdiction code
	 * @param taxYear Tax year
	 * @returns Preview summary
	 */
	async calculateTaxPreview(
		transactions: Transaction[],
		jurisdictionCode: "AU",
		taxYear: number,
	): Promise<{
		estimatedCapitalGains: number;
		estimatedCapitalLosses: number;
		estimatedNetGain: number;
		estimatedTaxableAmount: number;
		estimatedCGTDiscount: number;
	}> {
		// Generate lightweight report without storage
		const report = await this.generateTaxReport({
			jurisdictionCode,
			taxYear,
			transactions,
			options: {
				includeOptimization: false,
				costBasisMethod: "FIFO",
			},
		});

		return {
			estimatedCapitalGains: report.summary.totalCapitalGains,
			estimatedCapitalLosses: report.summary.totalCapitalLosses,
			estimatedNetGain: report.summary.netCapitalGain,
			estimatedTaxableAmount: report.summary.taxableCapitalGain,
			estimatedCGTDiscount: report.summary.cgtDiscount,
		};
	}

	/**
	 * Validate transactions for tax reporting
	 *
	 * @param transactions Transactions to validate
	 * @param jurisdictionCode Jurisdiction code
	 * @returns Validation result
	 */
	validateTransactions(
		transactions: Transaction[],
		jurisdictionCode: "AU",
	): {
		isValid: boolean;
		errors: Array<{ code: string; message: string; transaction?: Transaction }>;
		warnings: Array<{
			code: string;
			message: string;
			transaction?: Transaction;
		}>;
	} {
		const errors: Array<{
			code: string;
			message: string;
			transaction?: Transaction;
		}> = [];
		const warnings: Array<{
			code: string;
			message: string;
			transaction?: Transaction;
		}> = [];

		for (const tx of transactions) {
			// Validate required fields
			if (!tx.timestamp) {
				errors.push({
					code: "MISSING_DATE",
					message: "Transaction missing date",
					transaction: tx,
				});
			}

			const asset = getTransactionAsset(tx);
			if (!asset) {
				errors.push({
					code: "MISSING_ASSET",
					message: "Transaction missing asset/currency",
					transaction: tx,
				});
			}

			const baseAmount = getBaseAmount(tx);
			const quoteAmount = getQuoteAmount(tx);

			if (baseAmount === undefined || baseAmount === null) {
				errors.push({
					code: "MISSING_AMOUNT",
					message: "Transaction missing amount",
					transaction: tx,
				});
			}

			// Warnings
			if (!quoteAmount) {
				warnings.push({
					code: "MISSING_VALUE",
					message:
						"Transaction missing value - may affect cost basis calculation",
					transaction: tx,
				});
			}

			if (!tx.type) {
				warnings.push({
					code: "MISSING_TYPE",
					message:
						"Transaction missing type - classification may be inaccurate",
					transaction: tx,
				});
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Close tax service and cleanup resources
	 */
	async close(): Promise<void> {
		if (this.storage) {
			await closeAllStorage();
			this.storage = null;
		}
	}
}

/**
 * Create and initialize tax service
 *
 * @param config Service configuration
 * @returns Initialized tax service
 */
export async function createTaxService(
	config?: TaxServiceConfig,
): Promise<TaxService> {
	const service = new TaxService(config);
	await service.initialize();
	return service;
}

/**
 * Convenience function to generate tax report
 *
 * @param config Report configuration
 * @returns Tax report
 */
export async function generateTaxReport(
	config: TaxReportConfig,
): Promise<TaxReport> {
	const service = new TaxService();
	const report = await service.generateTaxReport(config);
	await service.close();
	return report;
}

/**
 * Convenience function to get optimization strategies
 *
 * @param transactions Transactions
 * @param jurisdictionCode Jurisdiction code
 * @param taxYear Tax year
 * @param riskTolerance Risk tolerance
 * @returns Optimization strategies
 */
export async function getTaxOptimizationStrategies(
	transactions: Transaction[],
	jurisdictionCode: "AU" = "AU",
	taxYear: number,
	riskTolerance: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE" = "MODERATE",
): Promise<TaxStrategy[]> {
	const service = new TaxService();
	const strategies = await service.getTaxOptimizationStrategies(
		transactions,
		jurisdictionCode,
		taxYear,
		riskTolerance,
	);
	await service.close();
	return strategies;
}
