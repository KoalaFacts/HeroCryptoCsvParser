// Union type of all transaction types

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
import type { Transfer } from "./Transfer";
import type { Unknown } from "./Unknown";

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

export type TransactionType = Transaction["type"];
