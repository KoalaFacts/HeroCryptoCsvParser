/**
 * TaxStrategy Model
 *
 * Optimization recommendations for reducing tax liability.
 * Represents legally compliant strategies for Australian tax law.
 */

export type StrategyType =
	| "TAX_LOSS_HARVESTING"
	| "CGT_DISCOUNT_TIMING"
	| "PERSONAL_USE_CLASSIFICATION"
	| "DISPOSAL_TIMING"
	| "LOT_SELECTION";

export type ComplianceLevel = "SAFE" | "MODERATE" | "AGGRESSIVE";

export interface TaxStrategy {
	type: StrategyType;
	description: string;
	potentialSavings: number;
	implementation: string[];
	risks: string[];
	compliance: ComplianceLevel;
	priority: number; // 1-5, where 1 is highest priority
}

export class TaxStrategyModel implements TaxStrategy {
	public readonly type: StrategyType;
	public readonly description: string;
	public readonly potentialSavings: number;
	public readonly implementation: string[];
	public readonly risks: string[];
	public readonly compliance: ComplianceLevel;
	public readonly priority: number;

	constructor(data: TaxStrategy) {
		// Validate required fields
		this.validateInput(data);

		this.type = data.type;
		this.description = data.description;
		this.potentialSavings = data.potentialSavings;
		this.implementation = [...data.implementation];
		this.risks = [...data.risks];
		this.compliance = data.compliance;
		this.priority = data.priority;
	}

	/**
	 * Creates a tax loss harvesting strategy
	 */
	public static createTaxLossHarvesting(
		potentialSavings: number,
		specificImplementation: string[] = [],
		specificRisks: string[] = [],
	): TaxStrategyModel {
		const defaultImplementation = [
			"Identify assets with unrealized losses",
			"Consider selling assets to realize capital losses",
			"Use losses to offset capital gains in the same tax year",
			"Consider timing of sales to maximize tax benefit",
			"Ensure compliance with Australian tax residency requirements",
		];

		const defaultRisks = [
			"Market timing risk - assets may recover after sale",
			"Opportunity cost of missing future gains",
			"Transaction costs and fees may reduce benefits",
			"Loss carry-forward restrictions if not used in current year",
		];

		return new TaxStrategyModel({
			type: "TAX_LOSS_HARVESTING",
			description:
				"Realize capital losses to offset capital gains and reduce overall tax liability",
			potentialSavings,
			implementation: [...defaultImplementation, ...specificImplementation],
			risks: [...defaultRisks, ...specificRisks],
			compliance: "SAFE",
			priority: 2,
		});
	}

	/**
	 * Creates a CGT discount timing strategy
	 */
	public static createCgtDiscountTiming(
		potentialSavings: number,
		specificImplementation: string[] = [],
		specificRisks: string[] = [],
	): TaxStrategyModel {
		const defaultImplementation = [
			"Hold assets for at least 12 months to qualify for 50% CGT discount",
			"Time disposals to occur after 12-month holding period",
			"Consider delaying sales by days/weeks to qualify for discount",
			"Review acquisition dates before making disposal decisions",
			"Apply CGT discount to eligible capital gains",
		];

		const defaultRisks = [
			"Market risk during extended holding period",
			"Delayed liquidity access",
			"Potential for asset values to decline while waiting",
			"Personal use asset threshold may override CGT discount",
		];

		return new TaxStrategyModel({
			type: "CGT_DISCOUNT_TIMING",
			description:
				"Time asset disposals to qualify for 50% CGT discount after 12-month holding period",
			potentialSavings,
			implementation: [...defaultImplementation, ...specificImplementation],
			risks: [...defaultRisks, ...specificRisks],
			compliance: "SAFE",
			priority: 1,
		});
	}

	/**
	 * Creates a personal use asset classification strategy
	 */
	public static createPersonalUseClassification(
		potentialSavings: number,
		specificImplementation: string[] = [],
		specificRisks: string[] = [],
	): TaxStrategyModel {
		const defaultImplementation = [
			"Identify assets purchased for personal use under $10,000 AUD",
			"Document personal use intention at time of acquisition",
			"Classify qualifying assets as exempt from CGT",
			"Maintain records of personal use vs investment purpose",
			"Apply exemption to disposals of personal use assets",
		];

		const defaultRisks = [
			"ATO scrutiny on personal use claims",
			"Need for clear documentation of personal use intention",
			"Limited to assets under $10,000 AUD threshold",
			"Cannot claim capital losses on personal use assets",
		];

		return new TaxStrategyModel({
			type: "PERSONAL_USE_CLASSIFICATION",
			description:
				"Classify eligible assets as personal use assets to exempt them from CGT",
			potentialSavings,
			implementation: [...defaultImplementation, ...specificImplementation],
			risks: [...defaultRisks, ...specificRisks],
			compliance: "MODERATE",
			priority: 3,
		});
	}

