import type { TransactionType } from "../types/transactions";

/**
 * Operation mapping configuration
 */
export interface OperationMapping {
	/** The operation/description pattern to match (case-insensitive) */
	pattern: string | RegExp;
	/** The transaction type to map to */
	type: TransactionType;
	/** Optional sub-type or additional metadata */
	subType?: string;
	/** Priority for resolving conflicts (higher wins) */
	priority?: number;
}

/**
 * Categorizer configuration
 */
export interface CategorizerConfig {
	/** Custom operation mappings */
	mappings?: OperationMapping[];
	/** Whether to use default mappings as fallback */
	useDefaults?: boolean;
	/** Case sensitive matching */
	caseSensitive?: boolean;
}

/**
 * Transaction categorization result
 */
export interface CategorizationResult {
	/** The determined transaction type */
	type: TransactionType;
	/** Optional sub-type */
	subType?: string;
	/** Confidence score (0-1) */
	confidence: number;
	/** The mapping rule that was applied */
	matchedRule?: OperationMapping;
}

/**
 * Helps categorize transactions based on operation descriptions
 * Allows users to define custom mappings for new or unrecognized operations
 */
export class TransactionCategorizer {
	private mappings: OperationMapping[] = [];
	private caseSensitive: boolean;

	constructor(config?: CategorizerConfig) {
		this.caseSensitive = config?.caseSensitive ?? false;

		if (config?.useDefaults !== false) {
			this.loadDefaultMappings();
		}

		if (config?.mappings) {
			this.addMappings(config.mappings);
		}
	}

	/**
	 * Add custom operation mappings
	 */
	addMapping(mapping: OperationMapping): void {
		this.mappings.push({
			...mapping,
			priority: mapping.priority ?? 0,
		});
		// Sort by priority (highest first)
		this.mappings.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
	}

	/**
	 * Add multiple mappings at once
	 */
	addMappings(mappings: OperationMapping[]): void {
		mappings.forEach((m) => this.addMapping(m));
	}

	/**
	 * Clear all custom mappings
	 */
	clearMappings(): void {
		this.mappings = [];
	}

	/**
	 * Categorize an operation based on its description
	 */
	categorize(operation: string, remark?: string): CategorizationResult {
		const searchText = `${operation} ${remark || ""}`.trim();

		// Try to find a matching rule
		for (const mapping of this.mappings) {
			if (this.matches(searchText, mapping.pattern)) {
				return {
					type: mapping.type,
					subType: mapping.subType,
					confidence: mapping.priority
						? Math.min(1, mapping.priority / 100)
						: 0.8,
					matchedRule: mapping,
				};
			}
		}

		// No match found
		return {
			type: "UNKNOWN",
			confidence: 0,
			matchedRule: undefined,
		};
	}

	/**
	 * Check if text matches a pattern
	 */
	private matches(text: string, pattern: string | RegExp): boolean {
		if (pattern instanceof RegExp) {
			return pattern.test(text);
		}

		// Normalize both text and pattern based on case sensitivity setting
		const normalizedText = this.caseSensitive ? text : text.toLowerCase();
		const normalizedPattern = this.caseSensitive
			? pattern
			: pattern.toLowerCase();
		return normalizedText.includes(normalizedPattern);
	}

