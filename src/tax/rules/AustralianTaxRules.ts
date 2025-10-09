/**
 * Australian Tax Rules and Jurisdiction Configuration
 *
 * Implements Australian Taxation Office (ATO) rules for cryptocurrency taxation.
 * Includes CGT discount rules, personal use asset exemptions, and DeFi classification.
 */

import type { Transaction } from "../../types/transactions";
import type { TaxJurisdiction } from "../models/TaxJurisdiction";
import type { RuleCategory, TaxRule } from "../models/TaxRule";
import { getBaseAmount, getQuoteAmount } from "../utils/transactionHelpers";

/**
 * Australian tax jurisdiction configuration
 */
export const AUSTRALIAN_JURISDICTION: TaxJurisdiction = {
	code: "AU",
	name: "Australia",
	taxYear: {
		startMonth: 7, // July
		startDay: 1,
		endMonth: 6, // June
		endDay: 30,
	},
	currency: "AUD",
	cgtDiscountRate: 0.5, // 50% discount for assets held > 12 months
	cgtHoldingPeriod: 365, // days
	personalUseThreshold: 10000, // AUD
	supportedMethods: ["FIFO", "SPECIFIC_IDENTIFICATION"],
	rules: [], // Will be populated with rule instances
};

/**
 * CGT Discount Rules
 *
 * Australian Capital Gains Tax includes a 50% discount for individuals
 * who hold assets for more than 12 months.
 */
export class CGTDiscountRules {
	/**
	 * Check if CGT discount applies
	 *
	 * @param holdingPeriod Holding period in days
	 * @param isIndividual Is individual taxpayer (vs company)
	 * @param isPersonalUse Is personal use asset
	 * @returns True if CGT discount applies
	 */
	static appliesCGTDiscount(
		holdingPeriod: number,
		isIndividual: boolean = true,
		isPersonalUse: boolean = false,
	): boolean {
		// CGT discount only applies to individuals (not companies)
		if (!isIndividual) {
			return false;
		}

		// Personal use assets are exempt, not discounted
		if (isPersonalUse) {
			return false;
		}

		// Must hold for more than 12 months
		return holdingPeriod >= AUSTRALIAN_JURISDICTION.cgtHoldingPeriod;
	}

	/**
	 * Calculate CGT discount amount
	 *
	 * @param capitalGain Gross capital gain
	 * @param holdingPeriod Holding period in days
	 * @param isIndividual Is individual taxpayer
	 * @returns Discount amount
	 */
	static calculateDiscount(
		capitalGain: number,
		holdingPeriod: number,
		isIndividual: boolean = true,
	): number {
		if (
			!CGTDiscountRules.appliesCGTDiscount(holdingPeriod, isIndividual, false)
		) {
			return 0;
		}

		return capitalGain * AUSTRALIAN_JURISDICTION.cgtDiscountRate;
	}

	/**
	 * Calculate taxable capital gain after discount
	 *
	 * @param capitalGain Gross capital gain
	 * @param holdingPeriod Holding period in days
	 * @param isIndividual Is individual taxpayer
	 * @returns Taxable capital gain
	 */
	static calculateTaxableGain(
		capitalGain: number,
		holdingPeriod: number,
		isIndividual: boolean = true,
	): number {
		const discount = CGTDiscountRules.calculateDiscount(
			capitalGain,
			holdingPeriod,
			isIndividual,
		);
		return capitalGain - discount;
	}

	/**
	 * Get CGT discount tax rule
	 */
	static getRule(): TaxRule {
		return {
			id: "AU_CGT_DISCOUNT",
			jurisdiction: "AU",
			name: "CGT 50% Discount for Individuals",
			description:
				"Individuals who hold CGT assets for at least 12 months receive a 50% discount on capital gains",
			effectiveFrom: new Date("1999-09-21"), // Introduction date
			category: "CAPITAL_GAINS",
			applicableTransactionTypes: ["DISPOSAL"],
			calculationLogic: "CGTDiscountRules.calculateTaxableGain",
		};
	}
}

