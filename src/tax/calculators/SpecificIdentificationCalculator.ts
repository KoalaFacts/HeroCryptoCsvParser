/**
 * Specific Identification Cost Basis Calculator
 *
 * Allows users to specifically identify which acquisition lots to use for cost basis.
 * Provides flexibility for tax optimization strategies.
 */

import type { Transaction } from "../../types/transactions";
import type { AcquisitionLot, CostBasis } from "../models/CostBasis";
import {
	getAssetKey,
	getBaseAmount,
	getTransactionAsset,
	getTransactionFee,
	getTransactionTimestamp,
} from "../utils/transactionHelpers";

/**
 * Lot identification strategy
 */
export interface LotIdentifier {
	transactionId: string;
	amount: number;
}

/**
 * Specific Identification Calculator
 */
export class SpecificIdentificationCalculator {
	/**
	 * Calculate cost basis using specific lot identification
	 *
	 * @param disposal Disposal transaction
	 * @param lotIdentifiers Specific lots to use (in order of preference)
	 * @param availableAcquisitions All available acquisition transactions
	 * @returns Cost basis result
	 */
	calculateCostBasis(
		disposal: Transaction,
		lotIdentifiers: LotIdentifier[],
		availableAcquisitions: Transaction[],
	): CostBasis {
		const asset = getAssetKey(disposal);
		const disposalAmount = Math.abs(getBaseAmount(disposal));
		const disposalDate = getTransactionTimestamp(disposal);

		// Build map of acquisitions by ID
		const acquisitionMap = new Map<string, Transaction>();
		for (const acq of availableAcquisitions) {
			if (getAssetKey(acq) === asset) {
				acquisitionMap.set(acq.id, acq);
			}
		}

		const usedLots: AcquisitionLot[] = [];
		let totalCost = 0;
		let totalAmount = 0;
		let earliestDate: Date | null = null;

		// Process each identified lot
		for (const identifier of lotIdentifiers) {
			const acquisition = acquisitionMap.get(identifier.transactionId);

			if (!acquisition) {
				throw new Error(
					`Acquisition transaction not found: ${identifier.transactionId}`,
				);
			}

			const acqAmount = Math.abs(getBaseAmount(acquisition));
			const acqDate = getTransactionTimestamp(acquisition);
			const unitPrice = this.calculateUnitPrice(acquisition);

			// Validate amount doesn't exceed available
			if (identifier.amount > acqAmount) {
				throw new Error(
					`Specified amount (${identifier.amount}) exceeds acquisition amount (${acqAmount}) for transaction ${identifier.transactionId}`,
				);
			}

			const costForLot = identifier.amount * unitPrice;

			usedLots.push({
				date: acqDate,
				amount: identifier.amount,
				unitPrice,
				remainingAmount: acqAmount - identifier.amount,
			});

			totalCost += costForLot;
			totalAmount += identifier.amount;

			if (!earliestDate || acqDate < earliestDate) {
				earliestDate = acqDate;
			}
		}

		// Validate total amount matches disposal
		const difference = Math.abs(totalAmount - disposalAmount);
		if (difference > 0.000001) {
			// Allow for floating point precision
			throw new Error(
				`Specified lot amounts (${totalAmount}) do not match disposal amount (${disposalAmount}). Difference: ${difference}`,
			);
		}

		// Calculate fees
		const feeAmount = getTransactionFee(disposal);
		const totalFees = feeAmount > 0 ? Math.abs(feeAmount) : 0;

		// Calculate holding period from earliest lot
		const holdingPeriod = earliestDate
			? Math.floor(
					(disposalDate.getTime() - earliestDate.getTime()) /
						(1000 * 60 * 60 * 24),
				)
			: 0;

		return {
			method: "SPECIFIC_IDENTIFICATION",
			acquisitionDate: earliestDate || disposalDate,
			acquisitionPrice: totalCost,
			acquisitionFees: totalFees,
			totalCost: totalCost + totalFees,
			holdingPeriod,
			lots: usedLots,
		};
	}

