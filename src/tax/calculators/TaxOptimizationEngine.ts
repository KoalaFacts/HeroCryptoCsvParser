/**
 * Tax Optimization Engine
 *
 * Analyzes transactions and generates tax optimization strategies.
 * Recommends legal strategies to minimize tax liability within Australian tax law.
 */

import type { TaxableTransaction } from "../models/TaxableTransaction";
import type { TaxJurisdiction } from "../models/TaxJurisdiction";
import type {
	ComplianceLevel,
	StrategyType,
	TaxStrategy,
} from "../models/TaxStrategy";
import { getTransactionTimestamp } from "../utils/transactionHelpers";

/**
 * Optimization analysis context
 */
export interface OptimizationContext {
	transactions: TaxableTransaction[];
	jurisdiction: TaxJurisdiction;
	taxYear: number;
	riskTolerance?: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
}

/**
 * Optimization opportunity
 */
interface OptimizationOpportunity {
	type: StrategyType;
	potentialSavings: number;
	transactions: TaxableTransaction[];
	details: string[];
}

/**
 * Tax optimization engine
 */
export class TaxOptimizationEngine {
	/**
	 * Generate optimization strategies for given transactions
	 *
	 * @param context Optimization context
	 * @returns Array of recommended strategies
	 */
	generateStrategies(context: OptimizationContext): TaxStrategy[] {
		const strategies: TaxStrategy[] = [];

		// Analyze for tax loss harvesting opportunities
		const lossHarvesting = this.analyzeTaxLossHarvesting(context);
		if (lossHarvesting) {
			strategies.push(lossHarvesting);
		}

		// Analyze for CGT discount optimization
		const cgtDiscountStrategy = this.analyzeCGTDiscountTiming(context);
		if (cgtDiscountStrategy) {
			strategies.push(cgtDiscountStrategy);
		}

		// Analyze for personal use classification
		const personalUseStrategy = this.analyzePersonalUseClassification(context);
		if (personalUseStrategy) {
			strategies.push(personalUseStrategy);
		}

		// Analyze disposal timing
		const disposalTimingStrategy = this.analyzeDisposalTiming(context);
		if (disposalTimingStrategy) {
			strategies.push(disposalTimingStrategy);
		}

		// Analyze lot selection optimization
		const lotSelectionStrategy = this.analyzeLotSelection(context);
		if (lotSelectionStrategy) {
			strategies.push(lotSelectionStrategy);
		}

		// Sort by potential savings (descending) and priority
		strategies.sort((a, b) => {
			if (a.potentialSavings !== b.potentialSavings) {
				return b.potentialSavings - a.potentialSavings;
			}
			return b.priority - a.priority;
		});

		// Filter by risk tolerance
		return this.filterByRiskTolerance(
			strategies,
			context.riskTolerance || "MODERATE",
		);
	}

	/**
	 * Analyze tax loss harvesting opportunities
	 */
	private analyzeTaxLossHarvesting(
		context: OptimizationContext,
	): TaxStrategy | null {
		const opportunities = this.findUnrealizedLosses(context.transactions);

		if (opportunities.length === 0) {
			return null;
		}

		const totalPotentialSavings = opportunities.reduce(
			(sum, opp) => sum + opp.potentialSavings,
			0,
		);

		return {
			type: "TAX_LOSS_HARVESTING",
			description:
				"Realize capital losses to offset capital gains and reduce tax liability",
			potentialSavings: totalPotentialSavings * 0.3, // Estimated at 30% tax rate
			implementation: [
				"Identify assets with unrealized losses",
				"Consider selling loss-making positions before tax year end",
				"Use losses to offset capital gains",
				"Carry forward unused losses to future years",
				"Avoid wash sale rules if reacquiring (not applicable in Australia)",
			],
			risks: [
				"Market timing risk - asset may recover",
				"Transaction fees reduce net benefit",
				"Loss of future upside potential",
			],
			compliance: "SAFE",
			priority: 5,
		};
	}

