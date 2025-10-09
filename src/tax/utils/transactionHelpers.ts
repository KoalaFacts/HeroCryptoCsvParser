/**
 * Transaction Helper Utilities
 *
 * Provides safe accessors for transaction properties across different transaction types
 */

import type { Transaction } from "../../types/transactions";
import {
	isAirdrop,
	isFee,
	isFuturesTrade,
	isInterest,
	isLiquidityAdd,
	isLiquidityRemove,
	isLoan,
	isMarginTrade,
	isSpotTrade,
	isStakingDeposit,
	isStakingReward,
	isStakingWithdrawal,
	isSwap,
	isTransfer,
} from "../../types/transactions/TransactionTypeGuards";

/**
 * Get the primary asset involved in a transaction
 */
export function getTransactionAsset(tx: Transaction): string | undefined {
	if (isSpotTrade(tx)) {
		return tx.baseAsset.asset.symbol;
	}
	if (isSwap(tx)) {
		return tx.from.asset.symbol;
	}
	if (isTransfer(tx)) {
		return tx.asset.asset.symbol;
	}
	if (isFee(tx)) {
		return tx.fee.asset.symbol;
	}
	if (isMarginTrade(tx)) {
		return tx.baseAsset.asset.symbol;
	}
	if (isFuturesTrade(tx)) {
		return tx.contract.symbol;
	}
	if (isStakingDeposit(tx) || isStakingWithdrawal(tx)) {
		return tx.asset.asset.symbol;
	}
	if (isStakingReward(tx)) {
		return tx.reward.asset.symbol;
	}
	if (isLiquidityAdd(tx)) {
		return tx.assets[0]?.asset.symbol;
	}
	if (isLiquidityRemove(tx)) {
		return tx.assets[0]?.asset.symbol;
	}
	if (isAirdrop(tx)) {
		return tx.received.asset.symbol;
	}
	if (isLoan(tx)) {
		return tx.asset.asset.symbol;
	}
	if (isInterest(tx)) {
		return tx.interest.asset.symbol;
	}
	return undefined;
}

/**
 * Get the timestamp of a transaction
 */
export function getTransactionTimestamp(tx: Transaction): Date {
	return tx.timestamp;
}

/**
 * Get the data source of a transaction
 */
export function getTransactionSource(tx: Transaction): string {
	return tx.source.name;
}

/**
 * Get the disposal value from a transaction (for capital gains calculations)
 */
export function getDisposalValue(tx: Transaction): number {
	if (isSpotTrade(tx)) {
		// For spot trades, use quote asset amount as proceeds
		const proceeds = tx.quoteAsset.amount.toNumber();
		const fee = tx.fee ? tx.fee.amount.toNumber() : 0;
		return proceeds - fee;
	}
	if (isSwap(tx)) {
		// For swaps, use the "to" asset value
		return tx.to.amount.toNumber();
	}
	if (isMarginTrade(tx)) {
		const proceeds = tx.quoteAsset.amount.toNumber();
		const fee = tx.fee ? tx.fee.amount.toNumber() : 0;
		return proceeds - fee;
	}
	return 0;
}

/**
 * Get the acquisition value from a transaction
 */
export function getAcquisitionValue(tx: Transaction): number {
	if (isSpotTrade(tx)) {
		// For spot trades, use base asset amount
		return tx.baseAsset.amount.toNumber();
	}
	if (isSwap(tx)) {
		// For swaps, use the "from" asset value
		return tx.from.amount.toNumber();
	}
	if (isTransfer(tx)) {
		return tx.asset.amount.toNumber();
	}
	if (isMarginTrade(tx)) {
		return tx.baseAsset.amount.toNumber();
	}
	if (isStakingDeposit(tx)) {
		return tx.asset.amount.toNumber();
	}
	if (isAirdrop(tx)) {
		return tx.received.amount.toNumber();
	}
	if (isLoan(tx)) {
		return tx.asset.amount.toNumber();
	}
	return 0;
}

/**
 * Get the fee amount from a transaction
 */
export function getTransactionFee(tx: Transaction): number {
	if (
		isSpotTrade(tx) ||
		isSwap(tx) ||
		isMarginTrade(tx) ||
		isFuturesTrade(tx)
	) {
		return tx.fee ? tx.fee.amount.toNumber() : 0;
	}
	if (isTransfer(tx)) {
		return tx.networkFee ? tx.networkFee.amount.toNumber() : 0;
	}
	if (isFee(tx)) {
		return tx.fee.amount.toNumber();
	}
	return 0;
}

