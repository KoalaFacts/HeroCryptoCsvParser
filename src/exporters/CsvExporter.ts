import type {
	Airdrop,
	Fee,
	Interest,
	LiquidityAdd,
	LiquidityRemove,
	SpotTrade,
	StakingDeposit,
	StakingReward,
	StakingWithdrawal,
	Swap,
	Transaction,
	TransactionType,
	Transfer,
} from "../types/transactions";

/**
 * CSV export options
 */
export interface CsvExportOptions {
	/** Include headers in CSV */
	includeHeaders?: boolean;
	/** Date format (default: ISO string) */
	dateFormat?: "iso" | "unix" | "utc" | ((date: Date) => string);
	/** Fields to include */
	fields?: string[];
	/** Delimiter (default: comma) */
	delimiter?: string;
	/** Quote character (default: double quote) */
	quote?: string;
	/** Line ending (default: \n) */
	lineEnding?: string;
	/** Include original data columns */
	includeOriginalData?: boolean;
}

/**
 * CSV row structure for transactions
 */
export interface CsvRow {
	id: string;
	timestamp: string;
	type: TransactionType;
	source: string;

	// Common asset fields
	asset?: string;
	amount?: string;

	// Trading fields
	baseAsset?: string;
	baseAmount?: string;
	quoteAsset?: string;
	quoteAmount?: string;
	side?: string;
	price?: string;

	// Transfer fields
	direction?: string;
	transferType?: string;
	from?: string;
	to?: string;

	// Fee fields
	feeAsset?: string;
	feeAmount?: string;
	feeType?: string;

	// Staking fields
	stakingProtocol?: string;
	stakingAPR?: string;
	lockupPeriod?: string;

	// Interest fields
	interestType?: string;
	interestRate?: string;

	// Swap fields
	fromAsset?: string;
	fromAmount?: string;
	toAsset?: string;
	toAmount?: string;

	// Liquidity fields
	poolName?: string;
	lpTokens?: string;

	// Other fields
	description?: string;
	relatedTransactionId?: string;
	taxable?: boolean;

	// Original data (JSON string)
	originalData?: string;
}

/**
 * Exports transactions to CSV format
 */
export class CsvExporter {
	private options: Required<CsvExportOptions>;

	constructor(options?: CsvExportOptions) {
		this.options = {
			includeHeaders: options?.includeHeaders ?? true,
			dateFormat: options?.dateFormat ?? "iso",
			fields: options?.fields ?? this.getDefaultFields(),
			delimiter: options?.delimiter ?? ",",
			quote: options?.quote ?? '"',
			lineEnding: options?.lineEnding ?? "\n",
			includeOriginalData: options?.includeOriginalData ?? false,
		};
	}

	/**
	 * Export transactions to CSV string
	 */
	export(transactions: Transaction[]): string {
		const rows = transactions.map((t) => this.transactionToRow(t));
		return this.rowsToCSV(rows);
	}

	/**
	 * Export to CSV with custom row mapper
	 */
	exportWithMapper<T>(
		transactions: Transaction[],
		mapper: (transaction: Transaction) => T,
	): string {
		const rows = transactions.map(mapper);
		return this.rowsToCSV(rows);
	}

