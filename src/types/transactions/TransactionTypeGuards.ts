import { Transaction } from './Transaction';
import { SpotTrade } from './SpotTrade';
import { Transfer } from './Transfer';
import { StakingDeposit } from './StakingDeposit';
import { StakingWithdrawal } from './StakingWithdrawal';
import { StakingReward } from './StakingReward';
import { Swap } from './Swap';
import { LiquidityAdd } from './LiquidityAdd';
import { LiquidityRemove } from './LiquidityRemove';
import { Airdrop } from './Airdrop';
import { Fee } from './Fee';
import { Loan } from './Loan';
import { Interest } from './Interest';
import { MarginTrade } from './MarginTrade';
import { FuturesTrade } from './FuturesTrade';

// Type guards for each transaction type
export function isSpotTrade(tx: Transaction): tx is SpotTrade {
  return tx.type === 'SPOT_TRADE';
}

export function isTransfer(tx: Transaction): tx is Transfer {
  return tx.type === 'TRANSFER';
}

export function isStakingDeposit(tx: Transaction): tx is StakingDeposit {
  return tx.type === 'STAKING_DEPOSIT';
}

export function isStakingWithdrawal(tx: Transaction): tx is StakingWithdrawal {
  return tx.type === 'STAKING_WITHDRAWAL';
}

export function isStakingReward(tx: Transaction): tx is StakingReward {
  return tx.type === 'STAKING_REWARD';
}

export function isSwap(tx: Transaction): tx is Swap {
  return tx.type === 'SWAP';
}

export function isLiquidityAdd(tx: Transaction): tx is LiquidityAdd {
  return tx.type === 'LIQUIDITY_ADD';
}

export function isLiquidityRemove(tx: Transaction): tx is LiquidityRemove {
  return tx.type === 'LIQUIDITY_REMOVE';
}

export function isAirdrop(tx: Transaction): tx is Airdrop {
  return tx.type === 'AIRDROP';
}

export function isFee(tx: Transaction): tx is Fee {
  return tx.type === 'FEE';
}

export function isLoan(tx: Transaction): tx is Loan {
  return tx.type === 'LOAN';
}

export function isInterest(tx: Transaction): tx is Interest {
  return tx.type === 'INTEREST';
}

export function isMarginTrade(tx: Transaction): tx is MarginTrade {
  return tx.type === 'MARGIN_TRADE';
}

export function isFuturesTrade(tx: Transaction): tx is FuturesTrade {
  return tx.type === 'FUTURES_TRADE';
}