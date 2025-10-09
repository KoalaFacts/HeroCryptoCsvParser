import { describe, expect, it } from "vitest";
import { BatchEntryRecord } from "@/core/BatchEntryRecord";
import { type ConversionOptions, SourceAdapter } from "@/core/SourceAdapter";
import {
  Amount,
  Asset,
  DataSource,
  type SpotTrade,
  type Transaction,
} from "@/types/transactions";

// Test record
class TestRecord extends BatchEntryRecord<TestRecord> {
  id: string = "";
  asset: string = "";
  amount: string = "";
  timestamp: string = "";

  constructor() {
    super();
    this.fieldFor((r) => r.id, "ID", 0);
    this.fieldFor((r) => r.asset, "Asset", 1);
    this.fieldFor((r) => r.amount, "Amount", 2);
    this.fieldFor((r) => r.timestamp, "Timestamp", 3);
  }
}

// Test adapter implementation
class TestAdapter extends SourceAdapter<TestRecord> {
  get sourceName() {
    return "test-source";
  }

  protected convertRecord(
    record: TestRecord,
    _options?: ConversionOptions,
  ): Transaction {
    const trade: SpotTrade = {
      type: "SPOT_TRADE",
      id: `test-${record.id}`,
      timestamp: new Date(record.timestamp),
      source: DataSource.BINANCE,
      taxEvents: [],
      baseAsset: {
        asset: new Asset(record.asset),
        amount: new Amount(record.amount),
      },
      quoteAsset: {
        asset: new Asset("USDT"),
        amount: new Amount("100"),
      },
      side: "BUY",
      price: "100",
    };
    return trade;
  }
}

describe("SourceAdapter", () => {
  const adapter = new TestAdapter();

  describe("convert", () => {
    it("should convert records to transactions", () => {
      const records: TestRecord[] = [
        Object.assign(new TestRecord(), {
          id: "1",
          asset: "BTC",
          amount: "0.5",
          timestamp: "2024-01-01T00:00:00Z",
        }),
        Object.assign(new TestRecord(), {
          id: "2",
          asset: "ETH",
          amount: "2.5",
          timestamp: "2024-01-02T00:00:00Z",
        }),
      ];

      const result = adapter.convert(records);

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].id).toBe("test-1");
      expect((result.transactions[0] as SpotTrade).baseAsset.asset.symbol).toBe(
        "BTC",
      );
      expect(result.warnings).toHaveLength(0);
      expect(result.metadata.source).toBe("test-source");
    });

    it("should handle conversion errors gracefully", () => {
      // Create an adapter that throws an error
      class ErrorAdapter extends TestAdapter {
        protected convertRecord(record: TestRecord): Transaction {
          if (record.id === "error") {
            throw new Error("Conversion failed");
          }
          return super.convertRecord(record);
        }
      }

      const errorAdapter = new ErrorAdapter();
      const records: TestRecord[] = [
        Object.assign(new TestRecord(), {
          id: "error",
          asset: "BTC",
          amount: "0.5",
          timestamp: "2024-01-01T00:00:00Z",
        }),
      ];

      const result = errorAdapter.convert(records);

      expect(result.transactions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("Failed to convert record");
    });
  });

  describe("metadata calculation", () => {
    it("should calculate date range", () => {
      const records: TestRecord[] = [
        Object.assign(new TestRecord(), {
          id: "1",
          asset: "BTC",
          amount: "0.5",
          timestamp: "2024-01-01T00:00:00Z",
        }),
        Object.assign(new TestRecord(), {
          id: "2",
          asset: "ETH",
          amount: "2.5",
          timestamp: "2024-01-15T00:00:00Z",
        }),
        Object.assign(new TestRecord(), {
          id: "3",
          asset: "BTC",
          amount: "1.0",
          timestamp: "2024-01-07T00:00:00Z",
        }),
      ];

      const result = adapter.convert(records);

      expect(result.metadata.startDate).toEqual(
        new Date("2024-01-01T00:00:00Z"),
      );
      expect(result.metadata.endDate).toEqual(new Date("2024-01-15T00:00:00Z"));
    });

    it("should extract unique assets", () => {
      const records: TestRecord[] = [
        Object.assign(new TestRecord(), {
          id: "1",
          asset: "BTC",
          amount: "0.5",
          timestamp: "2024-01-01T00:00:00Z",
        }),
        Object.assign(new TestRecord(), {
          id: "2",
          asset: "ETH",
          amount: "2.5",
          timestamp: "2024-01-02T00:00:00Z",
        }),
        Object.assign(new TestRecord(), {
          id: "3",
          asset: "BTC",
          amount: "1.0",
          timestamp: "2024-01-03T00:00:00Z",
        }),
      ];

      const result = adapter.convert(records);

      expect(result.metadata.uniqueAssets).toEqual(["BTC", "ETH", "USDT"]);
    });

    it("should count transaction types", () => {
      const records: TestRecord[] = [
        Object.assign(new TestRecord(), {
          id: "1",
          asset: "BTC",
          amount: "0.5",
          timestamp: "2024-01-01T00:00:00Z",
        }),
        Object.assign(new TestRecord(), {
          id: "2",
          asset: "ETH",
          amount: "2.5",
          timestamp: "2024-01-02T00:00:00Z",
        }),
      ];

      const result = adapter.convert(records);

      expect(result.metadata.transactionTypes).toEqual({
        SPOT_TRADE: 2,
      });
    });
  });

  describe("postProcess", () => {
    it("should allow post-processing override", () => {
      class CustomAdapter extends TestAdapter {
        protected postProcess(transactions: Transaction[]): Transaction[] {
          // Filter out small amounts
          return transactions.filter((t) => {
            if (t.type === "SPOT_TRADE") {
              const trade = t as SpotTrade;
              return trade.baseAsset.amount.isGreaterThan("1.0");
            }
            return true;
          });
        }
      }

      const customAdapter = new CustomAdapter();
      const records: TestRecord[] = [
        Object.assign(new TestRecord(), {
          id: "1",
          asset: "BTC",
          amount: "0.5",
          timestamp: "2024-01-01T00:00:00Z",
        }),
        Object.assign(new TestRecord(), {
          id: "2",
          asset: "ETH",
          amount: "2.5",
          timestamp: "2024-01-02T00:00:00Z",
        }),
      ];

      const result = customAdapter.convert(records);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].id).toBe("test-2");
    });
  });
});
