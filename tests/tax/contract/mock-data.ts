import { Amount } from "../../../src/types/common/Amount";
import { Asset } from "../../../src/types/common/Asset";
import type { AssetAmount } from "../../../src/types/common/AssetAmount";
import { DataSource } from "../../../src/types/common/DataSource";
import type { TaxEvent } from "../../../src/types/common/TaxEvent";
import type { SpotTrade } from "../../../src/types/transactions/SpotTrade";
import type { Transaction } from "../../../src/types/transactions/Transaction";

/**
 * Mock data helpers for contract tests
 */

export const createMockAsset = (
	symbol: string = "BTC",
	name?: string,
): Asset => {
	return new Asset(symbol, {
		name: name || `${symbol} Asset`,
		decimals: 8,
		type: "crypto",
	});
};

export const createMockDataSource = (
	name: string = "TestExchange",
): DataSource => {
	return DataSource.custom(`test-${name.toLowerCase()}`, "exchange", name);
};

export const createMockAmount = (value: number = 1.0): Amount => {
	return new Amount(value);
};

export const createMockAssetAmount = (
	value: number = 1.0,
	asset?: Asset,
): AssetAmount => {
	return {
		asset: asset || createMockAsset(),
		amount: createMockAmount(value),
	};
};

export const createMockTaxEvent = (): TaxEvent => ({
	type: "CAPITAL_GAIN",
	timestamp: new Date("2024-01-15T10:30:00Z"),
	description: "Test capital gain event",
	transactionId: "test-tx-001",
	amount: createMockAssetAmount(1.0),
	source: createMockDataSource(),
	jurisdiction: "AU",
	taxYear: 2024,
});

export const createMockSpotTrade = (
	overrides?: Partial<SpotTrade>,
): SpotTrade => {
	const baseDefault: SpotTrade = {
		id: "test-tx-001",
		type: "SPOT_TRADE",
		timestamp: new Date("2024-01-15T10:30:00Z"),
		source: createMockDataSource(),
		taxEvents: [createMockTaxEvent()],
		originalData: {
			side: "sell",
			amount: "1.5",
			price: "50000",
			asset: "BTC",
		},
		baseAsset: createMockAssetAmount(1.5, createMockAsset("BTC")),
		quoteAsset: createMockAssetAmount(
			75000,
			createMockAsset("AUD", "Australian Dollar"),
		),
		side: "SELL",
		price: "50000",
	};

	return { ...baseDefault, ...overrides };
};

export const createMockTransaction = (
	type: string = "SPOT_TRADE",
	overrides?: Partial<Transaction>,
): Transaction => {
	if (type === "SPOT_TRADE") {
		return createMockSpotTrade(overrides as Partial<SpotTrade>);
	}

	// For other transaction types, return base structure
	const baseTransaction: Transaction = {
		id: "test-tx-001",
		type: type as any,
		timestamp: new Date("2024-01-15T10:30:00Z"),
		source: createMockDataSource(),
		taxEvents: [createMockTaxEvent()],
		originalData: {
			type: type,
		},
		...overrides,
	} as Transaction;

	return baseTransaction;
};
