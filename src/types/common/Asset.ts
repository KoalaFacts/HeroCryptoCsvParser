/**
 * Represents a cryptocurrency or token asset
 */
export class Asset {
	readonly symbol: string;
	readonly name?: string;
	readonly decimals?: number;
	readonly type?: "crypto" | "token" | "stablecoin" | "fiat";
	readonly contractAddress?: string;
	readonly chain?: string;

	constructor(
		symbol: string,
		options?: {
			name?: string;
			decimals?: number;
			type?: "crypto" | "token" | "stablecoin" | "fiat";
			contractAddress?: string;
			chain?: string;
		},
	) {
		this.symbol = symbol.toUpperCase();
		this.name = options?.name;
		this.decimals = options?.decimals;
		this.type = options?.type;
		this.contractAddress = options?.contractAddress;
		this.chain = options?.chain;
	}

	static UNKNOWN: Asset = new Asset("__UNKNOWN__");

	toString(): string {
		return this.symbol;
	}

	equals(other: Asset | string): boolean {
		const otherSymbol = typeof other === "string" ? other : other.symbol;
		return this.symbol === otherSymbol.toUpperCase();
	}

	isStablecoin(): boolean {
		const stablecoins = [
			"USDT",
			"USDC",
			"BUSD",
			"DAI",
			"TUSD",
			"USDP",
			"GUSD",
			"FRAX",
			"LUSD",
		];
		return stablecoins.includes(this.symbol);
	}

	isFiat(): boolean {
		return this.type === "fiat";
	}

	static fromSymbol(symbol: string): Asset {
		return new Asset(symbol);
	}

	isUnknown(): boolean {
		return this.equals(Asset.UNKNOWN);
	}
}