	/**
	 * Creates a disposal timing strategy
	 */
	public static createDisposalTiming(
		potentialSavings: number,
		specificImplementation: string[] = [],
		specificRisks: string[] = [],
	): TaxStrategyModel {
		const defaultImplementation = [
			"Time disposals to spread capital gains across multiple tax years",
			"Consider disposing in lower income years",
			"Align disposals with available capital losses",
			"Plan disposals around tax year boundaries (June 30)",
			"Consider impact on overall tax brackets",
		];

		const defaultRisks = [
			"Market volatility affecting optimal timing",
			"Complexity in tax planning across years",
			"Potential for tax law changes",
			"Opportunity cost of holding positions",
		];

		return new TaxStrategyModel({
			type: "DISPOSAL_TIMING",
			description:
				"Strategically time asset disposals to optimize tax outcomes across tax years",
			potentialSavings,
			implementation: [...defaultImplementation, ...specificImplementation],
			risks: [...defaultRisks, ...specificRisks],
			compliance: "SAFE",
			priority: 4,
		});
	}

	/**
	 * Creates a lot selection strategy
	 */
	public static createLotSelection(
		potentialSavings: number,
		specificImplementation: string[] = [],
		specificRisks: string[] = [],
	): TaxStrategyModel {
		const defaultImplementation = [
			"Use specific identification method instead of FIFO when beneficial",
			"Select higher cost basis lots to minimize capital gains",
			"Choose lots with longer holding periods for CGT discount",
			"Document specific lot selections for ATO compliance",
			"Maintain detailed records of lot purchases and sales",
		];

		const defaultRisks = [
			"Complex record-keeping requirements",
			"ATO scrutiny on lot selection methodology",
			"Must be able to specifically identify disposed lots",
			"Cannot change method retroactively",
		];

		return new TaxStrategyModel({
			type: "LOT_SELECTION",
			description:
				"Use specific identification to select optimal cost basis lots for disposal",
			potentialSavings,
			implementation: [...defaultImplementation, ...specificImplementation],
			risks: [...defaultRisks, ...specificRisks],
			compliance: "MODERATE",
			priority: 5,
		});
	}

	/**
	 * Validates the input data for tax strategy
	 */
	private validateInput(data: TaxStrategy): void {
		if (!data) {
			throw new Error("Tax strategy data is required");
		}

		const validTypes: StrategyType[] = [
			"TAX_LOSS_HARVESTING",
			"CGT_DISCOUNT_TIMING",
			"PERSONAL_USE_CLASSIFICATION",
			"DISPOSAL_TIMING",
			"LOT_SELECTION",
		];

		if (!data.type || !validTypes.includes(data.type)) {
			throw new Error(`Type must be one of: ${validTypes.join(", ")}`);
		}

		if (!data.description || data.description.trim().length === 0) {
			throw new Error("Description is required");
		}

		if (
			typeof data.potentialSavings !== "number" ||
			data.potentialSavings < 0
		) {
			throw new Error("Potential savings must be a non-negative number");
		}

		if (
			!Array.isArray(data.implementation) ||
			data.implementation.length === 0
		) {
			throw new Error("At least one implementation step is required");
		}

		if (!Array.isArray(data.risks) || data.risks.length === 0) {
			throw new Error("At least one risk must be identified");
		}

		const validComplianceLevels: ComplianceLevel[] = [
			"SAFE",
			"MODERATE",
			"AGGRESSIVE",
		];
		if (!data.compliance || !validComplianceLevels.includes(data.compliance)) {
			throw new Error(
				`Compliance level must be one of: ${validComplianceLevels.join(", ")}`,
			);
		}

		if (
			!Number.isInteger(data.priority) ||
			data.priority < 1 ||
			data.priority > 5
		) {
			throw new Error("Priority must be an integer between 1 and 5");
		}
	}

	/**
	 * Checks if this is a high-priority strategy
	 */
	public isHighPriority(): boolean {
		return this.priority <= 2;
	}

	/**
	 * Checks if this is a safe compliance strategy
	 */
	public isSafe(): boolean {
		return this.compliance === "SAFE";
	}

	/**
	 * Checks if this strategy is aggressive
	 */
	public isAggressive(): boolean {
		return this.compliance === "AGGRESSIVE";
	}

	/**
	 * Gets the strategy risk level as a number (1-3)
	 */
	public getRiskLevel(): number {
		switch (this.compliance) {
			case "SAFE":
				return 1;
			case "MODERATE":
				return 2;
			case "AGGRESSIVE":
				return 3;
			default:
				return 2;
		}
	}

	/**
	 * Gets the savings potential category
	 */
	public getSavingsPotential(): "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" {
		if (this.potentialSavings < 100) return "LOW";
		if (this.potentialSavings < 500) return "MEDIUM";
		if (this.potentialSavings < 2000) return "HIGH";
		return "VERY_HIGH";
	}

