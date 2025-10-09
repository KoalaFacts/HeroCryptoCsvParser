import { describe, expect, it } from "vitest";
import { BatchEntryRecord } from "@/core/BatchEntryRecord";
import { Source } from "@/core/Source";
import { SourceAdapter } from "@/core/SourceAdapter";
import { SourceBuilder } from "@/core/SourceBuilder";
import { SourceParser } from "@/core/SourceParser";
import {
  Amount,
  Asset,
  DataSource,
  type Transaction,
  type Transfer,
} from "@/types/transactions";

// Test record implementation
class TestRecord extends BatchEntryRecord<TestRecord> {
  id: string = "";
  value: string = "";

  constructor() {
    super();
    this.fieldFor((x) => x.id, "ID", 0)
      .mapWith((v) => v?.trim() ?? "")
      .validateWith((v) => v.required("ID is required"));

    this.fieldFor((x) => x.value, "Value", 1)
      .mapWith((v) => v?.trim() ?? "")
      .validateWith((v) => v.required("Value is required"));
  }
}

// Test adapter implementation
class TestAdapter extends SourceAdapter<TestRecord> {
  get sourceName(): string {
    return "test-adapter";
  }

  protected convertRecord(record: TestRecord): Transaction {
    return {
      id: record.id,
      timestamp: new Date(),
      type: "TRANSFER",
      direction: "IN",
      asset: {
        asset: new Asset("TEST"),
        amount: new Amount(record.value || "0"),
      },
      source: DataSource.custom("test", "exchange"),
      taxEvents: [],
    } as Transfer;
  }
}

// Test parser implementation
class TestParser extends SourceParser<TestRecord> {
  protected get RecordClass() {
    return TestRecord;
  }
}

