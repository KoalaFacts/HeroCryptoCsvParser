/**
 * TaxPeriod Model
 *
 * Represents a specific tax year or custom period.
 * Handles tax year calculations based on jurisdiction rules.
 */

export interface TaxPeriod {
	year: number; // e.g., 2024 represents 2023-2024 tax year for Australia
	startDate: Date;
	endDate: Date;
	label: string; // e.g., "2023-2024"
}

export class TaxPeriodModel implements TaxPeriod {
	public readonly year: number;
	public readonly startDate: Date;
	public readonly endDate: Date;
	public readonly label: string;

	constructor(data: TaxPeriod) {
		// Validate required fields
		this.validateInput(data);

		this.year = data.year;
		this.startDate = new Date(data.startDate);
		this.endDate = new Date(data.endDate);
		this.label = data.label;
	}

	/**
	 * Creates an Australian tax period for a given tax year
	 * Australian tax year runs from July 1 to June 30
	 */
	public static createAustralian(taxYear: number): TaxPeriodModel {
		// Australian tax year 2024 = July 1, 2023 to June 30, 2024
		const startDate = new Date(taxYear - 1, 6, 1); // July 1 (month 6 is July, 0-indexed)
		const endDate = new Date(taxYear, 5, 30); // June 30 (month 5 is June, 0-indexed)
		const label = `${taxYear - 1}-${taxYear}`;

		return new TaxPeriodModel({
			year: taxYear,
			startDate,
			endDate,
			label,
		});
	}

	/**
	 * Creates a custom tax period with specified dates
	 */
	public static createCustom(
		year: number,
		startDate: Date,
		endDate: Date,
		label?: string,
	): TaxPeriodModel {
		const customLabel = label || `${year}`;

		return new TaxPeriodModel({
			year,
			startDate,
			endDate,
			label: customLabel,
		});
	}

	/**
	 * Creates a calendar year tax period (January 1 to December 31)
	 */
	public static createCalendarYear(year: number): TaxPeriodModel {
		const startDate = new Date(year, 0, 1); // January 1
		const endDate = new Date(year, 11, 31); // December 31
		const label = `${year}`;

		return new TaxPeriodModel({
			year,
			startDate,
			endDate,
			label,
		});
	}

	/**
	 * Validates the input data for tax period
	 */
	private validateInput(data: TaxPeriod): void {
		if (!data) {
			throw new Error("Tax period data is required");
		}

		if (typeof data.year !== "number" || data.year < 1900 || data.year > 2100) {
			throw new Error("Year must be a reasonable number between 1900 and 2100");
		}

		if (
			!data.startDate ||
			!(data.startDate instanceof Date) ||
			Number.isNaN(data.startDate.getTime())
		) {
			throw new Error("Start date must be a valid Date object");
		}

		if (
			!data.endDate ||
			!(data.endDate instanceof Date) ||
			Number.isNaN(data.endDate.getTime())
		) {
			throw new Error("End date must be a valid Date object");
		}

		if (data.endDate <= data.startDate) {
			throw new Error("End date must be after start date");
		}

		if (!data.label || data.label.trim().length === 0) {
			throw new Error("Label is required");
		}

		// Check that the period is reasonable (not more than 2 years)
		const periodDays = this.calculateDaysBetween(data.startDate, data.endDate);
		if (periodDays > 731) {
			// Allow up to 2 years + 1 day for leap years
			throw new Error("Tax period cannot exceed 2 years");
		}
	}

	/**
	 * Calculates the number of days between two dates
	 */
	private calculateDaysBetween(startDate: Date, endDate: Date): number {
		const msPerDay = 24 * 60 * 60 * 1000;
		return Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
	}

	/**
	 * Checks if a given date falls within this tax period
	 */
	public containsDate(date: Date): boolean {
		return date >= this.startDate && date <= this.endDate;
	}

	/**
	 * Gets the number of days in this tax period
	 */
	public getDurationInDays(): number {
		return this.calculateDaysBetween(this.startDate, this.endDate);
	}

	/**
	 * Gets the number of months in this tax period
	 */
	public getDurationInMonths(): number {
		const startYear = this.startDate.getFullYear();
		const startMonth = this.startDate.getMonth();
		const endYear = this.endDate.getFullYear();
		const endMonth = this.endDate.getMonth();

		return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
	}

	/**
	 * Checks if this is a full tax year (approximately 365 days)
	 */
	public isFullTaxYear(): boolean {
		const days = this.getDurationInDays();
		return days >= 365 && days <= 366; // Account for leap years
	}

	/**
	 * Checks if this tax period is for the current year
	 */
	public isCurrentYear(): boolean {
		const now = new Date();
		return this.containsDate(now);
	}

	/**
	 * Checks if this tax period is complete (end date has passed)
	 */
	public isComplete(): boolean {
		const now = new Date();
		return now > this.endDate;
	}

	/**
	 * Checks if this tax period is in the future
	 */
	public isFuture(): boolean {
		const now = new Date();
		return now < this.startDate;
	}

