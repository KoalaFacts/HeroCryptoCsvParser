import type { Airdrop } from "./Airdrop";
import type { Fee } from "./Fee";
import type { FuturesTrade } from "./FuturesTrade";
import type { Interest } from "./Interest";
import type { LiquidityAdd } from "./LiquidityAdd";
import type { LiquidityRemove } from "./LiquidityRemove";
import type { Loan } from "./Loan";
import type { MarginTrade } from "./MarginTrade";
import type { SpotTrade } from "./SpotTrade";
import type { StakingDeposit } from "./StakingDeposit";
import type { StakingReward } from "./StakingReward";
import type { StakingWithdrawal } from "./StakingWithdrawal";
import type { Swap } from "./Swap";
import type { Transaction } from "./Transaction";
import type { Transfer } from "./Transfer";

// Type guards for each transaction type
export function isSpotTrade(tx: Transaction): tx is SpotTrade {
	return tx.type === "SPOT_TRADE";
}

export function isTransfer(tx: Transaction): tx is Transfer {
	return tx.type === "TRANSFER";
}

export function isStakingDeposit(tx: Transaction): tx is StakingDeposit {
	return tx.type === "STAKING_DEPOSIT";
}

export function isStakingWithdrawal(tx: Transaction): tx is StakingWithdrawal {
	return tx.type === "STAKING_WITHDRAWAL";
}

export function isStakingReward(tx: Transaction): tx is StakingReward {
	return tx.type === "STAKING_REWARD";
}

export function isSwap(tx: Transaction): tx is Swap {
	return tx.type === "SWAP";
}

export function isLiquidityAdd(tx: Transaction): tx is LiquidityAdd {
	return tx.type === "LIQUIDITY_ADD";
}

export function isLiquidityRemove(tx: Transaction): tx is LiquidityRemove {
	return tx.type === "LIQUIDITY_REMOVE";
}

export function isAirdrop(tx: Transaction): tx is Airdrop {
	return tx.type === "AIRDROP";
}

export function isFee(tx: Transaction): tx is Fee {
	return tx.type === "FEE";
}

export function isLoan(tx: Transaction): tx is Loan {
	return tx.type === "LOAN";
}

export function isInterest(tx: Transaction): tx is Interest {
	return tx.type === "INTEREST";
}

export function isMarginTrade(tx: Transaction): tx is MarginTrade {
	return tx.type === "MARGIN_TRADE";
}

export function isFuturesTrade(tx: Transaction): tx is FuturesTrade {
	return tx.type === "FUTURES_TRADE";
}