	/**
	 * Load default mappings for common operations
	 */
	private loadDefaultMappings(): void {
		const defaults: OperationMapping[] = [
			// Binance default mappings
			{
				pattern: /\b(buy|purchase|bought)\b/i,
				type: "SPOT_TRADE",
				subType: "buy",
				priority: 50,
			},
			{
				pattern: /\b(sell|sold)\b/i,
				type: "SPOT_TRADE",
				subType: "sell",
				priority: 50,
			},
			{
				pattern: /\bdeposit\b/i,
				type: "TRANSFER",
				subType: "deposit",
				priority: 40,
			},
			{
				pattern: /\bwithdraw(al)?\b/i,
				type: "TRANSFER",
				subType: "withdrawal",
				priority: 40,
			},
			{
				pattern: /\bstaking[\s-]?purchase\b/i,
				type: "STAKING_DEPOSIT",
				priority: 60,
			},
			{
				pattern: /\bstaking[\s-]?redemption\b/i,
				type: "STAKING_WITHDRAWAL",
				priority: 60,
			},
			{
				pattern: /\bstaking[\s-]?rewards?\b/i,
				type: "STAKING_REWARD",
				priority: 60,
			},
			{
				pattern: /\b(trading[\s-]?)?fee\b/i,
				type: "FEE",
				subType: "trading",
				priority: 30,
			},
			{
				pattern: /\bcommission\b/i,
				type: "FEE",
				subType: "commission",
				priority: 30,
			},
			{
				pattern: /\bconvert\b/i,
				type: "SWAP",
				subType: "instant",
				priority: 45,
			},
			{ pattern: /\bswap\b/i, type: "SWAP", priority: 45 },
			{
				pattern: /\bliquid(ity)?[\s-]?swap[\s-]?add\b/i,
				type: "LIQUIDITY_ADD",
				priority: 55,
			},
			{
				pattern: /\bliquid(ity)?[\s-]?swap[\s-]?remove\b/i,
				type: "LIQUIDITY_REMOVE",
				priority: 55,
			},
			{ pattern: /\bairdrop\b/i, type: "AIRDROP", priority: 35 },
			{ pattern: /\bdistribution\b/i, type: "AIRDROP", priority: 35 },
			{ pattern: /\binterest\b/i, type: "INTEREST", priority: 25 },
			{
				pattern: /\bmining[\s-]?revenue\b/i,
				type: "INTEREST",
				subType: "mining",
				priority: 35,
			},
			{
				pattern: /\breferral\b/i,
				type: "INTEREST",
				subType: "referral",
				priority: 35,
			},

			// Coinbase mappings
			{
				pattern: /\breceive\b/i,
				type: "TRANSFER",
				subType: "receive",
				priority: 40,
			},
			{ pattern: /\bsend\b/i, type: "TRANSFER", subType: "send", priority: 40 },

			// Kraken mappings
			{ pattern: /\btrade\b/i, type: "SPOT_TRADE", priority: 45 },
			{ pattern: /\bmargin\b/i, type: "MARGIN_TRADE", priority: 50 },

			// DeFi mappings
			{
				pattern: /\bprovide[\s-]?liquidity\b/i,
				type: "LIQUIDITY_ADD",
				priority: 55,
			},
			{
				pattern: /\bremove[\s-]?liquidity\b/i,
				type: "LIQUIDITY_REMOVE",
				priority: 55,
			},
			{
				pattern: /\byield[\s-]?farm/i,
				type: "INTEREST",
				subType: "farming",
				priority: 35,
			},
			{
				pattern: /\bharvest\b/i,
				type: "INTEREST",
				subType: "harvest",
				priority: 35,
			},
			{
				pattern: /\bclaim\b/i,
				type: "INTEREST",
				subType: "claim",
				priority: 30,
			},

			// Generic patterns (lower priority)
			{ pattern: /\breward\b/i, type: "INTEREST", priority: 20 },
			{ pattern: /\bbonus\b/i, type: "INTEREST", priority: 20 },
			{ pattern: /\bcashback\b/i, type: "INTEREST", priority: 20 },
			{ pattern: /\btransfer\b/i, type: "TRANSFER", priority: 10 },
		];

		this.addMappings(defaults);
	}

	/**
	 * Export current mappings for persistence
	 */
	exportMappings(): OperationMapping[] {
		return [...this.mappings];
	}

	/**
	 * Import mappings (replaces current mappings)
	 */
	importMappings(mappings: OperationMapping[]): void {
		this.mappings = [];
		this.addMappings(mappings);
	}
}

/**
 * Factory function to create a categorizer with custom mappings
 */
export function createCategorizer(
	mappings?: OperationMapping[],
): TransactionCategorizer {
	return new TransactionCategorizer({
		mappings,
		useDefaults: true,
	});
}
