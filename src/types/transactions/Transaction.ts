// Union type of all transaction types
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
import { Unknown } from './Unknown';

export type Transaction =
  | SpotTrade
  | Transfer
  | StakingDeposit
  | StakingWithdrawal
  | StakingReward
  | Swap
  | LiquidityAdd
  | LiquidityRemove
  | Airdrop
  | Fee
  | Loan
  | Interest
  | MarginTrade
  | FuturesTrade
  | Unknown;

export type TransactionType = Transaction['type'];