	/**
	 * Analyze CGT discount timing opportunities
	 */
	private analyzeCGTDiscountTiming(
		context: OptimizationContext,
	): TaxStrategy | null {
		const nearingDiscount = this.findAssetsNearingCGTDiscount(
			context.transactions,
			context.jurisdiction,
		);

		if (nearingDiscount.length === 0) {
			return null;
		}

		const potentialSavings = nearingDiscount.reduce((sum, tx) => {
			const gain = tx.capitalGain || 0;
			const discount = gain * context.jurisdiction.cgtDiscountRate;
			return sum + discount;
		}, 0);

		return {
			type: "CGT_DISCOUNT_TIMING",
			description:
				"Defer disposals until 12-month holding period for 50% CGT discount",
			potentialSavings: potentialSavings * 0.3, // Estimated at 30% tax rate
			implementation: [
				"Track assets approaching 12-month holding period",
				"Defer disposals until CGT discount eligible",
				"Hold winning positions for at least 365 days",
				"Plan disposal timing around tax year boundaries",
			],
			risks: [
				"Market risk during holding period",
				"Liquidity constraints",
				"Opportunity cost of capital",
			],
			compliance: "SAFE",
			priority: 5,
		};
	}

	/**
	 * Analyze personal use classification opportunities
	 */
	private analyzePersonalUseClassification(
		context: OptimizationContext,
	): TaxStrategy | null {
		const personalUseOpportunities = this.findPersonalUseOpportunities(
			context.transactions,
			context.jurisdiction,
		);

		if (personalUseOpportunities.length === 0) {
			return null;
		}

		const potentialSavings = personalUseOpportunities.reduce(
			(sum, tx) => sum + (tx.capitalGain || 0),
			0,
		);

		return {
			type: "PERSONAL_USE_CLASSIFICATION",
			description:
				"Classify eligible assets as personal use to utilize $10,000 exemption",
			potentialSavings: potentialSavings * 0.3,
			implementation: [
				"Document personal use intent at acquisition",
				"Ensure acquisition value under $10,000",
				"Keep records of personal use",
				"Separate personal and investment holdings",
			],
			risks: [
				"Documentation requirements",
				"ATO scrutiny on classification",
				"Must have genuine personal use intent",
			],
			compliance: "MODERATE",
			priority: 3,
		};
	}

	/**
	 * Analyze disposal timing strategies
	 */
	private analyzeDisposalTiming(
		context: OptimizationContext,
	): TaxStrategy | null {
		const deferralOpportunities = this.findDeferralOpportunities(
			context.transactions,
			context.taxYear,
		);

		if (deferralOpportunities.length === 0) {
			return null;
		}

		const potentialSavings = deferralOpportunities.reduce(
			(sum, tx) => sum + (tx.capitalGain || 0) * 0.1, // Time value of money
			0,
		);

		return {
			type: "DISPOSAL_TIMING",
			description:
				"Optimize disposal timing to defer or accelerate tax liability",
			potentialSavings,
			implementation: [
				"Defer disposals to next tax year if beneficial",
				"Accelerate losses into current year",
				"Consider income levels across tax years",
				"Plan around tax bracket thresholds",
			],
			risks: [
				"Market volatility risk",
				"Changes in tax law",
				"Liquidity needs may override timing strategy",
			],
			compliance: "SAFE",
			priority: 3,
		};
	}

	/**
	 * Analyze lot selection optimization
	 */
	private analyzeLotSelection(
		context: OptimizationContext,
	): TaxStrategy | null {
		const specificIdOpportunities =
			this.findSpecificIdentificationOpportunities(context.transactions);

		if (specificIdOpportunities.length === 0) {
			return null;
		}

		return {
			type: "LOT_SELECTION",
			description:
				"Use specific identification method to optimize cost basis selection",
			potentialSavings: 0, // Varies by situation
			implementation: [
				"Track acquisition lots separately",
				"Document specific lot selections",
				"Choose high-cost basis lots for disposals",
				"Consider holding periods for each lot",
			],
			risks: [
				"Complex record-keeping required",
				"Must track all lots accurately",
				"Documentation requirements for ATO",
			],
			compliance: "MODERATE",
			priority: 2,
		};
	}

