/**
 * Tax Report Validator
 *
 * Validates complete tax reports for accuracy and completeness.
 */

import type { TaxJurisdiction } from "../models/TaxJurisdiction";
import type { TaxReport } from "../models/TaxReport";
import type { ValidationIssue, ValidationResult } from "./TransactionValidator";

/**
 * Tax Report Validator
 */
export class TaxReportValidator {
	/**
	 * Validate a complete tax report
	 */
	validateReport(report: TaxReport): ValidationResult {
		const issues: ValidationIssue[] = [];

		// Validate required fields
		this.validateRequiredFields(report, issues);

		// Validate jurisdiction
		this.validateJurisdiction(report, issues);

		// Validate tax period
		this.validateTaxPeriod(report, issues);

		// Validate transactions
		this.validateTransactions(report, issues);

		// Validate summary calculations
		this.validateSummary(report, issues);

		// Validate metadata
		this.validateMetadata(report, issues);

		return this.buildResult(issues);
	}

	/**
	 * Validate report for ATO submission
	 */
	validateForATOSubmission(report: TaxReport): ValidationResult {
		const issues: ValidationIssue[] = [];

		// Base validation
		const baseResult = this.validateReport(report);
		issues.push(...baseResult.issues);

		// ATO-specific validations
		if (report.jurisdiction.code !== "AU") {
			issues.push({
				field: "jurisdiction",
				message: "Report must be for Australian jurisdiction",
				severity: "error",
				code: "INVALID_JURISDICTION_FOR_ATO",
			});
		}

		// Check required fields for ATO
		this.validateATORequirements(report, issues);

		return this.buildResult(issues);
	}

	// Private validation methods

	/**
	 * Validate required fields
	 */
	private validateRequiredFields(
		report: TaxReport,
		issues: ValidationIssue[],
	): void {
		if (!report.id) {
			issues.push({
				field: "id",
				message: "Report ID is required",
				severity: "error",
				code: "MISSING_REPORT_ID",
			});
		}

		if (!report.jurisdiction) {
			issues.push({
				field: "jurisdiction",
				message: "Jurisdiction is required",
				severity: "error",
				code: "MISSING_JURISDICTION",
			});
		}

		if (!report.taxPeriod) {
			issues.push({
				field: "taxPeriod",
				message: "Tax period is required",
				severity: "error",
				code: "MISSING_TAX_PERIOD",
			});
		}

		if (!report.generatedAt) {
			issues.push({
				field: "generatedAt",
				message: "Generation timestamp is required",
				severity: "error",
				code: "MISSING_GENERATED_AT",
			});
		}
	}

	/**
	 * Validate jurisdiction
	 */
	private validateJurisdiction(
		report: TaxReport,
		issues: ValidationIssue[],
	): void {
		if (!report.jurisdiction) return;

		const jurisdiction = report.jurisdiction;

		if (jurisdiction.code !== "AU") {
			issues.push({
				field: "jurisdiction.code",
				message: `Unsupported jurisdiction: ${jurisdiction.code}`,
				severity: "warning",
				code: "UNSUPPORTED_JURISDICTION",
				suggestion: "Only AU (Australia) is currently supported",
			});
		}

		// Validate tax year configuration
		if (!jurisdiction.taxYear) {
			issues.push({
				field: "jurisdiction.taxYear",
				message: "Tax year configuration is missing",
				severity: "error",
				code: "MISSING_TAX_YEAR_CONFIG",
			});
		}
	}

	/**
	 * Validate tax period
	 */
	private validateTaxPeriod(
		report: TaxReport,
		issues: ValidationIssue[],
	): void {
		if (!report.taxPeriod) return;

		const period = report.taxPeriod;

		if (!period.startDate || !period.endDate) {
			issues.push({
				field: "taxPeriod",
				message: "Tax period must have start and end dates",
				severity: "error",
				code: "INCOMPLETE_TAX_PERIOD",
			});
			return;
		}

		// Start date should be before end date
		if (period.startDate >= period.endDate) {
			issues.push({
				field: "taxPeriod",
				message: "Tax period start date must be before end date",
				severity: "error",
				code: "INVALID_TAX_PERIOD_RANGE",
			});
		}

		// Period should be reasonable (typically 12 months)
		const days = Math.floor(
			(period.endDate.getTime() - period.startDate.getTime()) /
				(1000 * 60 * 60 * 24),
		);

		if (days < 300 || days > 400) {
			issues.push({
				field: "taxPeriod",
				message: `Tax period duration (${days} days) is unusual`,
				severity: "warning",
				code: "UNUSUAL_TAX_PERIOD",
				suggestion: "Verify the tax period dates are correct",
			});
		}
	}

