/**
 * Mock factories for creating test data with proper types
 */

import { Amount } from "@/types/common/Amount";
import { Asset } from "@/types/common/Asset";
import type { AssetAmount } from "@/types/common/AssetAmount";
import { DataSource } from "@/types/common/DataSource";
import type { FiatValue } from "@/types/common/FiatValue";
import type { Airdrop } from "@/types/transactions/Airdrop";
import type { Interest } from "@/types/transactions/Interest";
import type { LiquidityAdd } from "@/types/transactions/LiquidityAdd";
import type { LiquidityRemove } from "@/types/transactions/LiquidityRemove";
import type { SpotTrade } from "@/types/transactions/SpotTrade";
import type { StakingReward } from "@/types/transactions/StakingReward";
import type { Swap } from "@/types/transactions/Swap";
import type { Transaction } from "@/types/transactions/Transaction";
import type { Transfer } from "@/types/transactions/Transfer";

/**
 * Creates a mock Asset with all required methods
 */
export function createMockAsset(
	symbol: string,
	options?: {
		name?: string;
		decimals?: number;
		type?: "crypto" | "token" | "stablecoin" | "fiat";
	},
): Asset {
	return new Asset(symbol, options);
}

/**
 * Creates a mock DataSource with all required properties
 */
export function createMockDataSource(
	id: string,
	type:
		| "exchange"
		| "wallet"
		| "defi"
		| "blockchain"
		| "manual"
		| "protocol"
		| "marketplace" = "exchange",
	name?: string,
): DataSource {
	return new DataSource(id, type as any, name || id);
}

/**
 * Creates a mock Amount
 */
export function createMockAmount(value: string): Amount {
	return new Amount(value);
}

/**
 * Creates a mock FiatValue
 */
export function createMockFiatValue(
	value: string,
	currency: string = "USD",
): FiatValue {
	return {
		amount: createMockAmount(value),
		currency,
	};
}

/**
 * Creates a mock AssetAmount
 */
export function createMockAssetAmount(
	symbol: string,
	value: string,
	fiatValue?: { value: string; currency?: string },
): AssetAmount {
	return {
		asset: createMockAsset(symbol),
		amount: createMockAmount(value),
		fiatValue: fiatValue
			? createMockFiatValue(fiatValue.value, fiatValue.currency)
			: undefined,
	};
}

/**
 * Creates a mock SpotTrade transaction
 */
