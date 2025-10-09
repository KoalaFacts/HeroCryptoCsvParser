import { describe, expect, it } from "vitest";
import { BatchEntryRecord } from "@/core/BatchEntryRecord";
import { Source } from "@/core/Source";
import { SourceAdapter } from "@/core/SourceAdapter";
import { SourceParser } from "@/core/SourceParser";
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
  value: string = "";

  constructor() {
    super();
    this.fieldFor((r) => r.id, "ID", 0).validateWith((v) =>
      v.required("ID is required"),
    );
    this.fieldFor((r) => r.value, "Value", 1).validateWith((v) =>
      v.required("Value is required"),
    );
  }
}

// Test parser
class TestParser extends SourceParser<TestRecord> {
  protected get RecordClass() {
    return TestRecord;
  }
}

// Test adapter
class TestAdapter extends SourceAdapter<TestRecord> {
  get sourceName() {
    return "test";
  }

  protected convertRecord(record: TestRecord): Transaction {
    const trade: SpotTrade = {
      type: "SPOT_TRADE",
      id: record.id,
      timestamp: new Date("2024-01-01"),
      source: DataSource.BINANCE,
      taxEvents: [],
      baseAsset: {
        asset: new Asset("TEST"),
        amount: new Amount("1"),
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

describe("Source", () => {
  const sourceInfo = {
    name: "test",
    displayName: "Test Source",
    type: "exchange" as const,
    supportedFormats: ["csv"],
  };

  const parser = new TestParser();
  const adapter = new TestAdapter();
  const source = new Source(sourceInfo, parser, adapter);

  describe("getInfo", () => {
    it("should return source info", () => {
      const info = source.getInfo();

      expect(info.name).toBe("test");
      expect(info.displayName).toBe("Test Source");
      expect(info.type).toBe("exchange");
    });
  });

  describe("process", () => {
    it("should process content end-to-end", async () => {
      const content = `ID,Value
1,Test1
2,Test2`;

      const result = await source.process(content);

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].id).toBe("1");
      expect(result.parseErrors).toHaveLength(0);
      expect(result.metadata.source).toBe("test");
      expect(result.metadata.totalRows).toBe(2);
      expect(result.metadata.parsedRows).toBe(2);
    });

    it("should handle parse errors", async () => {
      const content = `ID,Value
1
2,Test2`;

      const result = await source.process(content, { continueOnError: true });

      expect(result.transactions).toHaveLength(1);
      expect(result.parseErrors).toHaveLength(1);
      expect(result.parseErrors[0].row).toBe(2);
    });

    it("should pass options through pipeline", async () => {
      const content = `ID,Value
skip1,skip2
skip2,skip2  
1,Test1
2,Test2
3,Test3`;

      const result = await source.process(content, {
        skipRows: 2, // Skip 2 rows after header
        maxRows: 2, // Then take only 2 rows
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].id).toBe("1");
    });

    it("should merge metadata from parser and adapter", async () => {
      const content = `ID,Value
1,Test1
2,Test2`;

      const result = await source.process(content);

      // From parser
      expect(result.metadata.totalRows).toBe(2);
      expect(result.metadata.parsedRows).toBe(2);
      expect(result.metadata.failedRows).toBe(0);

      // From adapter
      expect(result.metadata.startDate).toBeDefined();
      expect(result.metadata.uniqueAssets).toContain("TEST");
      expect(result.metadata.transactionTypes?.SPOT_TRADE).toBe(2);
    });
  });

  describe("parse", () => {
    it("should parse content without conversion", () => {
      const content = `ID,Value
1,Test1
2,Test2`;

      const result = source.parse(content);

      expect(result.records).toHaveLength(2);
      expect(result.records[0].id).toBe("1");
      expect(result.records[0].value).toBe("Test1");
    });
  });

  describe("convert", () => {
    it("should convert records without parsing", () => {
      const records = [
        Object.assign(new TestRecord(), { id: "1", value: "Test1" }),
        Object.assign(new TestRecord(), { id: "2", value: "Test2" }),
      ];

      const result = source.convert(records);

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].id).toBe("1");
    });
  });
});
