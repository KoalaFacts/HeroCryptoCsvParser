import {
	type OperationMapping,
	TransactionCategorizer,
} from "../../core/TransactionCategorizer";

/**
 * Binance-specific transaction categorizer
 * Extends TransactionCategorizer with Binance operation mappings
 */
export class BinanceTransactionCategorizer extends TransactionCategorizer {
	constructor(
		customMappings?: OperationMapping[],
		useDefaults: boolean = false,
	) {
		super({
			mappings: customMappings,
			useDefaults: useDefaults,
			caseSensitive: false,
		});

		// Always add Binance-specific mappings
		this.addBinanceMappings();
	}

	/**
	 * Add Binance-specific operation mappings
	 */
	private addBinanceMappings(): void {
		const binanceMappings: OperationMapping[] = [
			// === HIGHEST PRIORITY (150+): Compound operations that must be checked first ===
			{
				pattern: /^withdraw fee$/i,
				type: "FEE",
				subType: "withdrawal",
				priority: 155,
			},
			{
				pattern: /^transaction related$/i,
				type: "FEE",
				subType: "transaction",
				priority: 150,
			},

			// === VERY HIGH PRIORITY (120-149): Specific multi-word patterns ===
			// P2P and OTC operations
			{
				pattern: /\bp2p\s+(buy|purchase)\b/i,
				type: "SPOT_TRADE",
				subType: "p2p-buy",
				priority: 140,
			},
			{
				pattern: /\bp2p\s+sell\b/i,
				type: "SPOT_TRADE",
				subType: "p2p-sell",
				priority: 140,
			},
			{
				pattern: /\botc\s+trading\b/i,
				type: "SPOT_TRADE",
				subType: "otc",
				priority: 135,
			},

			// Card and fiat operations
			{
				pattern: /\bfiat\s+deposit\b/i,
				type: "TRANSFER",
				subType: "fiat-deposit",
				priority: 135,
			},
			{
				pattern: /\bfiat\s+withdraw(al)?\b/i,
				type: "TRANSFER",
				subType: "fiat-withdrawal",
				priority: 135,
			},
			{
				pattern: /\bcrypto\s+box\b/i,
				type: "AIRDROP",
				subType: "mystery-box",
				priority: 130,
			},
			{
				pattern: /\bcard\s+(spending|cashback)\b/i,
				type: "INTEREST",
				subType: "card-cashback",
				priority: 130,
			},

			// === HIGH PRIORITY (100-119): Core trading operations ===
			{ pattern: /^buy$/i, type: "SPOT_TRADE", subType: "buy", priority: 115 },
			{
				pattern: /^sell$/i,
				type: "SPOT_TRADE",
				subType: "sell",
				priority: 115,
			},
			{
				pattern: /\bbuy\b(?!\s+crypto)/i,
				type: "SPOT_TRADE",
				subType: "buy",
				priority: 110,
			},
			{
				pattern: /\bsell\b(?!\s+crypto)/i,
				type: "SPOT_TRADE",
				subType: "sell",
				priority: 110,
			},
			{
				pattern: /^deposit$/i,
				type: "TRANSFER",
				subType: "deposit",
				priority: 110,
			},
			{
				pattern: /^withdraw(al)?$/i,
				type: "TRANSFER",
				subType: "withdrawal",
				priority: 110,
			},
			{
				pattern: /\bdeposit\b(?!\s+to)/i,
				type: "TRANSFER",
				subType: "deposit",
				priority: 105,
			},
			{
				pattern: /\bwithdraw(al)?\b(?!\s+fee)/i,
				type: "TRANSFER",
				subType: "withdrawal",
				priority: 105,
			},

			// === STAKING OPERATIONS (95-99) ===
			// Staking rewards (highest priority in staking)
			{
				pattern: /\b(staking|pos)\s+rewards?\b/i,
				type: "STAKING_REWARD",
				priority: 99,
			},
			{
				pattern: /\blocked\s+staking\s+rewards?\b/i,
				type: "STAKING_REWARD",
				priority: 99,
			},
			{
				pattern: /\beth\s+2\.0\s+staking\s+rewards?\b/i,
				type: "STAKING_REWARD",
				priority: 99,
			},

			// Staking withdrawals/redemptions
			{
				pattern: /\b(staking|locked\s+staking)\s+redemption\b/i,
				type: "STAKING_WITHDRAWAL",
				priority: 97,
			},
			{
				pattern: /\bstaking\s+principal\s+redemption\b/i,
				type: "STAKING_WITHDRAWAL",
				priority: 97,
			},
			{ pattern: /\bunstake\b/i, type: "STAKING_WITHDRAWAL", priority: 96 },

			// Staking deposits/purchases
			{
				pattern: /\b(staking|locked\s+staking)\s+purchase\b/i,
				type: "STAKING_DEPOSIT",
				priority: 95,
			},
			{
				pattern: /\beth\s+2\.0\s+staking\b(?!.*rewards?)(?!.*redemption)/i,
				type: "STAKING_DEPOSIT",
				priority: 95,
			},
			{
				pattern: /\bsubscribe\s+to\s+staking\b/i,
				type: "STAKING_DEPOSIT",
				priority: 95,
			},

			// === FEE OPERATIONS (90-94) ===
			{
				pattern: /\bcommission\s+(history|fee|rebate)\b(?!\s+referral)/i,
				type: "FEE",
				subType: "commission",
				priority: 93,
			},
			{
				pattern: /\btrading\s+fee\b/i,
				type: "FEE",
				subType: "trading",
				priority: 92,
			},
			{
				pattern: /\bnetwork\s+fee\b/i,
				type: "FEE",
				subType: "network",
				priority: 92,
			},
			{
				pattern: /\btransaction\s+fee\b/i,
				type: "FEE",
				subType: "transaction",
				priority: 91,
			},
			{ pattern: /\bfee\b/i, type: "FEE", subType: "trading", priority: 90 },

			// === EARN & SAVINGS OPERATIONS (85-89) ===
			{
				pattern: /\bsimple\s+earn\s+locked\s+rewards?\b/i,
				type: "STAKING_REWARD",
				priority: 89,
			},
			{
				pattern: /\bsimple\s+earn\s+flexible\s+(interest|rewards?)\b/i,
				type: "INTEREST",
				subType: "flexible-savings",
				priority: 88,
			},
			{
				pattern: /\blaunchpool\s+(interest|rewards?)\b/i,
				type: "INTEREST",
				subType: "launchpool",
				priority: 87,
			},
			{
				pattern: /\bsavings\s+(interest|reward)\b/i,
				type: "INTEREST",
				subType: "savings",
				priority: 86,
			},
			{
				pattern: /\bflexible\s+savings\s+(interest|purchase)\b/i,
				type: "INTEREST",
				subType: "flexible-savings",
				priority: 86,
			},
			{
				pattern: /\blocked\s+savings\s+(interest|purchase)\b/i,
				type: "INTEREST",
				subType: "locked-savings",
				priority: 86,
			},

			// === SWAP & CONVERT OPERATIONS (85-89) ===
			{
				pattern: /\bauto[-\s]?invest\b/i,
				type: "SWAP",
				subType: "auto-invest",
				priority: 89,
			},
			{
				pattern: /\bsmall\s+assets\s+exchange\s+bnb\b/i,
				type: "SWAP",
				subType: "dust",
				priority: 88,
			},
			{
				pattern: /\bdust\s+to\s+bnb\b/i,
				type: "SWAP",
				subType: "dust",
				priority: 88,
			},
			{
				pattern: /\bquick\s+(buy|sell)\b/i,
				type: "SWAP",
				subType: "quick-trade",
				priority: 87,
			},
			{
				pattern: /\bconvert\b/i,
				type: "SWAP",
				subType: "instant",
				priority: 85,
			},
			{
				pattern: /\bswap\b(?!.*liquid)/i,
				type: "SWAP",
				subType: "swap",
				priority: 85,
			},

			// === LIQUIDITY OPERATIONS (80-84) ===
			{
				pattern: /\bliquid\s+swap\s+add\b/i,
				type: "LIQUIDITY_ADD",
				priority: 84,
			},
			{
				pattern: /\bliquid\s+swap\s+remove\b/i,
				type: "LIQUIDITY_REMOVE",
				priority: 84,
			},
			{
				pattern: /\bliquid\s+swap\s+(rewards?|interest)\b/i,
				type: "INTEREST",
				subType: "liquidity",
				priority: 83,
			},
			{
				pattern: /\bliquidity\s+(farming|pool)\s+add\b/i,
				type: "LIQUIDITY_ADD",
				priority: 82,
			},
			{
				pattern: /\bliquidity\s+(farming|pool)\s+remove\b/i,
				type: "LIQUIDITY_REMOVE",
				priority: 82,
			},
			{
				pattern: /\bliquidity\s+(farming|pool)\s+rewards?\b/i,
				type: "INTEREST",
				subType: "liquidity",
				priority: 81,
			},
			{ pattern: /\badd\s+liquidity\b/i, type: "LIQUIDITY_ADD", priority: 80 },
			{
				pattern: /\bremove\s+liquidity\b/i,
				type: "LIQUIDITY_REMOVE",
				priority: 80,
			},

			// === AIRDROPS & DISTRIBUTIONS (75-79) ===
			{
				pattern: /\b(token|coin)\s+airdrop\b/i,
				type: "AIRDROP",
				subType: "token",
				priority: 79,
			},
			{
				pattern: /\bairdrop\s+(received|assets?)\b/i,
				type: "AIRDROP",
				priority: 78,
			},
			{
				pattern: /\bdistribution\b(?!\s+(voucher|reward))/i,
				type: "AIRDROP",
				priority: 77,
			},
			{
				pattern: /\bgiveaway\b/i,
				type: "AIRDROP",
				subType: "giveaway",
				priority: 76,
			},
			{ pattern: /\bairdrop\b/i, type: "AIRDROP", priority: 75 },

			// === INTEREST, REWARDS & EARNINGS (80-89) ===
			// Specific reward types (higher priority)
			{
				pattern: /\bcash\s+voucher\s+distribution\b/i,
				type: "INTEREST",
				subType: "voucher",
				priority: 89,
			},
			{
				pattern: /\bvip\s+rewards?\b/i,
				type: "INTEREST",
				subType: "vip",
				priority: 88,
			},
			{
				pattern: /\btask\s+rewards?\b/i,
				type: "INTEREST",
				subType: "task",
				priority: 87,
			},
			{
				pattern: /\bcompetition\s+rewards?\b/i,
				type: "INTEREST",
				subType: "competition",
				priority: 86,
			},
			{
				pattern: /\bevent\s+rewards?\b/i,
				type: "INTEREST",
				subType: "event",
				priority: 85,
			},

			// Referral and affiliate rewards
			{
				pattern: /\breferral\s+(commission|bonus|reward)\b/i,
				type: "INTEREST",
				subType: "referral",
				priority: 84,
			},
			{
				pattern: /\baffiliate\s+(commission|earnings?)\b/i,
				type: "INTEREST",
				subType: "affiliate",
				priority: 83,
			},

			// Mining and pool rewards
			{
				pattern: /\b(pool|mining)\s+revenues?\b/i,
				type: "INTEREST",
				subType: "mining",
				priority: 82,
			},
			{
				pattern: /\bmining\s+rewards?\b/i,
				type: "INTEREST",
				subType: "mining",
				priority: 82,
			},
			{
				pattern: /\bpool\s+rewards?\b/i,
				type: "INTEREST",
				subType: "pool",
				priority: 81,
			},

			// Cashback and rebates
			{
				pattern: /\bcashback\s+voucher\b/i,
				type: "INTEREST",
				subType: "cashback",
				priority: 80,
			},
			{
				pattern: /\brebate\b/i,
				type: "INTEREST",
				subType: "rebate",
				priority: 80,
			},

			// === FUTURES & DERIVATIVES (65-69) ===
			{
				pattern: /\brealized\s+(profit\s+and\s+loss|pnl)\b/i,
				type: "INTEREST",
				subType: "futures-pnl",
				priority: 69,
			},
			{
				pattern: /\bunrealized\s+pnl\b/i,
				type: "INTEREST",
				subType: "unrealized-pnl",
				priority: 68,
			},
			{
				pattern: /\bfutures\s+(commission|fee)\b/i,
				type: "FEE",
				subType: "futures",
				priority: 67,
			},
			{
				pattern: /\bfunding\s+fee\b/i,
				type: "FEE",
				subType: "funding",
				priority: 66,
			},
			{
				pattern: /\binsurance\s+clear\b/i,
				type: "FEE",
				subType: "insurance",
				priority: 65,
			},

			// === MARGIN TRADING (120-124) - Higher priority than regular buy/sell ===
			{
				pattern: /\bmargin\s+(buy|purchase)\b/i,
				type: "MARGIN_TRADE",
				subType: "buy",
				priority: 124,
			},
			{
				pattern: /\bmargin\s+sell\b/i,
				type: "MARGIN_TRADE",
				subType: "sell",
				priority: 124,
			},
			{
				pattern: /\bcross\s+margin\s+interest\b/i,
				type: "FEE",
				subType: "margin-interest",
				priority: 123,
			},
			{
				pattern: /\bisolated\s+margin\s+interest\b/i,
				type: "FEE",
				subType: "margin-interest",
				priority: 123,
			},
			{
				pattern: /\bmargin\s+(loan|borrow)\b/i,
				type: "LOAN",
				subType: "margin",
				priority: 122,
			},
			{
				pattern: /\bmargin\s+repay(ment)?\b/i,
				type: "LOAN",
				subType: "repayment",
				priority: 122,
			},

			// === INTERNAL TRANSFERS (55-59) ===
			{
				pattern: /\bspot\s+to\s+(futures|margin|earn)\b/i,
				type: "TRANSFER",
				subType: "internal",
				priority: 59,
			},
			{
				pattern: /\b(futures|margin|earn)\s+to\s+spot\b/i,
				type: "TRANSFER",
				subType: "internal",
				priority: 59,
			},
			{
				pattern: /\binternal\s+transfer\b/i,
				type: "TRANSFER",
				subType: "internal",
				priority: 58,
			},
			{
				pattern: /\btransfer\s+(between|from|to)\s+accounts?\b/i,
				type: "TRANSFER",
				subType: "internal",
				priority: 57,
			},
			{
				pattern: /\bsub[-\s]?account\s+transfer\b/i,
				type: "TRANSFER",
				subType: "sub-account",
				priority: 56,
			},

			// === LAUNCHPAD & NEW LISTINGS (50-54) ===
			{
				pattern: /\blaunchpad\s+subscription\b/i,
				type: "SPOT_TRADE",
				subType: "launchpad",
				priority: 54,
			},
			{
				pattern: /\blaunchpad\s+deduction\b/i,
				type: "SPOT_TRADE",
				subType: "launchpad",
				priority: 53,
			},
			{
				pattern: /\binitial\s+exchange\s+offering\b/i,
				type: "SPOT_TRADE",
				subType: "ieo",
				priority: 52,
			},
			{
				pattern: /\bieo\s+(purchase|subscription)\b/i,
				type: "SPOT_TRADE",
				subType: "ieo",
				priority: 51,
			},

			// === MISC OPERATIONS (40-49) ===
			{
				pattern: /\bbonus\s+(cash|reward)\b/i,
				type: "INTEREST",
				subType: "bonus",
				priority: 44,
			},

			// === GENERIC PATTERNS (10-39) - Lower priority catch-alls ===
			{
				pattern: /\btransfer\b/i,
				type: "TRANSFER",
				subType: "general",
				priority: 30,
			},
			{ pattern: /\brewards?\b/i, type: "INTEREST", priority: 25 },
			{
				pattern: /\bbonus\b/i,
				type: "INTEREST",
				subType: "bonus",
				priority: 20,
			},
			{ pattern: /\binterest\b/i, type: "INTEREST", priority: 20 },
			{ pattern: /\bearnings?\b/i, type: "INTEREST", priority: 15 },
		];

		this.addMappings(binanceMappings);
	}
}

/**
 * Factory function to create a Binance categorizer with custom mappings
 */
export function createBinanceCategorizer(
	customMappings?: OperationMapping[],
	operationOverrides?: Record<string, string>,
): BinanceTransactionCategorizer {
	const mappings = customMappings || [];

	// Add operation overrides as high-priority exact matches
	if (operationOverrides) {
		Object.entries(operationOverrides).forEach(([operation, type]) => {
			mappings.push({
				pattern: new RegExp(`^${operation}$`, "i"),
				type: type as any,
				priority: 200, // High priority for user overrides
			});
		});
	}

	return new BinanceTransactionCategorizer(mappings);
}
