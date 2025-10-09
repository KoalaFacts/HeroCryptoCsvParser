/**
 * TaxRule Model
 *
 * Individual tax law or regulation that applies to specific transaction types.
 * Represents jurisdiction-specific rules for Australian tax law.
 */

export type RuleCategory =
  | "CAPITAL_GAINS"
  | "INCOME"
  | "DEDUCTIONS"
  | "EXEMPTIONS"
  | "REPORTING";

export interface TaxRule {
  id: string;
  jurisdiction: string;
  name: string;
  description: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  category: RuleCategory;
  applicableTransactionTypes: string[];
  calculationLogic: string; // Reference to implementation or formula
}

export class TaxRuleModel implements TaxRule {
  public readonly id: string;
  public readonly jurisdiction: string;
  public readonly name: string;
  public readonly description: string;
  public readonly effectiveFrom: Date;
  public readonly effectiveTo?: Date;
  public readonly category: RuleCategory;
  public readonly applicableTransactionTypes: string[];
  public readonly calculationLogic: string;

  constructor(data: TaxRule) {
    // Validate required fields
    this.validateInput(data);

    this.id = data.id;
    this.jurisdiction = data.jurisdiction;
    this.name = data.name;
    this.description = data.description;
    this.effectiveFrom = new Date(data.effectiveFrom);
    this.effectiveTo = data.effectiveTo
      ? new Date(data.effectiveTo)
      : undefined;
    this.category = data.category;
    this.applicableTransactionTypes = [...data.applicableTransactionTypes];
    this.calculationLogic = data.calculationLogic;
  }

  /**
   * Creates a CGT discount rule for Australian jurisdiction
   */
  public static createAustralianCgtDiscount(): TaxRuleModel {
    return new TaxRuleModel({
      id: "AU-CGT-DISCOUNT-001",
      jurisdiction: "AU",
      name: "Capital Gains Tax 50% Discount",
      description:
        "Individual taxpayers are entitled to a 50% discount on capital gains from assets held for more than 12 months",
      effectiveFrom: new Date("1999-09-21"), // When CGT discount was introduced
      category: "CAPITAL_GAINS",
      applicableTransactionTypes: [
        "SPOT_TRADE",
        "SWAP",
        "FUTURES_TRADE",
        "MARGIN_TRADE",
      ],
      calculationLogic:
        'If holdingPeriod >= 365 days and taxpayerType === "INDIVIDUAL" then apply 50% discount to capitalGain',
    });
  }

  /**
   * Creates a personal use asset exemption rule
   */
  public static createAustralianPersonalUseExemption(): TaxRuleModel {
    return new TaxRuleModel({
      id: "AU-PERSONAL-USE-001",
      jurisdiction: "AU",
      name: "Personal Use Asset Exemption",
      description:
        "Assets acquired for personal use with cost less than $10,000 are exempt from CGT",
      effectiveFrom: new Date("1985-09-20"), // CGT commencement date
      category: "EXEMPTIONS",
      applicableTransactionTypes: ["SPOT_TRADE", "SWAP", "TRANSFER"],
      calculationLogic:
        "If assetCost < 10000 AUD and acquiredForPersonalUse === true then exemptFromCGT = true",
    });
  }

  /**
   * Creates a staking rewards income rule
   */
  public static createAustralianStakingIncome(): TaxRuleModel {
    return new TaxRuleModel({
      id: "AU-STAKING-INCOME-001",
      jurisdiction: "AU",
      name: "Cryptocurrency Staking Rewards as Ordinary Income",
      description:
        "Staking rewards are treated as ordinary income at the time of receipt, valued at fair market value",
      effectiveFrom: new Date("2022-07-01"), // When ATO clarified crypto guidance
      category: "INCOME",
      applicableTransactionTypes: [
        "STAKING_REWARD",
        "STAKING_DEPOSIT",
        "STAKING_WITHDRAWAL",
      ],
      calculationLogic:
        'stakingReward.value = marketValueAtReceipt; classifyAs = "ORDINARY_INCOME"',
    });
  }

  /**
   * Creates an airdrop income rule
   */
  public static createAustralianAirdropIncome(): TaxRuleModel {
    return new TaxRuleModel({
      id: "AU-AIRDROP-INCOME-001",
      jurisdiction: "AU",
      name: "Cryptocurrency Airdrop Income Recognition",
      description:
        "Airdrop tokens are treated as ordinary income when received if they have determinable market value",
      effectiveFrom: new Date("2022-07-01"),
      category: "INCOME",
      applicableTransactionTypes: ["AIRDROP"],
      calculationLogic:
        'If airdrop.marketValue > 0 then classifyAs = "ORDINARY_INCOME"; costBase = marketValueAtReceipt',
    });
  }