	/**
	 * Convert transaction to CSV row
	 */
	private transactionToRow(transaction: Transaction): CsvRow {
		const row: CsvRow = {
			id: transaction.id,
			timestamp: this.formatDate(transaction.timestamp),
			type: transaction.type,
			source: transaction.source.toString(),
		};

		// Add type-specific fields
		switch (transaction.type) {
			case "SPOT_TRADE": {
				const spot = transaction as SpotTrade;
				row.baseAsset = spot.baseAsset.asset.symbol;
				row.baseAmount = spot.baseAsset.amount.toString();
				row.quoteAsset = spot.quoteAsset.asset.symbol;
				row.quoteAmount = spot.quoteAsset.amount.toString();
				row.side = spot.side;
				row.price = spot.price;
				break;
			}

			case "TRANSFER": {
				const transfer = transaction as Transfer;
				row.asset = transfer.asset.asset.symbol;
				row.amount = transfer.asset.amount.toString();
				row.direction = transfer.direction;
				row.transferType = transfer.transferType;
				row.from = this.formatLocation(transfer.from);
				row.to = this.formatLocation(transfer.to);
				break;
			}

			case "FEE": {
				const fee = transaction as Fee;
				row.feeAsset = fee.fee.asset.symbol;
				row.feeAmount = fee.fee.amount.toString();
				row.feeType = fee.feeType;
				row.description = fee.description;
				row.relatedTransactionId = fee.relatedTransactionId;
				break;
			}

			case "STAKING_DEPOSIT": {
				const stakingDeposit = transaction as StakingDeposit;
				row.asset = stakingDeposit.asset.asset.symbol;
				row.amount = stakingDeposit.asset.amount.toString();
				row.stakingProtocol = stakingDeposit.staking.protocol;
				row.stakingAPR = stakingDeposit.staking.apr;
				row.lockupPeriod = stakingDeposit.staking.lockupPeriod?.toString();
				break;
			}

			case "STAKING_WITHDRAWAL": {
				const stakingWithdrawal = transaction as StakingWithdrawal;
				row.asset = stakingWithdrawal.asset.asset.symbol;
				row.amount = stakingWithdrawal.asset.amount.toString();
				row.stakingProtocol = stakingWithdrawal.staking.protocol;
				break;
			}

			case "STAKING_REWARD": {
				const stakingReward = transaction as StakingReward;
				row.asset = stakingReward.reward.asset.symbol;
				row.amount = stakingReward.reward.amount.toString();
				row.stakingProtocol = stakingReward.staking.protocol;
				row.stakingAPR = stakingReward.staking.apr;
				break;
			}

			case "INTEREST": {
				const interest = transaction as Interest;
				row.asset = interest.interest.asset.symbol;
				row.amount = interest.interest.amount.toString();
				row.interestType = interest.interestType;
				row.interestRate = interest.context?.rate;
				row.description =
					`${interest.context?.protocol || ""} ${interest.context?.period || ""}`.trim();
				break;
			}

			case "AIRDROP": {
				const airdrop = transaction as Airdrop;
				row.asset = airdrop.received.asset.symbol;
				row.amount = airdrop.received.amount.toString();
				row.description = `${airdrop.airdrop.project}: ${airdrop.airdrop.reason}`;
				break;
			}

			case "SWAP": {
				const swap = transaction as Swap;
				row.fromAsset = swap.from.asset.symbol;
				row.fromAmount = swap.from.amount.toString();
				row.toAsset = swap.to.asset.symbol;
				row.toAmount = swap.to.amount.toString();
				break;
			}

			case "LIQUIDITY_ADD": {
				const liquidityAdd = transaction as LiquidityAdd;
				row.asset = liquidityAdd.assets.map((a) => a.asset.symbol).join("+");
				row.amount = liquidityAdd.assets
					.map((a) => a.amount.toString())
					.join("+");
				row.lpTokens = `${liquidityAdd.lpTokens.asset.symbol}: ${liquidityAdd.lpTokens.amount.toString()}`;
				row.poolName = liquidityAdd.pool.name;
				break;
			}

			case "LIQUIDITY_REMOVE": {
				const liquidityRemove = transaction as LiquidityRemove;
				row.asset = liquidityRemove.assets.map((a) => a.asset.symbol).join("+");
				row.amount = liquidityRemove.assets
					.map((a) => a.amount.toString())
					.join("+");
				row.lpTokens = `${liquidityRemove.lpTokens.asset.symbol}: ${liquidityRemove.lpTokens.amount.toString()}`;
				row.poolName = liquidityRemove.pool.name;
				break;
			}
		}

		// Add tax events if present
		if (transaction.taxEvents && transaction.taxEvents.length > 0) {
			row.taxable = true;
		}

		// Add original data if requested
		if (this.options.includeOriginalData && "originalData" in transaction) {
			row.originalData = JSON.stringify(transaction.originalData);
		}

		return row;
	}

	/**
	 * Format location for transfers
	 */
	private formatLocation(location?: {
		platform?: string;
		address?: string;
		label?: string;
	}): string {
		if (!location) return "";
		if (location.address) return location.address;
		if (location.label)
			return `${location.platform || "unknown"}:${location.label}`;
		return location.platform || "unknown";
	}

	/**
	 * Format date based on options
	 */
	private formatDate(date: Date): string {
		const format = this.options.dateFormat;
		if (typeof format === "function") {
			return format(date);
		}

		switch (format) {
			case "unix":
				return Math.floor(date.getTime() / 1000).toString();
			case "utc":
				return date.toUTCString();
			case "iso":
			default:
				return date.toISOString();
		}
	}

	/**
	 * Convert rows to CSV string
	 */
	private rowsToCSV(rows: any[]): string {
		if (rows.length === 0) return "";

		const fields =
			this.options.fields.length > 0
				? this.options.fields
				: Object.keys(rows[0]);

		const lines: string[] = [];

		// Add headers
		if (this.options.includeHeaders) {
			lines.push(this.formatCSVLine(fields));
		}

		// Add data rows
		rows.forEach((row) => {
			const values = fields.map((field) => row[field] ?? "");
			lines.push(this.formatCSVLine(values));
		});

		return lines.join(this.options.lineEnding);
	}

	/**
	 * Format a single CSV line
	 */
	private formatCSVLine(values: any[]): string {
		return values
			.map((value) => this.escapeCSVValue(value))
			.join(this.options.delimiter);
	}

	/**
	 * Escape CSV value
	 */
	private escapeCSVValue(value: any): string {
		if (value === null || value === undefined) return "";

		const str = value.toString();
		const needsQuoting =
			str.includes(this.options.delimiter) ||
			str.includes(this.options.quote) ||
			str.includes("\n") ||
			str.includes("\r");

		if (needsQuoting) {
			return `${this.options.quote}${str.replace(new RegExp(this.options.quote, "g"), this.options.quote + this.options.quote)}${this.options.quote}`;
		}

		return str;
	}

	/**
	 * Get default fields for export
	 */
	private getDefaultFields(): string[] {
		return [
			"id",
			"timestamp",
			"type",
			"source",
			"asset",
			"amount",
			"baseAsset",
			"baseAmount",
			"quoteAsset",
			"quoteAmount",
			"side",
			"price",
			"direction",
			"transferType",
			"from",
			"to",
			"feeAsset",
			"feeAmount",
			"feeType",
			"fromAsset",
			"fromAmount",
			"toAsset",
			"toAmount",
			"stakingProtocol",
			"stakingAPR",
			"lockupPeriod",
			"interestType",
			"interestRate",
			"poolName",
			"lpTokens",
			"description",
			"taxable",
		];
	}
}

/**
 * Helper function to export transactions to CSV
 */
export function exportToCSV(
	transactions: Transaction[],
	options?: CsvExportOptions,
): string {
	const exporter = new CsvExporter(options);
	return exporter.export(transactions);
}
