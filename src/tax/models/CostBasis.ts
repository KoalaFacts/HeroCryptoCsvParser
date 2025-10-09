/**
 * CostBasis Model
 *
 * Tracks the cost basis for capital gains calculations.
 * Supports FIFO and specific identification methods.
 */

export type CostBasisMethod = "FIFO" | "SPECIFIC_IDENTIFICATION";

export interface AcquisitionLot {
	date: Date;
	amount: number;
	unitPrice: number;
	remainingAmount: number;
}

export interface CostBasis {
	method: CostBasisMethod;
	acquisitionDate: Date;
	acquisitionPrice: number;
	acquisitionFees: number;
	totalCost: number;
	holdingPeriod: number; // days
	lots: AcquisitionLot[];
}

export class AcquisitionLotModel implements AcquisitionLot {
	public readonly date: Date;
	public readonly amount: number;
	public readonly unitPrice: number;
	public readonly remainingAmount: number;

	constructor(data: AcquisitionLot) {
		this.validateInput(data);

		this.date = new Date(data.date);
		this.amount = data.amount;
		this.unitPrice = data.unitPrice;
		this.remainingAmount = data.remainingAmount;
	}

	private validateInput(data: AcquisitionLot): void {
		if (!data) {
			throw new Error("Acquisition lot data is required");
		}

		if (
			!data.date ||
			!(data.date instanceof Date) ||
			isNaN(data.date.getTime())
		) {
			throw new Error("Date must be a valid Date object");
		}

		if (typeof data.amount !== "number" || data.amount <= 0) {
			throw new Error("Amount must be a positive number");
		}

		if (typeof data.unitPrice !== "number" || data.unitPrice < 0) {
			throw new Error("Unit price must be a non-negative number");
		}

		if (typeof data.remainingAmount !== "number" || data.remainingAmount < 0) {
			throw new Error("Remaining amount must be a non-negative number");
		}

		if (data.remainingAmount > data.amount) {
			throw new Error("Remaining amount cannot exceed original amount");
		}
	}

	/**
	 * Creates a new lot with a reduced remaining amount
	 */
	public withRemainingAmount(newRemainingAmount: number): AcquisitionLotModel {
		if (newRemainingAmount < 0 || newRemainingAmount > this.amount) {
			throw new Error(
				"New remaining amount must be between 0 and original amount",
			);
		}

		return new AcquisitionLotModel({
			date: this.date,
			amount: this.amount,
			unitPrice: this.unitPrice,
			remainingAmount: newRemainingAmount,
		});
	}

	/**
	 * Gets the amount that has been used from this lot
	 */
	public getUsedAmount(): number {
		return this.amount - this.remainingAmount;
	}

	/**
	 * Gets the total value of this lot at acquisition
	 */
	public getTotalValue(): number {
		return this.amount * this.unitPrice;
	}

	/**
	 * Gets the remaining value of this lot
	 */
	public getRemainingValue(): number {
		return this.remainingAmount * this.unitPrice;
	}

	/**
	 * Checks if this lot is fully consumed
	 */
	public isFullyUsed(): boolean {
		return this.remainingAmount === 0;
	}

	/**
	 * Checks if this lot is unused
	 */
	public isUnused(): boolean {
		return this.remainingAmount === this.amount;
	}

	public toJSON(): AcquisitionLot {
		return {
			date: new Date(this.date),
			amount: this.amount,
			unitPrice: this.unitPrice,
			remainingAmount: this.remainingAmount,
		};
	}
}

export class CostBasisModel implements CostBasis {
	public readonly method: CostBasisMethod;
	public readonly acquisitionDate: Date;
	public readonly acquisitionPrice: number;
	public readonly acquisitionFees: number;
	public readonly totalCost: number;
	public readonly holdingPeriod: number;
	public readonly lots: AcquisitionLot[];

	constructor(data: CostBasis) {
		// Validate required fields
		this.validateInput(data);

		this.method = data.method;
		this.acquisitionDate = new Date(data.acquisitionDate);
		this.acquisitionPrice = data.acquisitionPrice;
		this.acquisitionFees = data.acquisitionFees;
		this.totalCost = data.totalCost;
		this.holdingPeriod = data.holdingPeriod;
		this.lots = data.lots.map((lot) => new AcquisitionLotModel(lot));
	}

