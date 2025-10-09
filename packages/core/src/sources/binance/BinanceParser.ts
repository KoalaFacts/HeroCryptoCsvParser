import { SourceParser } from "../../core/SourceParser";
import { BinanceTransactionRecord } from "./BinanceTransactionRecord";

/**
 * Parses Binance source data into BinanceTransactionRecord objects
 */
export class BinanceParser extends SourceParser<BinanceTransactionRecord> {
  protected get RecordClass() {
    return BinanceTransactionRecord;
  }
}
