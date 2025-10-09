/**
 * TaxJurisdiction Model
 *
 * Represents a tax authority with specific rules and requirements.
 * Currently supports Australian jurisdiction only.
 */

import type { TaxRule } from "./TaxRule";

export type CostBasisMethod = "FIFO" | "SPECIFIC_IDENTIFICATION";

export interface TaxJurisdiction {
  code: "AU";
  name: string;
  taxYear: {
    startMonth: number; // 7 for July
    startDay: number; // 1
    endMonth: number; // 6 for June
    endDay: number; // 30
  };
  currency: string;
  cgtDiscountRate: number; // 0.5 for 50%
  cgtHoldingPeriod: number; // 365 days
  personalUseThreshold: number; // 10000 AUD
  supportedMethods: CostBasisMethod[];
  rules: TaxRule[];
}

export class TaxJurisdictionModel implements TaxJurisdiction {
  public readonly code: "AU";
  public readonly name: string;
  public readonly taxYear: {
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
  };
  public readonly currency: string;
  public readonly cgtDiscountRate: number;
  public readonly cgtHoldingPeriod: number;
  public readonly personalUseThreshold: number;
  public readonly supportedMethods: CostBasisMethod[];
  public readonly rules: TaxRule[];

  constructor(data: TaxJurisdiction) {
    // Validate required fields
    this.validateInput(data);

    this.code = data.code;
    this.name = data.name;
    this.taxYear = { ...data.taxYear };
    this.currency = data.currency;
    this.cgtDiscountRate = data.cgtDiscountRate;
    this.cgtHoldingPeriod = data.cgtHoldingPeriod;
    this.personalUseThreshold = data.personalUseThreshold;
    this.supportedMethods = [...data.supportedMethods];
    this.rules = [...data.rules];
  }

  /**
   * Creates the Australian tax jurisdiction with default rules
   */
  public static createAustralian(rules: TaxRule[] = []): TaxJurisdictionModel {
    return new TaxJurisdictionModel({
      code: "AU",
      name: "Australia",
      taxYear: {
        startMonth: 7, // July
        startDay: 1,
        endMonth: 6, // June
        endDay: 30,
      },
      currency: "AUD",
      cgtDiscountRate: 0.5, // 50% CGT discount
      cgtHoldingPeriod: 365, // days
      personalUseThreshold: 10000, // AUD
      supportedMethods: ["FIFO", "SPECIFIC_IDENTIFICATION"],
      rules,
    });
  }

  /**
   * Validates the input data for tax jurisdiction
   */
  private validateInput(data: TaxJurisdiction): void {
    if (!data) {
      throw new Error("Tax jurisdiction data is required");
    }

    if (data.code !== "AU") {
      throw new Error(
        `Unsupported jurisdiction code: ${data.code}. Only 'AU' is currently supported.`,
      );
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Jurisdiction name is required");
    }

    if (!data.currency || data.currency.trim().length === 0) {
      throw new Error("Currency is required");
    }

    // Validate tax year structure
    this.validateTaxYear(data.taxYear);

    // Validate numeric values
    if (
      typeof data.cgtDiscountRate !== "number" ||
      data.cgtDiscountRate < 0 ||
      data.cgtDiscountRate > 1
    ) {
      throw new Error("CGT discount rate must be a number between 0 and 1");
    }

    if (
      typeof data.cgtHoldingPeriod !== "number" ||
      data.cgtHoldingPeriod < 0
    ) {
      throw new Error("CGT holding period must be a non-negative number");
    }

    if (
      typeof data.personalUseThreshold !== "number" ||
      data.personalUseThreshold < 0
    ) {
      throw new Error("Personal use threshold must be a non-negative number");
    }

    if (
      !Array.isArray(data.supportedMethods) ||
      data.supportedMethods.length === 0
    ) {
      throw new Error("At least one supported cost basis method is required");
    }

    if (!Array.isArray(data.rules)) {
      throw new Error("Rules must be an array");
    }
  }