/**
 * Personal Use Asset Rules
 *
 * Personal use assets acquired for less than $10,000 are exempt from CGT.
 */
export class PersonalUseAssetRules {
	/**
	 * Check if asset qualifies as personal use
	 *
	 * @param acquisitionCost Cost at acquisition
	 * @param intendedUse Intended use of asset
	 * @returns True if qualifies as personal use
	 */
	static isPersonalUseAsset(
		acquisitionCost: number,
		intendedUse: "PERSONAL" | "INVESTMENT" = "INVESTMENT",
	): boolean {
		// Must be acquired for personal use
		if (intendedUse !== "PERSONAL") {
			return false;
		}

		// Must cost less than $10,000
		return acquisitionCost < AUSTRALIAN_JURISDICTION.personalUseThreshold;
	}

	/**
	 * Check if personal use exemption applies
	 *
	 * @param acquisitionCost Cost at acquisition
	 * @param intendedUse Intended use
	 * @param hasCapitalGain Has capital gain (not loss)
	 * @returns True if exemption applies
	 */
	static appliesExemption(
		acquisitionCost: number,
		intendedUse: "PERSONAL" | "INVESTMENT",
		hasCapitalGain: boolean,
	): boolean {
		// Exemption only applies to capital gains, not losses
		if (!hasCapitalGain) {
			return false;
		}

		return PersonalUseAssetRules.isPersonalUseAsset(
			acquisitionCost,
			intendedUse,
		);
	}

	/**
	 * Calculate taxable amount after personal use exemption
	 *
	 * @param capitalGain Capital gain amount
	 * @param acquisitionCost Acquisition cost
	 * @param intendedUse Intended use
	 * @returns Taxable amount (0 if exempt)
	 */
	static calculateTaxableAmount(
		capitalGain: number,
		acquisitionCost: number,
		intendedUse: "PERSONAL" | "INVESTMENT",
	): number {
		if (
			PersonalUseAssetRules.appliesExemption(
				acquisitionCost,
				intendedUse,
				capitalGain > 0,
			)
		) {
			return 0;
		}

		return capitalGain;
	}

	/**
	 * Validate personal use documentation requirements
	 *
	 * @param transaction Transaction to validate
	 * @returns Validation result
	 */
	static validateDocumentation(transaction: Transaction): {
		isValid: boolean;
		missingItems: string[];
	} {
		const missingItems: string[] = [];

		// Check for acquisition value
		const quoteAmount = getQuoteAmount(transaction);
		if (!quoteAmount || quoteAmount === 0) {
			missingItems.push("Acquisition value documentation");
		}

		// Note: Personal use intent documentation should be tracked separately
		// in the transaction metadata or tax events

		return {
			isValid: missingItems.length === 0,
			missingItems,
		};
	}

	/**
	 * Get personal use asset tax rule
	 */
	static getRule(): TaxRule {
		return {
			id: "AU_PERSONAL_USE_EXEMPTION",
			jurisdiction: "AU",
			name: "Personal Use Asset Exemption",
			description:
				"CGT exemption for personal use assets acquired for less than $10,000 AUD",
			effectiveFrom: new Date("1985-09-20"), // CGT introduction
			category: "EXEMPTIONS",
			applicableTransactionTypes: ["DISPOSAL"],
			calculationLogic: "PersonalUseAssetRules.calculateTaxableAmount",
		};
	}
}

/**
 * DeFi Classification Rules
 *
 * Rules for classifying DeFi transactions under Australian tax law.
 */