/**
 * Check if transaction is a disposal event for tax purposes
 */
export function isDisposalEvent(tx: Transaction): boolean {
	// Disposal events are when you give up ownership of an asset
	if (isSpotTrade(tx)) {
		return tx.side === "SELL";
	}
	if (isSwap(tx)) {
		return true; // Swapping is a disposal of the from asset
	}
	if (isTransfer(tx)) {
		return tx.direction === "OUT"; // Sending assets out
	}
	if (isMarginTrade(tx)) {
		return tx.side === "SELL";
	}
	if (isStakingWithdrawal(tx)) {
		return true; // Withdrawing from staking
	}
	if (isLiquidityRemove(tx)) {
		return true; // Removing liquidity
	}
	return false;
}

/**
 * Check if transaction is an acquisition event for tax purposes
 */
export function isAcquisitionEvent(tx: Transaction): boolean {
	// Acquisition events are when you receive ownership of an asset
	if (isSpotTrade(tx)) {
		return tx.side === "BUY";
	}
	if (isSwap(tx)) {
		return true; // Swapping results in receiving the to asset
	}
	if (isTransfer(tx)) {
		return tx.direction === "IN"; // Receiving assets
	}
	if (isMarginTrade(tx)) {
		return tx.side === "BUY";
	}
	if (isStakingDeposit(tx)) {
		return true; // Depositing to staking
	}
	if (isLiquidityAdd(tx)) {
		return true; // Adding liquidity
	}
	if (isAirdrop(tx)) {
		return true; // Receiving airdrop
	}
	if (isStakingReward(tx)) {
		return true; // Receiving rewards
	}
	if (isInterest(tx)) {
		return true; // Receiving interest
	}
	if (isLoan(tx)) {
		return tx.operation === "BORROW"; // Borrowing
	}
	return false;
}

/**
 * Check if transaction is an income event for tax purposes
 */
export function isIncomeEvent(tx: Transaction): boolean {
	return (
		isStakingReward(tx) ||
		isAirdrop(tx) ||
		isInterest(tx) ||
		(isLoan(tx) && tx.operation === "BORROW")
	);
}

/**
 * Get the base currency from a transaction (for currency pair trades)
 */
export function getBaseCurrency(tx: Transaction): string | undefined {
	if (isSpotTrade(tx)) {
		return tx.baseAsset.asset.symbol;
	}
	if (isSwap(tx)) {
		return tx.from.asset.symbol;
	}
	if (isMarginTrade(tx)) {
		return tx.baseAsset.asset.symbol;
	}
	return undefined;
}

/**
 * Get the quote currency from a transaction (for currency pair trades)
 */
export function getQuoteCurrency(tx: Transaction): string | undefined {
	if (isSpotTrade(tx)) {
		return tx.quoteAsset.asset.symbol;
	}
	if (isSwap(tx)) {
		return tx.to.asset.symbol;
	}
	if (isMarginTrade(tx)) {
		return tx.quoteAsset.asset.symbol;
	}
	return undefined;
}

/**
 * Get the base amount from a transaction
 */
export function getBaseAmount(tx: Transaction): number {
	if (isSpotTrade(tx)) {
		return tx.baseAsset.amount.toNumber();
	}
	if (isSwap(tx)) {
		return tx.from.amount.toNumber();
	}
	if (isMarginTrade(tx)) {
		return tx.baseAsset.amount.toNumber();
	}
	return 0;
}

/**
 * Get the quote amount from a transaction
 */
export function getQuoteAmount(tx: Transaction): number {
	if (isSpotTrade(tx)) {
		return tx.quoteAsset.amount.toNumber();
	}
	if (isSwap(tx)) {
		return tx.to.amount.toNumber();
	}
	if (isMarginTrade(tx)) {
		return tx.quoteAsset.amount.toNumber();
	}
	return 0;
}

/**
 * Get a comparable string representation of the asset for lot matching
 */
export function getAssetKey(tx: Transaction): string {
	const asset = getTransactionAsset(tx);
	const source = getTransactionSource(tx);
	return `${asset}:${source}`;
}

/**
 * Check if two transactions involve the same asset
 */
export function isSameAsset(tx1: Transaction, tx2: Transaction): boolean {
	return getTransactionAsset(tx1) === getTransactionAsset(tx2);
}