	/**
	 * Validate transactions
	 */
	private validateTransactions(
		report: TaxReport,
		issues: ValidationIssue[],
	): void {
		if (!report.transactions || report.transactions.length === 0) {
			issues.push({
				field: "transactions",
				message: "Report has no transactions",
				severity: "warning",
				code: "NO_TRANSACTIONS",
				suggestion: "Verify this is expected for the tax period",
			});
			return;
		}

		// Check transactions fall within tax period
		let outsidePeriod = 0;

		for (const tx of report.transactions) {
			const txDate = tx.originalTransaction.timestamp;

			if (
				txDate < report.taxPeriod.startDate ||
				txDate > report.taxPeriod.endDate
			) {
				outsidePeriod++;
			}
		}

		if (outsidePeriod > 0) {
			issues.push({
				field: "transactions",
				message: `${outsidePeriod} transaction(s) fall outside the tax period`,
				severity: "error",
				code: "TRANSACTIONS_OUTSIDE_PERIOD",
			});
		}
	}

	/**
	 * Validate summary calculations
	 */
	private validateSummary(report: TaxReport, issues: ValidationIssue[]): void {
		if (!report.summary) {
			issues.push({
				field: "summary",
				message: "Tax summary is missing",
				severity: "error",
				code: "MISSING_SUMMARY",
			});
			return;
		}

		const summary = report.summary;

		// Net capital gain should equal total gains minus total losses
		const expectedNetGain =
			summary.totalCapitalGains - summary.totalCapitalLosses;
		if (Math.abs(summary.netCapitalGain - expectedNetGain) > 0.01) {
			issues.push({
				field: "summary.netCapitalGain",
				message: "Net capital gain calculation is incorrect",
				severity: "error",
				code: "INVALID_NET_CAPITAL_GAIN",
			});
		}

		// Taxable capital gain should not exceed net capital gain
		if (summary.taxableCapitalGain > summary.netCapitalGain) {
			issues.push({
				field: "summary.taxableCapitalGain",
				message: "Taxable capital gain cannot exceed net capital gain",
				severity: "error",
				code: "INVALID_TAXABLE_GAIN",
			});
		}

		// CGT discount should not exceed total capital gains
		if (summary.cgtDiscount > summary.totalCapitalGains) {
			issues.push({
				field: "summary.cgtDiscount",
				message: "CGT discount cannot exceed total capital gains",
				severity: "error",
				code: "INVALID_CGT_DISCOUNT",
			});
		}

		// Check for negative values where inappropriate
		if (summary.totalDisposals < 0 || summary.totalAcquisitions < 0) {
			issues.push({
				field: "summary",
				message: "Transaction counts cannot be negative",
				severity: "error",
				code: "NEGATIVE_TRANSACTION_COUNT",
			});
		}

		if (summary.totalCapitalGains < 0 || summary.totalCapitalLosses < 0) {
			issues.push({
				field: "summary",
				message: "Capital gains and losses cannot be negative",
				severity: "error",
				code: "NEGATIVE_CAPITAL_AMOUNTS",
			});
		}
	}

	/**
	 * Validate metadata
	 */
	private validateMetadata(report: TaxReport, issues: ValidationIssue[]): void {
		if (!report.metadata) return;

		const metadata = report.metadata;

		// Total transactions should match actual count
		if (metadata.totalTransactions !== report.transactions.length) {
			issues.push({
				field: "metadata.totalTransactions",
				message:
					"Metadata transaction count does not match actual transactions",
				severity: "warning",
				code: "METADATA_MISMATCH",
			});
		}

		// Generation time should be reasonable (< 10 minutes for most reports)
		if (metadata.generationTime && metadata.generationTime > 600000) {
			issues.push({
				field: "metadata.generationTime",
				message: "Report generation took unusually long",
				severity: "info",
				code: "SLOW_GENERATION",
			});
		}
	}

	/**
	 * Validate ATO-specific requirements
	 */
	private validateATORequirements(
		report: TaxReport,
		issues: ValidationIssue[],
	): void {
		// Check for required summary breakdowns
		if (!report.summary.byAsset || report.summary.byAsset.size === 0) {
			issues.push({
				field: "summary.byAsset",
				message: "Asset breakdown is required for ATO submission",
				severity: "warning",
				code: "MISSING_ASSET_BREAKDOWN",
			});
		}

		// Verify tax year format for Australian financial year
		const year = report.taxPeriod.year;
		if (year < 2000 || year > 2100) {
			issues.push({
				field: "taxPeriod.year",
				message: "Tax year is outside reasonable range",
				severity: "error",
				code: "INVALID_TAX_YEAR",
			});
		}
	}

	/**
	 * Build validation result
	 */
	private buildResult(issues: ValidationIssue[]): ValidationResult {
		const errors = issues.filter((i) => i.severity === "error");
		const warnings = issues.filter((i) => i.severity === "warning");
		const info = issues.filter((i) => i.severity === "info");

		return {
			isValid: errors.length === 0,
			issues,
			errors,
			warnings,
			info,
		};
	}
}

/**
 * Create a tax report validator
 */
export function createTaxReportValidator(): TaxReportValidator {
	return new TaxReportValidator();
}

/**
 * Validate a tax report
 */
export function validateTaxReport(report: TaxReport): ValidationResult {
	const validator = createTaxReportValidator();
	return validator.validateReport(report);
}