  /**
   * Validates the tax year structure
   */
  private validateTaxYear(taxYear: TaxJurisdiction["taxYear"]): void {
    if (!taxYear) {
      throw new Error("Tax year configuration is required");
    }

    const { startMonth, startDay, endMonth, endDay } = taxYear;

    if (!this.isValidMonth(startMonth) || !this.isValidMonth(endMonth)) {
      throw new Error("Start and end months must be between 1 and 12");
    }

    if (
      !this.isValidDay(startDay, startMonth) ||
      !this.isValidDay(endDay, endMonth)
    ) {
      throw new Error("Invalid day for the specified month");
    }

    // For Australian tax year, start should be July (7) and end should be June (6)
    if (startMonth !== 7 || endMonth !== 6) {
      throw new Error(
        "Australian tax year must start in July (month 7) and end in June (month 6)",
      );
    }
  }

  /**
   * Validates if a month number is valid (1-12)
   */
  private isValidMonth(month: number): boolean {
    return Number.isInteger(month) && month >= 1 && month <= 12;
  }

  /**
   * Validates if a day is valid for a given month
   */
  private isValidDay(day: number, month: number): boolean {
    if (!Number.isInteger(day) || day < 1) {
      return false;
    }

    // Days in each month (non-leap year, leap year handled separately)
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (month === 2) {
      // February - allow up to 29 for leap years
      return day <= 29;
    }

    return day <= daysInMonth[month - 1];
  }

  /**
   * Checks if a cost basis method is supported by this jurisdiction
   */
  public supportsCostBasisMethod(method: CostBasisMethod): boolean {
    return this.supportedMethods.includes(method);
  }

  /**
   * Gets the tax year start date for a given year
   */
  public getTaxYearStartDate(year: number): Date {
    return new Date(
      year - 1,
      this.taxYear.startMonth - 1,
      this.taxYear.startDay,
    );
  }

  /**
   * Gets the tax year end date for a given year
   */
  public getTaxYearEndDate(year: number): Date {
    return new Date(year, this.taxYear.endMonth - 1, this.taxYear.endDay);
  }

  /**
   * Determines which tax year a given date falls into
   */
  public getTaxYearFromDate(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-based

    // If date is before tax year start (July), it belongs to previous tax year
    if (month < this.taxYear.startMonth) {
      return year;
    }

    // If date is after tax year start (July), it belongs to next tax year
    return year + 1;
  }

  /**
   * Checks if an amount qualifies as a personal use asset
   */
  public isPersonalUseAsset(amount: number): boolean {
    return amount < this.personalUseThreshold;
  }

  /**
   * Checks if a holding period qualifies for CGT discount
   */
  public qualifiesForCgtDiscount(holdingPeriod: number): boolean {
    return holdingPeriod >= this.cgtHoldingPeriod;
  }

  /**
   * Applies CGT discount to a capital gain if eligible
   */
  public applyCgtDiscount(capitalGain: number, holdingPeriod: number): number {
    if (!this.qualifiesForCgtDiscount(holdingPeriod)) {
      return capitalGain;
    }

    return capitalGain * (1 - this.cgtDiscountRate);
  }

  /**
   * Validates the jurisdiction data integrity
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.validateInput(this);
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Unknown validation error",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Converts the jurisdiction to a plain object
   */
  public toJSON(): TaxJurisdiction {
    return {
      code: this.code,
      name: this.name,
      taxYear: { ...this.taxYear },
      currency: this.currency,
      cgtDiscountRate: this.cgtDiscountRate,
      cgtHoldingPeriod: this.cgtHoldingPeriod,
      personalUseThreshold: this.personalUseThreshold,
      supportedMethods: [...this.supportedMethods],
      rules: [...this.rules],
    };
  }
}

export default TaxJurisdictionModel;
