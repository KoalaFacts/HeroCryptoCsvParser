import { createMockSpotTrade } from "@tests/tax/helpers/mockFactories";
import { describe, expect, it } from "vitest";
import { FIFOCalculator } from "@/tax/calculators/FIFOCalculator";
import { TaxJurisdictionModel } from "@/tax/models/TaxJurisdiction";
import {
	appliesCGTDiscount,
	calculateCGTDiscount,
	calculatePersonalUseTaxableAmount,
	isPersonalUseAsset,
} from "@/tax/rules/AustralianTaxRules";
import {
	ATOFormatValidator,
	TaxReportValidator,
	TransactionValidator,
} from "@/tax/validators";

describe("Tax Module - All Unit Tests", () => {
	describe("FIFOCalculator", () => {
		it("should calculate cost basis using FIFO", () => {
			const calculator = new FIFOCalculator();
			const acq = createMockSpotTrade({
				id: "acq1",
				timestamp: new Date("2024-01-01"),
			});
			const disposal = createMockSpotTrade({
				id: "disp1",
				timestamp: new Date("2024-06-01"),
				side: "SELL",
			});

			calculator.addAcquisition(acq);
			const costBasis = calculator.calculateCostBasis(disposal, [acq]);

			expect(costBasis.method).toBe("FIFO");
			expect(costBasis.holdingPeriod).toBeGreaterThan(100);
		});
	});

	describe("CGT Discount Rules", () => {
		it("should apply 50% discount for >365 days", () => {
			const result = appliesCGTDiscount(366, true, false);
			expect(result).toBe(true);
		});

		it("should not apply discount for <365 days", () => {
			const result = appliesCGTDiscount(364, true, false);
			expect(result).toBe(false);
		});

		it("should calculate correct discount amount", () => {
			const discount = calculateCGTDiscount(10000, 366, true);
			expect(discount).toBe(5000);
		});
	});

	describe("Personal Use Asset Rules", () => {
		it("should classify as personal use when <$10k", () => {
			const result = isPersonalUseAsset(9999, "PERSONAL");
			expect(result).toBe(true);
		});

		it("should not classify as personal use when >=$10k", () => {
			const result = isPersonalUseAsset(10000, "PERSONAL");
			expect(result).toBe(false);
		});

		it("should return 0 taxable for exempt gains", () => {
			const taxable = calculatePersonalUseTaxableAmount(5000, 5000, "PERSONAL");
			expect(taxable).toBe(0);
		});
	});

	describe("Validators", () => {
		it("should validate transactions", () => {
			const validator = new TransactionValidator();
			const tx = createMockSpotTrade();
			const result = validator.validateTransaction(tx);

			expect(result.isValid).toBe(true);
		});

		it("should validate tax reports", () => {
			const validator = new TaxReportValidator();
			const jurisdiction = TaxJurisdictionModel.createAustralian();

			const report = {
				id: "report-1",
				jurisdiction,
				taxPeriod: {
					year: 2024,
					startDate: new Date("2023-07-01"),
					endDate: new Date("2024-06-30"),
					label: "2023-2024",
				},
				generatedAt: new Date(),
				transactions: [],
				summary: {
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
				},
				optimizationStrategies: [],
				metadata: {
					totalTransactions: 0,
					processedExchanges: [],
					reportVersion: "1.0.0",
					generationTime: 1000,
				},
			};

			const result = validator.validateReport(report);
			expect(result.isValid).toBe(true);
		});

		it("should validate ATO formats", () => {
			const validator = new ATOFormatValidator();
			const data = {
				totalCapitalGains: 10000,
				totalCapitalLosses: 3000,
				netCapitalGain: 7000,
				cgtDiscount: 3500,
			};

			const result = validator.validateCapitalGainsFormat(data);
			expect(result.isValid).toBe(true);
		});
	});

	describe("Integration", () => {
		it("should handle complete tax calculation workflow", () => {
			const calculator = new FIFOCalculator();

			// Add acquisitions
			for (let i = 0; i < 10; i++) {
				const acq = createMockSpotTrade({
					id: `acq-${i}`,
					timestamp: new Date(`2024-0${(i % 9) + 1}-01`),
				});
				calculator.addAcquisition(acq);
			}

			// Calculate disposal
			const disposal = createMockSpotTrade({
				id: "disposal-1",
				timestamp: new Date("2024-06-01"),
				side: "SELL",
			});

			const acquisitions = [];
			for (let i = 0; i < 10; i++) {
				acquisitions.push(
					createMockSpotTrade({
						id: `acq-${i}`,
						timestamp: new Date(`2024-0${(i % 9) + 1}-01`),
					}),
				);
			}

			const costBasis = calculator.calculateCostBasis(disposal, acquisitions);
			expect(costBasis).toBeDefined();
			expect(costBasis.method).toBe("FIFO");
		});
	});
});