	// Helper methods for finding opportunities

	private findUnrealizedLosses(
		_transactions: TaxableTransaction[],
	): OptimizationOpportunity[] {
		// Identify assets with current unrealized losses
		return [];
	}

	private findAssetsNearingCGTDiscount(
		transactions: TaxableTransaction[],
		jurisdiction: TaxJurisdiction,
	): TaxableTransaction[] {
		const threshold = jurisdiction.cgtHoldingPeriod;
		const thirtyDaysBeforeThreshold = threshold - 30;

		return transactions.filter((tx) => {
			const holdingPeriod = tx.costBasis?.holdingPeriod || 0;
			return (
				holdingPeriod >= thirtyDaysBeforeThreshold &&
				holdingPeriod < threshold &&
				(tx.capitalGain || 0) > 0
			);
		});
	}

	private findPersonalUseOpportunities(
		transactions: TaxableTransaction[],
		jurisdiction: TaxJurisdiction,
	): TaxableTransaction[] {
		return transactions.filter((tx) => {
			const costBasis = tx.costBasis?.totalCost || 0;
			return (
				costBasis < jurisdiction.personalUseThreshold &&
				!tx.taxTreatment.isPersonalUse &&
				(tx.capitalGain || 0) > 0
			);
		});
	}

	private findDeferralOpportunities(
		transactions: TaxableTransaction[],
		taxYear: number,
	): TaxableTransaction[] {
		// Find transactions near tax year end that could be deferred
		const taxYearEnd = new Date(taxYear, 5, 30); // June 30
		const thirtyDaysBefore = new Date(
			taxYearEnd.getTime() - 30 * 24 * 60 * 60 * 1000,
		);

		return transactions.filter((tx) => {
			const txDate = getTransactionTimestamp(tx.originalTransaction);
			return (
				txDate >= thirtyDaysBefore &&
				txDate <= taxYearEnd &&
				(tx.capitalGain || 0) > 0
			);
		});
	}

	private findSpecificIdentificationOpportunities(
		transactions: TaxableTransaction[],
	): TaxableTransaction[] {
		// Find transactions where specific identification could benefit
		return transactions.filter((tx) => {
			const lots = tx.costBasis?.lots || [];
			return lots.length > 1;
		});
	}

	private filterByRiskTolerance(
		strategies: TaxStrategy[],
		riskTolerance: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE",
	): TaxStrategy[] {
		const allowedComplianceMap: Record<string, ComplianceLevel[]> = {
			CONSERVATIVE: ["SAFE"],
			MODERATE: ["SAFE", "MODERATE"],
			AGGRESSIVE: ["SAFE", "MODERATE", "AGGRESSIVE"],
		};
		const allowedCompliance = allowedComplianceMap[riskTolerance] || ["SAFE"];

		return strategies.filter((s) => allowedCompliance.includes(s.compliance));
	}
}

/**
 * Create tax optimization engine instance
 */
export function createTaxOptimizationEngine(): TaxOptimizationEngine {
	return new TaxOptimizationEngine();
}

/**
 * Generate optimization strategies
 */
export function generateOptimizationStrategies(
	transactions: TaxableTransaction[],
	jurisdiction: TaxJurisdiction,
	taxYear: number,
	riskTolerance: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE" = "MODERATE",
): TaxStrategy[] {
	const engine = createTaxOptimizationEngine();
	return engine.generateStrategies({
		transactions,
		jurisdiction,
		taxYear,
		riskTolerance,
	});
}