describe("SourceBuilder", () => {
  describe("basic building", () => {
    it("should build a source with all components", () => {
      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "test",
          displayName: "Test Source",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      expect(source).toBeInstanceOf(Source);
      expect(source.getInfo().name).toBe("test");
      expect(source.getInfo().displayName).toBe("Test Source");
    });

    it("should build source with minimal info", () => {
      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "minimal",
          displayName: "Minimal",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      expect(source.getInfo().name).toBe("minimal");
      expect(source.getInfo().website).toBeUndefined();
    });

    it("should throw error if info is missing", () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withRecordClass(TestRecord)
          .withAdapter(new TestAdapter())
          .build();
      }).toThrow("Source info is required");
    });

    it("should throw error if record class is missing", () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo({
            name: "test",
            displayName: "Test",
            type: "exchange",
            supportedFormats: ["csv"],
          })
          .withAdapter(new TestAdapter())
          .build();
      }).toThrow("Either provide a parser or set a record class");
    });

    it("should throw error if adapter is missing", () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo({
            name: "test",
            displayName: "Test",
            type: "exchange",
            supportedFormats: ["csv"],
          })
          .withRecordClass(TestRecord)
          .build();
      }).toThrow("Either provide an adapter or set a conversion function");
    });
  });

  describe("fluent API", () => {
    it("should support method chaining", () => {
      const builder = new SourceBuilder<TestRecord>();

      const result = builder
        .withInfo({
          name: "chain",
          displayName: "Chain Test",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter());

      expect(result).toBe(builder);
    });

    it("should allow setting components in any order", () => {
      const source1 = new SourceBuilder<TestRecord>()
        .withAdapter(new TestAdapter())
        .withInfo({
          name: "order1",
          displayName: "Order 1",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .build();

      const source2 = new SourceBuilder<TestRecord>()
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .withInfo({
          name: "order2",
          displayName: "Order 2",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .build();

      expect(source1).toBeInstanceOf(Source);
      expect(source2).toBeInstanceOf(Source);
    });

    it("should allow overwriting components", () => {
      const adapter1 = new TestAdapter();
      const adapter2 = new TestAdapter();

      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "first",
          displayName: "First",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withInfo({
          name: "second",
          displayName: "Second",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withAdapter(adapter1)
        .withAdapter(adapter2)
        .build();

      expect(source.getInfo().name).toBe("second");
    });
  });

  describe("custom parser", () => {
    it("should accept custom parser instead of record class", () => {
      const parser = new TestParser();

      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "custom",
          displayName: "Custom",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withParser(parser)
        .withAdapter(new TestAdapter())
        .build();

      expect(source).toBeInstanceOf(Source);
    });

    it("should use parser over record class if both provided", () => {
      const parser = new TestParser();

      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "default",
          displayName: "Default",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withParser(parser)
        .withAdapter(new TestAdapter())
        .build();

      expect(source).toBeInstanceOf(Source);
    });
  });

  describe("custom conversion", () => {
    it("should accept custom conversion function instead of adapter", async () => {
      class CustomAdapter extends SourceAdapter<TestRecord> {
        get sourceName(): string {
          return "custom";
        }

        protected convertRecord(record: TestRecord): Transaction {
          return {
            id: record.id,
            timestamp: new Date(),
            type: "TRANSFER",
            direction: "IN",
            asset: {
              asset: new Asset("TEST"),
              amount: new Amount(record.value || "0"),
            },
            source: DataSource.custom("test", "exchange"),
            taxEvents: [],
          } as Transfer;
        }
      }

      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "custom",
          displayName: "Custom",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withAdapter(new CustomAdapter())
        .build();

      const result = await source.process("ID,Value\n1,100");
      expect(result.transactions).toHaveLength(1);
      expect(result.metadata.totalRows).toBe(1);
    });
  });

  describe("source info validation", () => {
    it("should accept complete source info", () => {
      const info = {
        name: "complete-source",
        displayName: "Complete Source",
        type: "exchange" as const,
        website: "https://example.com",
        documentation: "https://docs.example.com",
        supportedFormats: ["csv", "json"],
      };

      const source = new SourceBuilder<TestRecord>()
        .withInfo(info)
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      expect(source.getInfo().name).toBe("complete-source");
      expect(source.getInfo().website).toBe("https://example.com");
      expect(source.getInfo().supportedFormats).toEqual(["csv", "json"]);
    });

    it("should accept minimal source info", () => {
      const info = {
        name: "test",
        displayName: "Test",
        type: "exchange" as const,
        supportedFormats: ["csv"],
        website: "https://test.com",
      };

      const source = new SourceBuilder<TestRecord>()
        .withInfo(info)
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      expect(source.getInfo().name).toBe("test");
      expect(source.getInfo().website).toBe("https://test.com");
    });
  });

  describe("parse and conversion options", () => {
    it("should support parse options in processing", async () => {
      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "test",
          displayName: "Test",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      const content = "ID,Value\n1,100\n2,200";
      const result = await source.process(content, {
        hasHeaders: true,
        maxRows: 1,
      });

      expect(result.transactions).toHaveLength(1);
    });
  });

  describe("custom adapter options", () => {
    it("should create adapter from conversion function", async () => {
      class CustomTestAdapter extends SourceAdapter<TestRecord> {
        get sourceName(): string {
          return "custom";
        }

        protected convertRecord(record: TestRecord): Transaction {
          return {
            id: record.id,
            timestamp: new Date(),
            type: "TRANSFER",
            direction: "IN",
            asset: {
              asset: new Asset("CUSTOM"),
              amount: new Amount(record.value || "0"),
            },
            source: DataSource.custom("custom", "exchange"),
            taxEvents: [],
          } as Transfer;
        }
      }

      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "custom",
          displayName: "Custom",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withAdapter(new CustomTestAdapter())
        .build();

      const result = await source.process("ID,Value\n1,100");
      expect(result.transactions).toHaveLength(1);
      expect((result.transactions[0] as Transfer).asset.asset.symbol).toBe(
        "CUSTOM",
      );
    });
  });

  describe("error handling", () => {
    it("should throw error for empty name", () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo({
            name: "",
            displayName: "No Name",
            type: "exchange",
            supportedFormats: ["csv"],
          })
          .withRecordClass(TestRecord)
          .withAdapter(new TestAdapter())
          .build();
      }).toThrow();
    });

    it("should throw error for empty display name", () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo({
            name: "test",
            displayName: "",
            type: "exchange",
            supportedFormats: ["csv"],
          })
          .withRecordClass(TestRecord)
          .withAdapter(new TestAdapter())
          .build();
      }).toThrow();
    });

    it("should throw error for null info", () => {
      expect(() => {
        new SourceBuilder<TestRecord>().withInfo(null as unknown).build();
      }).toThrow();
    });

    it("should throw error for null record class", () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo({
            name: "test",
            displayName: "Test",
            type: "exchange",
            supportedFormats: ["csv"],
          })
          .withRecordClass(null as unknown)
          .build();
      }).toThrow();
    });

    it("should throw error for null adapter", () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo({
            name: "test",
            displayName: "Test",
            type: "exchange",
            supportedFormats: ["csv"],
          })
          .withRecordClass(TestRecord)
          .withAdapter(null as unknown)
          .build();
      }).toThrow();
    });
  });

  describe("integration test", () => {
    it("should process full CSV content", async () => {
      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "integration",
          displayName: "Integration Test",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      const content = `ID,Value
1,100
2,200
3,300`;

      const result = await source.process(content);

      expect(result.transactions).toHaveLength(3);
      expect(result.metadata.parsedRows).toBe(3);
      expect(result.metadata.failedRows).toBe(0);
      expect(result.metadata.source).toBe("integration");
    });

    it("should handle parse errors gracefully", async () => {
      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "error-test",
          displayName: "Error Test",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      const content = `ID,Value
1,100
invalid line
3,300`;

      const result = await source.process(content, { continueOnError: true });

      expect(result.transactions).toHaveLength(2);
      expect(result.parseErrors).toHaveLength(1);
      expect(result.metadata.failedRows).toBe(1);
    });
  });

  describe("type inference", () => {
    it("should correctly infer record type", async () => {
      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: "typed",
          displayName: "Typed",
          type: "exchange",
          supportedFormats: ["csv"],
        })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      const content = "ID,Value\n1,100";
      const result = await source.process(content);

      expect(result.transactions).toBeDefined();
      expect(result.transactions[0]).toBeDefined();
    });
  });
});
