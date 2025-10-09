import { buildSource } from "../../core/SourceBuilder";
import { BinanceAdapter } from "./BinanceAdapter";
import { BinanceTransactionRecord } from "./BinanceTransactionRecord";

/**
 * Build and export the Binance source
 */
export const BinanceSource = buildSource<BinanceTransactionRecord>()
	.withInfo({
		name: "binance",
		displayName: "Binance",
		type: "exchange",
		supportedFormats: ["csv"],
		website: "https://www.binance.com",
		documentation: "https://www.binance.com/en/support/faq",
	})
	.withRecordClass(BinanceTransactionRecord)
	.withAdapter(new BinanceAdapter())
	.build();

export { BinanceAdapter } from "./BinanceAdapter";
export { BinanceParser } from "./BinanceParser";
export {
	BinanceTransactionCategorizer,
	createBinanceCategorizer,
} from "./BinanceTransactionCategorizer";
// Re-export components for advanced usage
export { BinanceTransactionRecord } from "./BinanceTransactionRecord";