	/**
	 * Creates a cost basis using FIFO method
	 */
	public static createFIFO(
		disposalDate: Date,
		disposalAmount: number,
		availableLots: AcquisitionLot[],
	): CostBasisModel {
		if (availableLots.length === 0) {
			throw new Error("No acquisition lots available for FIFO calculation");
		}

		// Sort lots by date (FIFO = First In, First Out)
		const sortedLots = [...availableLots]
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.filter((lot) => lot.remainingAmount > 0);

		const selectedLots: AcquisitionLot[] = [];
		let remainingToDispose = disposalAmount;
		let totalCost = 0;
		const totalFees = 0;

		for (const lot of sortedLots) {
			if (remainingToDispose <= 0) break;

			const amountFromThisLot = Math.min(
				remainingToDispose,
				lot.remainingAmount,
			);
			const costFromThisLot = amountFromThisLot * lot.unitPrice;

			selectedLots.push({
				date: new Date(lot.date),
				amount: amountFromThisLot,
				unitPrice: lot.unitPrice,
				remainingAmount: amountFromThisLot, // For cost basis, this represents amount used
			});

			totalCost += costFromThisLot;
			remainingToDispose -= amountFromThisLot;
		}

		if (remainingToDispose > 0) {
			throw new Error(
				`Insufficient lots for disposal: need ${disposalAmount}, available ${disposalAmount - remainingToDispose}`,
			);
		}

		// Use the earliest acquisition date for holding period calculation
		const earliestDate = new Date(selectedLots[0].date);
		const holdingPeriod = CostBasisModel.calculateHoldingPeriod(
			earliestDate,
			disposalDate,
		);

		return new CostBasisModel({
			method: "FIFO",
			acquisitionDate: earliestDate,
			acquisitionPrice: totalCost,
			acquisitionFees: totalFees,
			totalCost: totalCost + totalFees,
			holdingPeriod,
			lots: selectedLots,
		});
	}

	/**
	 * Creates a cost basis using specific identification method
	 */
	public static createSpecificIdentification(
		disposalDate: Date,
		selectedLots: AcquisitionLot[],
	): CostBasisModel {
		if (selectedLots.length === 0) {
			throw new Error("No lots selected for specific identification");
		}

		let totalCost = 0;
		const totalFees = 0;

		const processedLots = selectedLots.map((lot) => {
			totalCost += lot.amount * lot.unitPrice;
			return {
				date: new Date(lot.date),
				amount: lot.amount,
				unitPrice: lot.unitPrice,
				remainingAmount: lot.amount, // For cost basis, this represents amount used
			};
		});

		// Use the earliest acquisition date for holding period calculation
		const earliestDate = selectedLots.reduce((earliest, lot) =>
			new Date(lot.date) < new Date(earliest.date) ? lot : earliest,
		).date;

		const holdingPeriod = CostBasisModel.calculateHoldingPeriod(
			new Date(earliestDate),
			disposalDate,
		);

		return new CostBasisModel({
			method: "SPECIFIC_IDENTIFICATION",
			acquisitionDate: new Date(earliestDate),
			acquisitionPrice: totalCost,
			acquisitionFees: totalFees,
			totalCost: totalCost + totalFees,
			holdingPeriod,
			lots: processedLots,
		});
	}

	/**
	 * Calculates holding period in days between two dates
	 */
	private static calculateHoldingPeriod(
		acquisitionDate: Date,
		disposalDate: Date,
	): number {
		const msPerDay = 24 * 60 * 60 * 1000;
		return Math.ceil(
			(disposalDate.getTime() - acquisitionDate.getTime()) / msPerDay,
		);
	}

	/**
	 * Validates the input data for cost basis
	 */
	private validateInput(data: CostBasis): void {
		if (!data) {
			throw new Error("Cost basis data is required");
		}

		if (
			!data.method ||
			!["FIFO", "SPECIFIC_IDENTIFICATION"].includes(data.method)
		) {
			throw new Error("Method must be either FIFO or SPECIFIC_IDENTIFICATION");
		}

		if (
			!data.acquisitionDate ||
			!(data.acquisitionDate instanceof Date) ||
			isNaN(data.acquisitionDate.getTime())
		) {
			throw new Error("Acquisition date must be a valid Date object");
		}

		if (
			typeof data.acquisitionPrice !== "number" ||
			data.acquisitionPrice < 0
		) {
			throw new Error("Acquisition price must be a non-negative number");
		}

		if (typeof data.acquisitionFees !== "number" || data.acquisitionFees < 0) {
			throw new Error("Acquisition fees must be a non-negative number");
		}

		if (typeof data.totalCost !== "number" || data.totalCost < 0) {
			throw new Error("Total cost must be a non-negative number");
		}

		if (typeof data.holdingPeriod !== "number" || data.holdingPeriod < 0) {
			throw new Error("Holding period must be a non-negative number");
		}

		if (!Array.isArray(data.lots) || data.lots.length === 0) {
			throw new Error("At least one acquisition lot is required");
		}

		// Validate that total cost equals acquisition price + fees
		const expectedTotalCost = data.acquisitionPrice + data.acquisitionFees;
		if (Math.abs(data.totalCost - expectedTotalCost) > 0.01) {
			// Allow for small floating point differences
			throw new Error(
				`Total cost (${data.totalCost}) should equal acquisition price (${data.acquisitionPrice}) + fees (${data.acquisitionFees})`,
			);
		}

		// Validate lots sum to acquisition price
		const lotsTotal = data.lots.reduce(
			(sum, lot) => sum + lot.amount * lot.unitPrice,
			0,
		);
		if (Math.abs(lotsTotal - data.acquisitionPrice) > 0.01) {
			throw new Error(
				`Lots total value (${lotsTotal}) should equal acquisition price (${data.acquisitionPrice})`,
			);
		}
	}