  /**
   * Creates a DeFi yield income rule
   */
  public static createAustralianDeFiYieldIncome(): TaxRuleModel {
    return new TaxRuleModel({
      id: "AU-DEFI-YIELD-001",
      jurisdiction: "AU",
      name: "DeFi Yield as Ordinary Income",
      description:
        "Yield farming, liquidity mining, and lending rewards are treated as ordinary income when received",
      effectiveFrom: new Date("2022-07-01"),
      category: "INCOME",
      applicableTransactionTypes: [
        "LIQUIDITY_ADD",
        "LIQUIDITY_REMOVE",
        "LOAN",
        "INTEREST",
      ],
      calculationLogic:
        'If defiReward.type === "YIELD" then classifyAs = "ORDINARY_INCOME"; value = marketValueAtReceipt',
    });
  }

  /**
   * Creates a transaction fee deduction rule
   */
  public static createAustralianFeeDeduction(): TaxRuleModel {
    return new TaxRuleModel({
      id: "AU-FEE-DEDUCTION-001",
      jurisdiction: "AU",
      name: "Transaction Fee Deductions",
      description:
        "Transaction fees can be added to cost base for acquisitions or deducted from proceeds for disposals",
      effectiveFrom: new Date("1985-09-20"),
      category: "DEDUCTIONS",
      applicableTransactionTypes: ["FEE", "SPOT_TRADE", "SWAP", "TRANSFER"],
      calculationLogic:
        'If transactionType === "ACQUISITION" then costBase += fees; else disposalProceeds -= fees',
    });
  }

  /**
   * Creates a wash sale rule (noting it doesn't apply in Australia)
   */
  public static createAustralianWashSaleRule(): TaxRuleModel {
    return new TaxRuleModel({
      id: "AU-WASH-SALE-001",
      jurisdiction: "AU",
      name: "Wash Sale Rule (Not Applicable)",
      description:
        "Australia does not have wash sale rules - capital losses can be realized and assets can be immediately repurchased",
      effectiveFrom: new Date("1985-09-20"),
      category: "EXEMPTIONS",
      applicableTransactionTypes: ["SPOT_TRADE", "SWAP"],
      calculationLogic:
        "washSaleRestrictions = false; allowImmediateRepurchase = true",
    });
  }

  /**
   * Validates the input data for tax rule
   */
  private validateInput(data: TaxRule): void {
    if (!data) {
      throw new Error("Tax rule data is required");
    }

    if (!data.id || data.id.trim().length === 0) {
      throw new Error("Rule ID is required");
    }

    if (!data.jurisdiction || data.jurisdiction.trim().length === 0) {
      throw new Error("Jurisdiction is required");
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Rule name is required");
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new Error("Rule description is required");
    }

    if (
      !data.effectiveFrom ||
      !(data.effectiveFrom instanceof Date) ||
      Number.isNaN(data.effectiveFrom.getTime())
    ) {
      throw new Error("Effective from date must be a valid Date object");
    }

    if (data.effectiveTo) {
      if (
        !(data.effectiveTo instanceof Date) ||
        Number.isNaN(data.effectiveTo.getTime())
      ) {
        throw new Error(
          "Effective to date must be a valid Date object if provided",
        );
      }

      if (data.effectiveTo <= data.effectiveFrom) {
        throw new Error("Effective to date must be after effective from date");
      }
    }

    const validCategories: RuleCategory[] = [
      "CAPITAL_GAINS",
      "INCOME",
      "DEDUCTIONS",
      "EXEMPTIONS",
      "REPORTING",
    ];

    if (!data.category || !validCategories.includes(data.category)) {
      throw new Error(`Category must be one of: ${validCategories.join(", ")}`);
    }

    if (
      !Array.isArray(data.applicableTransactionTypes) ||
      data.applicableTransactionTypes.length === 0
    ) {
      throw new Error("At least one applicable transaction type is required");
    }

    if (!data.calculationLogic || data.calculationLogic.trim().length === 0) {
      throw new Error("Calculation logic is required");
    }
  }

  /**
   * Checks if this rule is currently active
   */
  public isActive(date: Date = new Date()): boolean {
    if (date < this.effectiveFrom) {
      return false;
    }

    if (this.effectiveTo && date > this.effectiveTo) {
      return false;
    }

    return true;
  }

  /**
   * Checks if this rule applies to a specific transaction type
   */
  public appliesTo(transactionType: string): boolean {
    return this.applicableTransactionTypes.includes(transactionType);
  }

  /**
   * Checks if this rule was active during a specific date range
   */
  public wasActiveDuring(startDate: Date, endDate: Date): boolean {
    // Rule is active during period if it overlaps with the period
    const ruleStart = this.effectiveFrom;
    const ruleEnd = this.effectiveTo || new Date("2100-01-01"); // Far future if no end date

    return ruleStart <= endDate && ruleEnd >= startDate;
  }

