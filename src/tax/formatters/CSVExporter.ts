/**
 * CSV Exporter for Transaction Details
 *
 * Exports detailed transaction data to CSV format for analysis and record-keeping.
 */

import type { TaxableTransaction } from "../models/TaxableTransaction";
import type { TaxReport } from "../models/TaxReport";
import {
	getBaseAmount,
	getBaseCurrency,
	getQuoteAmount,
	getTransactionTimestamp,
} from "../utils/transactionHelpers";

/**
 * CSV export options
 */
export interface CSVExportOptions {
	includeHeaders?: boolean;
	delimiter?: string;
	dateFormat?: "ISO" | "AU"; // ISO8601 or DD/MM/YYYY
	includeOptimizationNotes?: boolean;
}

/**
 * CSV exporter
 */
export class CSVExporter {
	/**
	 * Export transactions to CSV
	 *
	 * @param report Tax report
	 * @param options Export options
	 * @returns CSV string
	 */
	exportToCSV(report: TaxReport, options: CSVExportOptions = {}): string {
		const {
			includeHeaders = true,
			delimiter = ",",
			dateFormat = "ISO",
			includeOptimizationNotes = false,
		} = options;

		const lines: string[] = [];

		// Add headers
		if (includeHeaders) {
			lines.push(this.generateHeaders(delimiter, includeOptimizationNotes));
		}

		// Add transaction rows
		for (const transaction of report.transactions) {
			lines.push(
				this.formatTransaction(
					transaction,
					delimiter,
					dateFormat,
					includeOptimizationNotes,
				),
			);
		}

		return lines.join("\n");
	}

	/**
	 * Export summary to CSV
	 *
	 * @param report Tax report
	 * @param options Export options
	 * @returns CSV string
	 */
	exportSummaryToCSV(
		report: TaxReport,
		options: CSVExportOptions = {},
	): string {
		const { delimiter: _delimiter = "," } = options;

		const lines: string[] = [];

		lines.push("Item,Amount");
		lines.push(`Total Capital Gains,${report.summary.totalCapitalGains}`);
		lines.push(`Total Capital Losses,${report.summary.totalCapitalLosses}`);
		lines.push(`Net Capital Gain,${report.summary.netCapitalGain}`);
		lines.push(`CGT Discount,${report.summary.cgtDiscount}`);
		lines.push(`Taxable Capital Gain,${report.summary.taxableCapitalGain}`);
		lines.push(`Ordinary Income,${report.summary.ordinaryIncome}`);
		lines.push(`Total Deductions,${report.summary.totalDeductions}`);
		lines.push(`Net Taxable Amount,${report.summary.netTaxableAmount}`);

		return lines.join("\n");
	}

	/**
	 * Generate CSV headers
	 */
	private generateHeaders(
		delimiter: string,
		includeOptimizationNotes: boolean,
	): string {
		const headers = [
			"Date",
			"Type",
			"Asset",
			"Amount",
			"Value",
			"Tax Event",
			"Classification",
			"Cost Basis",
			"Capital Gain",
			"Capital Loss",
			"Income Amount",
			"Deductible Amount",
			"Holding Period",
			"CGT Discount Applied",
			"Personal Use",
		];

		if (includeOptimizationNotes) {
			headers.push("Optimization Notes");
		}

		return headers.join(delimiter);
	}

	/**
	 * Format transaction as CSV row
	 */
	private formatTransaction(
		transaction: TaxableTransaction,
		delimiter: string,
		dateFormat: "ISO" | "AU",
		includeOptimizationNotes: boolean,
	): string {
		const tx = transaction.originalTransaction;
		const date = this.formatDate(getTransactionTimestamp(tx), dateFormat);

		const fields = [
			date,
			tx.type || "",
			getBaseCurrency(tx) || "",
			getBaseAmount(tx)?.toString() || "0",
			getQuoteAmount(tx)?.toString() || "0",
			transaction.taxTreatment.eventType,
			transaction.taxTreatment.classification,
			transaction.costBasis?.totalCost?.toString() || "0",
			transaction.capitalGain?.toString() || "0",
			transaction.capitalLoss?.toString() || "0",
			transaction.incomeAmount?.toString() || "0",
			transaction.deductibleAmount?.toString() || "0",
			transaction.costBasis?.holdingPeriod?.toString() || "0",
			transaction.taxTreatment.cgtDiscountApplied ? "Yes" : "No",
			transaction.taxTreatment.isPersonalUse ? "Yes" : "No",
		];

		if (includeOptimizationNotes) {
			fields.push(""); // Placeholder for optimization notes
		}

		// Escape fields containing delimiter or quotes
		const escapedFields = fields.map((field) =>
			this.escapeCSVField(field, delimiter),
		);

		return escapedFields.join(delimiter);
	}

	/**
	 * Format date based on format option
	 */
	private formatDate(date: Date, format: "ISO" | "AU"): string {
		if (format === "ISO") {
			return date.toISOString();
		}

		// Australian format: DD/MM/YYYY
		const day = date.getDate().toString().padStart(2, "0");
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const year = date.getFullYear();

		return `${day}/${month}/${year}`;
	}

	/**
	 * Escape CSV field if needed
	 */
	private escapeCSVField(field: string, delimiter: string): string {
		// If field contains delimiter, newline, or quotes, wrap in quotes and escape internal quotes
		if (
			field.includes(delimiter) ||
			field.includes("\n") ||
			field.includes('"')
		) {
			return `"${field.replace(/"/g, '""')}"`;
		}

		return field;
	}
}

/**
 * Export tax report transactions to CSV
 */
export function exportTransactionsToCSV(
	report: TaxReport,
	options?: CSVExportOptions,
): string {
	const exporter = new CSVExporter();
	return exporter.exportToCSV(report, options);
}

/**
 * Export tax report summary to CSV
 */
export function exportSummaryToCSV(
	report: TaxReport,
	options?: CSVExportOptions,
): string {
	const exporter = new CSVExporter();
	return exporter.exportSummaryToCSV(report, options);
}