	/**
	 * Find optimal lots for tax minimization
	 *
	 * @param disposal Disposal transaction
	 * @param availableAcquisitions Available acquisition transactions
	 * @param strategy 'minimize_gain' | 'maximize_loss' | 'maximize_cgt_discount'
	 * @returns Recommended lot identifiers
	 */
	findOptimalLots(
		disposal: Transaction,
		availableAcquisitions: Transaction[],
		strategy: "minimize_gain" | "maximize_loss" | "maximize_cgt_discount",
	): LotIdentifier[] {
		const asset = getAssetKey(disposal);
		const disposalAmount = Math.abs(getBaseAmount(disposal));
		const disposalDate = getTransactionTimestamp(disposal);

		// Filter and sort acquisitions based on strategy
		const eligibleLots = availableAcquisitions
			.filter((acq) => getAssetKey(acq) === asset)
			.map((acq) => ({
				transaction: acq,
				unitPrice: this.calculateUnitPrice(acq),
				date: getTransactionTimestamp(acq),
				amount: Math.abs(getBaseAmount(acq)),
				holdingPeriod: Math.floor(
					(disposalDate.getTime() - getTransactionTimestamp(acq).getTime()) /
						(1000 * 60 * 60 * 24),
				),
			}));

		// Sort based on strategy
		switch (strategy) {
			case "minimize_gain":
				// Use highest cost basis lots first
				eligibleLots.sort((a, b) => b.unitPrice - a.unitPrice);
				break;

			case "maximize_loss":
				// Use lowest cost basis lots first
				eligibleLots.sort((a, b) => a.unitPrice - b.unitPrice);
				break;

			case "maximize_cgt_discount":
				// Prioritize lots held > 12 months, then by highest cost
				eligibleLots.sort((a, b) => {
					const aDiscount = a.holdingPeriod >= 365 ? 1 : 0;
					const bDiscount = b.holdingPeriod >= 365 ? 1 : 0;

					if (aDiscount !== bDiscount) {
						return bDiscount - aDiscount;
					}

					return b.unitPrice - a.unitPrice;
				});
				break;
		}

		// Select lots to match disposal amount
		const identifiers: LotIdentifier[] = [];
		let remainingAmount = disposalAmount;

		for (const lot of eligibleLots) {
			if (remainingAmount <= 0.000001) {
				break;
			}

			const amountToUse = Math.min(remainingAmount, lot.amount);

			identifiers.push({
				transactionId: lot.transaction.id,
				amount: amountToUse,
			});

			remainingAmount -= amountToUse;
		}

		if (remainingAmount > 0.000001) {
			throw new Error(
				`Insufficient acquisition lots for disposal. Asset: ${asset}, Required: ${disposalAmount}, Available: ${disposalAmount - remainingAmount}`,
			);
		}

		return identifiers;
	}

	/**
	 * Calculate unit price from transaction
	 */
	private calculateUnitPrice(transaction: Transaction): number {
		const amount = Math.abs(getBaseAmount(transaction));

		if (amount === 0) {
			return 0;
		}

		// Use transaction value if available
		if (transaction.type === "SPOT_TRADE") {
			const quoteAmount = Math.abs(transaction.quoteAsset.amount.toNumber());
			return quoteAmount / amount;
		}

		// For other types, try to infer from transaction data
		return 0;
	}
}

/**
 * Create a Specific Identification calculator instance
 */
export function createSpecificIdentificationCalculator(): SpecificIdentificationCalculator {
	return new SpecificIdentificationCalculator();
}

/**
 * Calculate cost basis using specific lot identification
 */
export function calculateSpecificIdentificationCostBasis(
	disposal: Transaction,
	lotIdentifiers: LotIdentifier[],
	availableAcquisitions: Transaction[],
): CostBasis {
	const calculator = createSpecificIdentificationCalculator();
	return calculator.calculateCostBasis(
		disposal,
		lotIdentifiers,
		availableAcquisitions,
	);
}