  /**
   * Gets the duration this rule has been/will be active
   */
  public getActiveDuration(): number {
    const endDate = this.effectiveTo || new Date();
    return Math.ceil(
      (endDate.getTime() - this.effectiveFrom.getTime()) /
        (24 * 60 * 60 * 1000),
    );
  }

  /**
   * Checks if this rule is jurisdiction-specific
   */
  public isJurisdictionSpecific(): boolean {
    return this.jurisdiction !== "GLOBAL";
  }

  /**
   * Gets the rule category description
   */
  public getCategoryDescription(): string {
    switch (this.category) {
      case "CAPITAL_GAINS":
        return "Capital Gains Tax Rules";
      case "INCOME":
        return "Income Tax Rules";
      case "DEDUCTIONS":
        return "Tax Deduction Rules";
      case "EXEMPTIONS":
        return "Tax Exemption Rules";
      case "REPORTING":
        return "Tax Reporting Requirements";
      default:
        return "Unknown Category";
    }
  }

  /**
   * Gets the transaction types this rule applies to as a formatted string
   */
  public getApplicableTypesString(): string {
    return this.applicableTransactionTypes.join(", ");
  }

  /**
   * Checks if this rule conflicts with another rule
   */
  public conflictsWith(other: TaxRule): boolean {
    // Rules conflict if they:
    // 1. Apply to same jurisdiction
    // 2. Have overlapping effective periods
    // 3. Apply to same transaction types
    // 4. Are in same category
    // 5. Have different calculation logic

    if (this.jurisdiction !== other.jurisdiction) {
      return false;
    }

    if (!this.hasOverlappingPeriod(other)) {
      return false;
    }

    if (!this.hasOverlappingTransactionTypes(other)) {
      return false;
    }

    if (this.category !== other.category) {
      return false;
    }

    // If all above match but calculation logic differs, there's a potential conflict
    return this.calculationLogic !== other.calculationLogic;
  }

  /**
   * Checks if this rule has overlapping effective period with another rule
   */
  private hasOverlappingPeriod(other: TaxRule): boolean {
    const thisStart = this.effectiveFrom;
    const thisEnd = this.effectiveTo || new Date("2100-01-01");
    const otherStart = new Date(other.effectiveFrom);
    const otherEnd = other.effectiveTo
      ? new Date(other.effectiveTo)
      : new Date("2100-01-01");

    return thisStart <= otherEnd && thisEnd >= otherStart;
  }

  /**
   * Checks if this rule has overlapping transaction types with another rule
   */
  private hasOverlappingTransactionTypes(other: TaxRule): boolean {
    return this.applicableTransactionTypes.some((type) =>
      other.applicableTransactionTypes.includes(type),
    );
  }

  /**
   * Gets a summary of the rule
   */
  public getSummary(): {
    id: string;
    jurisdiction: string;
    category: string;
    isActive: boolean;
    applicableTypes: string[];
    activeDays: number;
  } {
    return {
      id: this.id,
      jurisdiction: this.jurisdiction,
      category: this.getCategoryDescription(),
      isActive: this.isActive(),
      applicableTypes: this.applicableTransactionTypes,
      activeDays: this.getActiveDuration(),
    };
  }

  /**
   * Formats the effective period as a string
   */
  public getEffectivePeriodString(): string {
    const fromStr = this.effectiveFrom.toLocaleDateString();
    const toStr = this.effectiveTo
      ? this.effectiveTo.toLocaleDateString()
      : "present";
    return `${fromStr} to ${toStr}`;
  }

  /**
   * Validates the tax rule data integrity
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

    // Check for reasonable effective dates
    const currentYear = new Date().getFullYear();
    if (this.effectiveFrom.getFullYear() < 1900) {
      warnings.push("Effective from date is very old (before 1900)");
    }

    if (this.effectiveTo && this.effectiveTo.getFullYear() > currentYear + 10) {
      warnings.push("Effective to date is far in the future");
    }

    // Check calculation logic complexity
    if (this.calculationLogic.length < 20) {
      warnings.push(
        "Calculation logic is very short - consider adding more detail",
      );
    }

    // Check for standard rule ID format
    if (!this.id.includes("-")) {
      warnings.push(
        "Rule ID should follow format: JURISDICTION-CATEGORY-NUMBER",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Converts the tax rule to a plain object
   */
  public toJSON(): TaxRule {
    return {
      id: this.id,
      jurisdiction: this.jurisdiction,
      name: this.name,
      description: this.description,
      effectiveFrom: new Date(this.effectiveFrom),
      effectiveTo: this.effectiveTo ? new Date(this.effectiveTo) : undefined,
      category: this.category,
      applicableTransactionTypes: [...this.applicableTransactionTypes],
      calculationLogic: this.calculationLogic,
    };
  }
}

export default TaxRuleModel;