	/**
	 * Gets the implementation complexity level
	 */
	public getComplexityLevel(): "SIMPLE" | "MODERATE" | "COMPLEX" {
		if (this.implementation.length <= 3) return "SIMPLE";
		if (this.implementation.length <= 6) return "MODERATE";
		return "COMPLEX";
	}

	/**
	 * Gets the strategy type description
	 */
	public getTypeDescription(): string {
		switch (this.type) {
			case "TAX_LOSS_HARVESTING":
				return "Tax Loss Harvesting";
			case "CGT_DISCOUNT_TIMING":
				return "CGT Discount Timing";
			case "PERSONAL_USE_CLASSIFICATION":
				return "Personal Use Asset Classification";
			case "DISPOSAL_TIMING":
				return "Strategic Disposal Timing";
			case "LOT_SELECTION":
				return "Specific Lot Selection";
			default:
				return "Unknown Strategy";
		}
	}

	/**
	 * Gets a summary of the strategy effectiveness
	 */
	public getEffectivenessScore(): number {
		// Calculate effectiveness based on savings, complexity, and compliance
		let score = 0;

		// Savings contribution (0-40 points)
		const savingsScore = Math.min(this.potentialSavings / 50, 40);
		score += savingsScore;

		// Compliance bonus (safe strategies get bonus points)
		if (this.compliance === "SAFE") {
			score += 20;
		} else if (this.compliance === "MODERATE") {
			score += 10;
		}

		// Priority bonus (high priority gets bonus)
		if (this.priority <= 2) {
			score += 15;
		} else if (this.priority <= 3) {
			score += 10;
		}

		// Implementation complexity penalty
		if (this.implementation.length > 6) {
			score -= 10;
		}

		return Math.max(0, Math.min(100, Math.round(score)));
	}

	/**
	 * Checks if this strategy conflicts with another strategy
	 */
	public conflictsWith(other: TaxStrategy): boolean {
		// Strategies that might conflict with each other
		const conflicts: Record<StrategyType, StrategyType[]> = {
			TAX_LOSS_HARVESTING: ["CGT_DISCOUNT_TIMING"], // May conflict if timing is critical
			CGT_DISCOUNT_TIMING: ["TAX_LOSS_HARVESTING", "DISPOSAL_TIMING"],
			PERSONAL_USE_CLASSIFICATION: [], // Generally doesn't conflict
			DISPOSAL_TIMING: ["CGT_DISCOUNT_TIMING"],
			LOT_SELECTION: [], // Generally complementary
		};

		return conflicts[this.type]?.includes(other.type) || false;
	}

	/**
	 * Gets a formatted implementation checklist
	 */
	public getImplementationChecklist(): Array<{
		step: string;
		order: number;
		category: string;
	}> {
		return this.implementation.map((step, index) => ({
			step,
			order: index + 1,
			category: this.categorizeImplementationStep(step),
		}));
	}

	/**
	 * Categorizes an implementation step
	 */
	private categorizeImplementationStep(step: string): string {
		const lowerStep = step.toLowerCase();

		if (lowerStep.includes("document") || lowerStep.includes("record")) {
			return "Documentation";
		}
		if (lowerStep.includes("time") || lowerStep.includes("timing")) {
			return "Timing";
		}
		if (lowerStep.includes("identify") || lowerStep.includes("review")) {
			return "Analysis";
		}
		if (lowerStep.includes("consider") || lowerStep.includes("evaluate")) {
			return "Decision";
		}
		if (lowerStep.includes("apply") || lowerStep.includes("implement")) {
			return "Execution";
		}

		return "General";
	}

	/**
	 * Validates the tax strategy data integrity
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

		// Check for reasonable savings amounts
		if (this.potentialSavings > 50000) {
			warnings.push(
				"Potential savings are very high - ensure calculations are accurate",
			);
		}

		// Check implementation steps quality
		if (this.implementation.some((step) => step.length < 10)) {
			warnings.push(
				"Some implementation steps are very short - consider adding more detail",
			);
		}

		// Check risk assessment completeness
		if (this.risks.some((risk) => risk.length < 10)) {
			warnings.push(
				"Some risks are very short - consider more detailed risk assessment",
			);
		}

		// Check compliance vs risk consistency
		if (this.compliance === "SAFE" && this.risks.length > 5) {
			warnings.push(
				"Strategy marked as SAFE but has many risks - review compliance level",
			);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Converts the tax strategy to a plain object
	 */
	public toJSON(): TaxStrategy {
		return {
			type: this.type,
			description: this.description,
			potentialSavings: this.potentialSavings,
			implementation: [...this.implementation],
			risks: [...this.risks],
			compliance: this.compliance,
			priority: this.priority,
		};
	}
}

export default TaxStrategyModel;