	/**
	 * Gets the progress through this tax period as a percentage (0-100)
	 */
	public getProgressPercentage(): number {
		const now = new Date();

		if (now < this.startDate) {
			return 0;
		}

		if (now > this.endDate) {
			return 100;
		}

		const totalDuration = this.endDate.getTime() - this.startDate.getTime();
		const elapsed = now.getTime() - this.startDate.getTime();

		return Math.round((elapsed / totalDuration) * 100);
	}

	/**
	 * Gets the remaining days in this tax period
	 */
	public getRemainingDays(): number {
		const now = new Date();

		if (now > this.endDate) {
			return 0;
		}

		if (now < this.startDate) {
			return this.getDurationInDays();
		}

		return Math.ceil(
			(this.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
		);
	}

	/**
	 * Gets the elapsed days in this tax period
	 */
	public getElapsedDays(): number {
		const now = new Date();

		if (now < this.startDate) {
			return 0;
		}

		if (now > this.endDate) {
			return this.getDurationInDays();
		}

		return Math.floor(
			(now.getTime() - this.startDate.getTime()) / (24 * 60 * 60 * 1000),
		);
	}

	/**
	 * Gets the next tax period (same duration, consecutive dates)
	 */
	public getNext(): TaxPeriodModel {
		// For Australian tax years, next year starts immediately after current ends
		const nextStartDate = new Date(this.endDate);
		nextStartDate.setDate(nextStartDate.getDate() + 1);

		const nextEndDate = new Date(nextStartDate);
		nextEndDate.setFullYear(nextEndDate.getFullYear() + 1);
		nextEndDate.setDate(nextEndDate.getDate() - 1);

		const nextYear = this.year + 1;
		const nextLabel = this.label.includes("-")
			? `${this.year}-${nextYear}`
			: `${nextYear}`;

		return new TaxPeriodModel({
			year: nextYear,
			startDate: nextStartDate,
			endDate: nextEndDate,
			label: nextLabel,
		});
	}

	/**
	 * Gets the previous tax period
	 */
	public getPrevious(): TaxPeriodModel {
		// For Australian tax years, previous year ends immediately before current starts
		const prevEndDate = new Date(this.startDate);
		prevEndDate.setDate(prevEndDate.getDate() - 1);

		const prevStartDate = new Date(prevEndDate);
		prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
		prevStartDate.setDate(prevStartDate.getDate() + 1);

		const prevYear = this.year - 1;
		const prevLabel = this.label.includes("-")
			? `${prevYear - 1}-${prevYear}`
			: `${prevYear}`;

		return new TaxPeriodModel({
			year: prevYear,
			startDate: prevStartDate,
			endDate: prevEndDate,
			label: prevLabel,
		});
	}

	/**
	 * Gets all months in this tax period
	 */
	public getMonths(): Array<{
		year: number;
		month: number;
		name: string;
		startDate: Date;
		endDate: Date;
	}> {
		const months: Array<{
			year: number;
			month: number;
			name: string;
			startDate: Date;
			endDate: Date;
		}> = [];
		const monthNames = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];

		let currentDate = new Date(this.startDate);

		while (currentDate <= this.endDate) {
			const year = currentDate.getFullYear();
			const month = currentDate.getMonth();

			// Start of month (or period start if later)
			const monthStartDate = new Date(year, month, 1);
			const startDate =
				monthStartDate > this.startDate ? monthStartDate : this.startDate;

			// End of month (or period end if earlier)
			const monthEndDate = new Date(year, month + 1, 0);
			const endDate = monthEndDate < this.endDate ? monthEndDate : this.endDate;

			months.push({
				year,
				month: month + 1, // Convert to 1-based
				name: monthNames[month],
				startDate: new Date(startDate),
				endDate: new Date(endDate),
			});

			// Move to next month
			currentDate = new Date(year, month + 1, 1);
		}

		return months;
	}

	/**
	 * Formats the tax period as a string
	 */
	public toString(): string {
		return `${this.label} (${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()})`;
	}

	/**
	 * Compares this tax period with another
	 */
	public equals(other: TaxPeriod): boolean {
		return (
			this.year === other.year &&
			this.startDate.getTime() === other.startDate.getTime() &&
			this.endDate.getTime() === other.endDate.getTime() &&
			this.label === other.label
		);
	}

	/**
	 * Checks if this period overlaps with another period
	 */
	public overlaps(other: TaxPeriod): boolean {
		return this.startDate <= other.endDate && this.endDate >= other.startDate;
	}

	/**
	 * Validates the tax period data integrity
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

		// Check for reasonable period duration
		const days = this.getDurationInDays();
		if (days < 28) {
			warnings.push("Tax period is unusually short (less than 28 days)");
		}

		if (days > 400) {
			warnings.push("Tax period is unusually long (more than 400 days)");
		}

		// Check if dates align with year
		const startYear = this.startDate.getFullYear();
		const endYear = this.endDate.getFullYear();

		if (this.year < startYear || this.year > endYear + 1) {
			warnings.push(`Tax year ${this.year} does not align with period dates`);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Converts the tax period to a plain object
	 */
	public toJSON(): TaxPeriod {
		return {
			year: this.year,
			startDate: new Date(this.startDate),
			endDate: new Date(this.endDate),
			label: this.label,
		};
	}
}

export default TaxPeriodModel;