export class DeFiClassificationRules {
	/**
	 * Classify DeFi transaction type
	 *
	 * @param transaction Transaction to classify
	 * @returns Classification
	 */
	static classifyDeFiTransaction(transaction: Transaction): {
		type: string;
		taxTreatment: "INCOME" | "CAPITAL" | "MIXED";
		reasoning: string;
	} {
		const type = transaction.type?.toLowerCase() || "";

		// Staking rewards - Ordinary income
		if (type.includes("staking")) {
			return {
				type: "Staking Reward",
				taxTreatment: "INCOME",
				reasoning:
					"Staking rewards are treated as ordinary income at time of receipt",
			};
		}

		// Liquidity pool operations
		if (type.includes("liquidity")) {
			return {
				type: "Liquidity Pool Operation",
				taxTreatment: "CAPITAL",
				reasoning:
					"Adding/removing liquidity is disposal and acquisition of assets",
			};
		}

		// Yield farming/Interest - Ordinary income
		if (type.includes("interest")) {
			return {
				type: "Lending Interest",
				taxTreatment: "INCOME",
				reasoning: "Interest earned from lending is ordinary income",
			};
		}

		// Airdrops - Ordinary income
		if (type.includes("airdrop")) {
			return {
				type: "Airdrop",
				taxTreatment: "INCOME",
				reasoning: "Airdrops are ordinary income at market value when received",
			};
		}

		// Token swaps - Capital transaction
		if (type.includes("swap")) {
			return {
				type: "Token Swap",
				taxTreatment: "CAPITAL",
				reasoning: "Swapping tokens is disposal and acquisition (CGT event)",
			};
		}

		// Default - requires manual review
		return {
			type: "Unknown DeFi Transaction",
			taxTreatment: "MIXED",
			reasoning: "Transaction requires manual classification",
		};
	}

	/**
	 * Determine if DeFi transaction creates taxable event
	 *
	 * @param transaction Transaction to evaluate
	 * @returns True if taxable
	 */
	static isTaxableEvent(transaction: Transaction): boolean {
		const classification =
			DeFiClassificationRules.classifyDeFiTransaction(transaction);

		// All income and capital events are taxable
		return classification.taxTreatment !== "MIXED";
	}

	/**
	 * Calculate income amount for DeFi reward
	 *
	 * @param transaction Reward transaction
	 * @param marketPrice Market price at time of receipt
	 * @returns Income amount in AUD
	 */
	static calculateIncomeAmount(
		transaction: Transaction,
		marketPrice: number,
	): number {
		const amount = Math.abs(getBaseAmount(transaction));
		return amount * marketPrice;
	}

	/**
	 * Get DeFi classification tax rule
	 */
	static getRule(): TaxRule {
		return {
			id: "AU_DEFI_CLASSIFICATION",
			jurisdiction: "AU",
			name: "DeFi Transaction Classification",
			description:
				"Classification rules for DeFi transactions including staking, yield farming, and liquidity provision",
			effectiveFrom: new Date("2021-01-01"), // ATO guidance on DeFi
			category: "REPORTING",
			applicableTransactionTypes: [
				"STAKING",
				"YIELD",
				"LIQUIDITY",
				"SWAP",
				"AIRDROP",
			],
			calculationLogic: "DeFiClassificationRules.classifyDeFiTransaction",
		};
	}
}

/**
 * Get all Australian tax rules
 */
export function getAustralianTaxRules(): TaxRule[] {
	return [
		CGTDiscountRules.getRule(),
		PersonalUseAssetRules.getRule(),
		DeFiClassificationRules.getRule(),
	];
}

/**
 * Get Australian jurisdiction with all rules
 */
export function getAustralianJurisdiction(): TaxJurisdiction {
	return {
		...AUSTRALIAN_JURISDICTION,
		rules: getAustralianTaxRules(),
	};
}

/**
 * Calculate tax year boundaries for Australian tax year
 *
 * @param year Tax year (e.g., 2024 represents July 2023 - June 2024)
 * @returns Start and end dates
 */
export function getAustralianTaxYearBoundaries(year: number): {
	startDate: Date;
	endDate: Date;
	label: string;
} {
	const startDate = new Date(year - 1, 6, 1); // July 1 of previous year
	const endDate = new Date(year, 5, 30, 23, 59, 59); // June 30 of current year

	return {
		startDate,
		endDate,
		label: `${year - 1}-${year}`,
	};
}