	/**
	 * Gets the total amount across all lots
	 */
	public getTotalAmount(): number {
		return this.lots.reduce((sum, lot) => sum + lot.amount, 0);
	}

	/**
	 * Gets the weighted average price across all lots
	 */
	public getAveragePrice(): number {
		const totalAmount = this.getTotalAmount();
		if (totalAmount === 0) return 0;

		return this.acquisitionPrice / totalAmount;
	}

	/**
	 * Checks if this cost basis qualifies for CGT discount (365+ days)
	 */
	public qualifiesForCgtDiscount(): boolean {
		return this.holdingPeriod >= 365;
	}

	/**
	 * Gets the cost basis per unit
	 */
	public getCostPerUnit(): number {
		const totalAmount = this.getTotalAmount();
		if (totalAmount === 0) return 0;

		return this.totalCost / totalAmount;
	}

	/**
	 * Gets lots sorted by acquisition date
	 */
	public getLotsByDate(): AcquisitionLot[] {
		return [...this.lots].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	}

	/**
	 * Gets the earliest acquisition date
	 */
	public getEarliestAcquisitionDate(): Date {
		if (this.lots.length === 0) {
			return this.acquisitionDate;
		}

		return this.lots.reduce((earliest, lot) =>
			new Date(lot.date) < new Date(earliest.date) ? lot : earliest,
		).date;
	}

	/**
	 * Gets the latest acquisition date
	 */
	public getLatestAcquisitionDate(): Date {
		if (this.lots.length === 0) {
			return this.acquisitionDate;
		}

		return this.lots.reduce((latest, lot) =>
			new Date(lot.date) > new Date(latest.date) ? lot : latest,
		).date;
	}

	/**
	 * Calculates capital gain/loss for a disposal
	 */
	public calculateCapitalGainLoss(
		disposalPrice: number,
		disposalFees: number = 0,
	): {
		capitalGain: number;
		capitalLoss: number;
		netGain: number;
		qualifiesForDiscount: boolean;
	} {
		const totalDisposalProceeds = disposalPrice - disposalFees;
		const netGain = totalDisposalProceeds - this.totalCost;

		return {
			capitalGain: netGain > 0 ? netGain : 0,
			capitalLoss: netGain < 0 ? Math.abs(netGain) : 0,
			netGain,
			qualifiesForDiscount: this.qualifiesForCgtDiscount(),
		};
	}

	/**
	 * Gets a summary of the cost basis
	 */
	public getSummary(): {
		method: CostBasisMethod;
		totalAmount: number;
		totalCost: number;
		averagePrice: number;
		holdingPeriod: number;
		qualifiesForCgtDiscount: boolean;
		numberOfLots: number;
		dateRange: { earliest: Date; latest: Date };
	} {
		return {
			method: this.method,
			totalAmount: this.getTotalAmount(),
			totalCost: this.totalCost,
			averagePrice: this.getAveragePrice(),
			holdingPeriod: this.holdingPeriod,
			qualifiesForCgtDiscount: this.qualifiesForCgtDiscount(),
			numberOfLots: this.lots.length,
			dateRange: {
				earliest: this.getEarliestAcquisitionDate(),
				latest: this.getLatestAcquisitionDate(),
			},
		};
	}

	/**
	 * Validates the cost basis data integrity
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

		// Check for reasonable holding periods
		if (this.holdingPeriod > 10000) {
			// ~27 years
			warnings.push("Holding period is unusually long (over 27 years)");
		}

		// Check lot consistency for FIFO
		if (this.method === "FIFO") {
			const sortedByDate = this.getLotsByDate();
			const originalOrder = this.lots;

			// Check if lots are in chronological order
			for (let i = 0; i < sortedByDate.length - 1; i++) {
				if (
					new Date(originalOrder[i].date) > new Date(originalOrder[i + 1].date)
				) {
					warnings.push("FIFO lots are not in chronological order");
					break;
				}
			}
		}

		// Check for zero-cost lots
		const zeroCostLots = this.lots.filter((lot) => lot.unitPrice === 0);
		if (zeroCostLots.length > 0) {
			warnings.push(`${zeroCostLots.length} lots have zero cost basis`);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Converts the cost basis to a plain object
	 */
	public toJSON(): CostBasis {
		return {
			method: this.method,
			acquisitionDate: new Date(this.acquisitionDate),
			acquisitionPrice: this.acquisitionPrice,
			acquisitionFees: this.acquisitionFees,
			totalCost: this.totalCost,
			holdingPeriod: this.holdingPeriod,
			lots: this.lots.map((lot) => ({
				date: new Date(lot.date),
				amount: lot.amount,
				unitPrice: lot.unitPrice,
				remainingAmount: lot.remainingAmount,
			})),
		};
	}
}

export default CostBasisModel;