export function createMockSpotTrade(overrides?: Partial<SpotTrade>): SpotTrade {
	const defaults: SpotTrade = {
		id: "test-spot-trade-001",
		type: "SPOT_TRADE",
		timestamp: new Date("2024-01-15T10:30:00Z"),
		source: createMockDataSource("binance", "exchange", "Binance"),
		baseAsset: createMockAssetAmount("BTC", "0.5", {
			value: "25000",
			currency: "USD",
		}),
		quoteAsset: createMockAssetAmount("USDT", "25000", {
			value: "25000",
			currency: "USD",
		}),
		side: "BUY",
		price: "50000",
		fee: createMockAssetAmount("BNB", "0.01", { value: "5", currency: "USD" }),
		taxEvents: [],
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a mock StakingReward transaction
 */
export function createMockStakingReward(
	overrides?: Partial<StakingReward>,
): StakingReward {
	const defaults: StakingReward = {
		id: "test-staking-001",
		type: "STAKING_REWARD",
		timestamp: new Date("2024-01-15T10:30:00Z"),
		source: createMockDataSource("binance", "exchange", "Binance"),
		reward: createMockAssetAmount("ETH", "0.05", {
			value: "100",
			currency: "USD",
		}),
		staking: {
			stakedAsset: createMockAssetAmount("ETH", "1.0"),
			pool: "ETH 2.0 Staking",
			apr: "5.5",
		},
		taxEvents: [],
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a mock Swap transaction
 */
export function createMockSwap(overrides?: Partial<Swap>): Swap {
	const defaults: Swap = {
		id: "test-swap-001",
		type: "SWAP",
		timestamp: new Date("2024-01-15T10:30:00Z"),
		source: createMockDataSource("uniswap", "defi", "Uniswap"),
		from: createMockAssetAmount("USDC", "1000", {
			value: "1000",
			currency: "USD",
		}),
		to: createMockAssetAmount("DAI", "999", { value: "999", currency: "USD" }),
		route: {
			protocol: "Uniswap V3",
			pools: ["USDC-DAI"],
		},
		fee: createMockAssetAmount("ETH", "0.001", { value: "2", currency: "USD" }),
		taxEvents: [],
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a mock Transfer transaction
 */
export function createMockTransfer(overrides?: Partial<Transfer>): Transfer {
	const defaults: Transfer = {
		id: "test-transfer-001",
		type: "TRANSFER",
		timestamp: new Date("2024-01-15T10:30:00Z"),
		source: createMockDataSource("metamask", "wallet", "MetaMask"),
		asset: createMockAssetAmount("ETH", "1.0", {
			value: "2000",
			currency: "USD",
		}),
		from: { address: "0x123...", label: "Wallet 1" },
		to: { address: "0x456...", label: "Wallet 2" },
		direction: "OUT",
		networkFee: createMockAssetAmount("ETH", "0.001", {
			value: "2",
			currency: "USD",
		}),
		taxEvents: [],
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a mock Airdrop transaction
 */
export function createMockAirdrop(overrides?: Partial<Airdrop>): Airdrop {
	const defaults: Airdrop = {
		id: "test-airdrop-001",
		type: "AIRDROP",
		timestamp: new Date("2024-01-15T10:30:00Z"),
		source: createMockDataSource("uniswap", "defi", "Uniswap"),
		received: createMockAssetAmount("UNI", "400", {
			value: "2000",
			currency: "USD",
		}),
		airdrop: {
			reason: "Uniswap governance token distribution",
		},
		taxEvents: [],
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a mock Interest transaction
 */
export function createMockInterest(overrides?: Partial<Interest>): Interest {
	const defaults: Interest = {
		id: "test-interest-001",
		type: "INTEREST",
		timestamp: new Date("2024-01-15T10:30:00Z"),
		source: createMockDataSource("aave", "defi", "Aave"),
		interest: createMockAssetAmount("USDC", "10", {
			value: "10",
			currency: "USD",
		}),
		interestType: "EARNED",
		context: {
			protocol: "Aave",
			rate: "3.5",
			period: "30 days",
		},
		taxEvents: [],
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a mock LiquidityAdd transaction
 */
export function createMockLiquidityAdd(
	overrides?: Partial<LiquidityAdd>,
): LiquidityAdd {
	const defaults: LiquidityAdd = {
		id: "test-liquidity-add-001",
		type: "LIQUIDITY_ADD",
		timestamp: new Date("2024-01-15T10:30:00Z"),
		source: createMockDataSource("uniswap", "defi", "Uniswap"),
		assets: [
			createMockAssetAmount("ETH", "1.0", { value: "2000", currency: "USD" }),
			createMockAssetAmount("USDC", "2000", { value: "2000", currency: "USD" }),
		],
		lpTokens: createMockAssetAmount("UNI-V2", "44.721"),
		pool: {
			protocol: "Uniswap V2",
			name: "ETH-USDC",
		},
		taxEvents: [],
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a mock LiquidityRemove transaction
 */
export function createMockLiquidityRemove(
	overrides?: Partial<LiquidityRemove>,
): LiquidityRemove {
	const defaults: LiquidityRemove = {
		id: "test-liquidity-remove-001",
		type: "LIQUIDITY_REMOVE",
		timestamp: new Date("2024-01-15T10:30:00Z"),
		source: createMockDataSource("uniswap", "defi", "Uniswap"),
		lpTokens: createMockAssetAmount("UNI-V2", "44.721"),
		assets: [
			createMockAssetAmount("ETH", "1.0", { value: "2000", currency: "USD" }),
			createMockAssetAmount("USDC", "2000", { value: "2000", currency: "USD" }),
		],
		pool: {
			protocol: "Uniswap V2",
			name: "ETH-USDC",
		},
		taxEvents: [],
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a generic mock Transaction (defaults to SpotTrade)
 */
export function createMockTransaction(
	type: Transaction["type"],
	overrides?: any,
): Transaction {
	switch (type) {
		case "SPOT_TRADE":
			return createMockSpotTrade(overrides);
		case "STAKING_REWARD":
			return createMockStakingReward(overrides);
		case "SWAP":
			return createMockSwap(overrides);
		case "TRANSFER":
			return createMockTransfer(overrides);
		case "AIRDROP":
			return createMockAirdrop(overrides);
		case "INTEREST":
			return createMockInterest(overrides);
		case "LIQUIDITY_ADD":
			return createMockLiquidityAdd(overrides);
		case "LIQUIDITY_REMOVE":
			return createMockLiquidityRemove(overrides);
		default:
			return createMockSpotTrade(overrides);
	}
}

/**
 * Common test assets
 */
export const TestAssets = {
	BTC: createMockAsset("BTC", { name: "Bitcoin", decimals: 8, type: "crypto" }),
	ETH: createMockAsset("ETH", {
		name: "Ethereum",
		decimals: 18,
		type: "crypto",
	}),
	USDT: createMockAsset("USDT", {
		name: "Tether",
		decimals: 6,
		type: "stablecoin",
	}),
	USDC: createMockAsset("USDC", {
		name: "USD Coin",
		decimals: 6,
		type: "stablecoin",
	}),
	BNB: createMockAsset("BNB", {
		name: "Binance Coin",
		decimals: 8,
		type: "crypto",
	}),
	DAI: createMockAsset("DAI", {
		name: "Dai",
		decimals: 18,
		type: "stablecoin",
	}),
	UNI: createMockAsset("UNI", { name: "Uniswap", decimals: 18, type: "token" }),
	AAVE: createMockAsset("AAVE", { name: "Aave", decimals: 18, type: "token" }),
};

/**
 * Common test data sources
 */
export const TestSources = {
	BINANCE: DataSource.BINANCE,
	COINBASE: DataSource.COINBASE,
	UNISWAP: DataSource.UNISWAP,
	METAMASK: DataSource.METAMASK,
	AAVE: DataSource.AAVE,
};
