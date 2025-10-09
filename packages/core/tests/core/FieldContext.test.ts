import { describe, expect, it } from "vitest";
import { BatchEntryRecord } from "@/core/BatchEntryRecord";
import {
  FieldFormatterContext,
  FieldGetterContext,
  FieldMapperContext,
  FieldValidatorContext,
} from "@/core/FieldContext";

// Test record for context tests
class TestRecord extends BatchEntryRecord<TestRecord> {
  id: string = "123";
  name: string = "Test Name";
  age: number = 25;
  active: boolean = true;
}

describe("FieldContext", () => {
  describe("FieldGetterContext", () => {
    it("should create getter context with field name and record", () => {
      const record = new TestRecord();
      const context = new FieldGetterContext("TestField", record);

      expect(context.fieldName).toBe("TestField");
      expect(context.record).toBe(record);
    });

    it("should access record properties", () => {
      const record = new TestRecord();
      record.name = "John Doe";
      const context = new FieldGetterContext("Name", record);

      expect(context.record.name).toBe("John Doe");
    });

    it("should handle undefined field name", () => {
      const record = new TestRecord();
      const context = new FieldGetterContext("", record);

      expect(context.fieldName).toBe("");
      expect(context.record).toBeDefined();
    });
  });

  describe("FieldMapperContext", () => {
    it("should create mapper context with all properties", () => {
      const record = new TestRecord();
      const context = new FieldMapperContext("Age", 2, "30", record);

      expect(context.fieldName).toBe("Age");
      expect(context.fieldIndex).toBe(2);
      expect(context.rawValue).toBe("30");
      expect(context.record).toBe(record);
    });

    it("should handle null raw value", () => {
      const record = new TestRecord();
      const context = new FieldMapperContext(
        "Optional",
        3,
        null as any,
        record,
      );

      expect(context.rawValue).toBeNull();
    });

    it("should handle empty string raw value", () => {
      const record = new TestRecord();
      const context = new FieldMapperContext("Empty", 0, "", record);

      expect(context.rawValue).toBe("");
      expect(context.fieldIndex).toBe(0);
    });

    it("should handle special characters in raw value", () => {
      const record = new TestRecord();
      const context = new FieldMapperContext(
        "Special",
        1,
        "Line1\nLine2\t\r\n",
        record,
      );

      expect(context.rawValue).toBe("Line1\nLine2\t\r\n");
    });
  });

  describe("FieldFormatterContext", () => {
    it("should create formatter context", () => {
      const record = new TestRecord();
      const context = new FieldFormatterContext("Name", "John", record);

      expect(context.fieldName).toBe("Name");
      expect(context.currentValue).toBe("John");
      expect(context.record).toBe(record);
    });

    it("should handle numeric values", () => {
      const record = new TestRecord();
      const context = new FieldFormatterContext("Age", 42, record);

      expect(context.currentValue).toBe(42);
    });

    it("should handle boolean values", () => {
      const record = new TestRecord();
      const context = new FieldFormatterContext("Active", true, record);

      expect(context.currentValue).toBe(true);
    });

    it("should handle null and undefined values", () => {
      const record = new TestRecord();
      const context1 = new FieldFormatterContext("Null", null, record);
      const context2 = new FieldFormatterContext(
        "Undefined",
        undefined,
        record,
      );

      expect(context1.currentValue).toBeNull();
      expect(context2.currentValue).toBeUndefined();
    });

    it("should handle complex object values", () => {
      const record = new TestRecord();
      const complexValue = { nested: { value: 123 }, array: [1, 2, 3] };
      const context = new FieldFormatterContext(
        "Complex",
        complexValue,
        record,
      );

      expect(context.currentValue).toEqual(complexValue);
      expect((context.currentValue as any).nested.value).toBe(123);
    });
  });

  describe("FieldValidatorContext", () => {
    it("should create validator context", () => {
      const record = new TestRecord();
      const context = new FieldValidatorContext(
        "Email",
        "test@example.com",
        record,
      );

      expect(context.fieldName).toBe("Email");
      expect(context.currentValue).toBe("test@example.com");
      expect(context.record).toBe(record);
    });

    it("should handle empty values for validation", () => {
      const record = new TestRecord();
      const context = new FieldValidatorContext("Required", "", record);

      expect(context.currentValue).toBe("");
      expect(context.fieldName).toBe("Required");
    });

    it("should handle numeric validation values", () => {
      const record = new TestRecord();
      const context = new FieldValidatorContext("Age", -5, record);

      expect(context.currentValue).toBe(-5);
    });

    it("should handle array values", () => {
      const record = new TestRecord();
      const arrayValue = ["item1", "item2", "item3"];
      const context = new FieldValidatorContext("Items", arrayValue, record);

      expect(context.currentValue).toEqual(arrayValue);
      expect((context.currentValue as string[]).length).toBe(3);
    });

    it("should handle date values", () => {
      const record = new TestRecord();
      const dateValue = new Date("2024-01-15T10:30:00Z");
      const context = new FieldValidatorContext("Date", dateValue, record);

      expect(context.currentValue).toBe(dateValue);
      expect((context.currentValue as Date).getFullYear()).toBe(2024);
    });
  });

  describe("Context inheritance", () => {
    it("should share common properties across contexts", () => {
      const record = new TestRecord();
      const getterCtx = new FieldGetterContext("Field1", record);
      const mapperCtx = new FieldMapperContext("Field2", 0, "value", record);
      const formatterCtx = new FieldFormatterContext(
        "Field3",
        "formatted",
        record,
      );
      const validatorCtx = new FieldValidatorContext(
        "Field4",
        "validate",
        record,
      );

      // All should have fieldName and record
      expect(getterCtx.fieldName).toBeDefined();
      expect(getterCtx.record).toBe(record);

      expect(mapperCtx.fieldName).toBeDefined();
      expect(mapperCtx.record).toBe(record);

      expect(formatterCtx.fieldName).toBeDefined();
      expect(formatterCtx.record).toBe(record);

      expect(validatorCtx.fieldName).toBeDefined();
      expect(validatorCtx.record).toBe(record);
    });
  });

  describe("Edge cases", () => {
    it("should handle very long field names", () => {
      const record = new TestRecord();
      const longName = "a".repeat(1000);
      const context = new FieldGetterContext(longName, record);

      expect(context.fieldName).toHaveLength(1000);
    });

    it("should handle special characters in field names", () => {
      const record = new TestRecord();
      const specialName = "Field!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const context = new FieldGetterContext(specialName, record);

      expect(context.fieldName).toBe(specialName);
    });

    it("should handle unicode in field names and values", () => {
      const record = new TestRecord();
      const unicodeName = "字段名称🚀";
      const unicodeValue = "值😊🌟";
      const context = new FieldMapperContext(
        unicodeName,
        0,
        unicodeValue,
        record,
      );

      expect(context.fieldName).toBe(unicodeName);
      expect(context.rawValue).toBe(unicodeValue);
    });

    it("should handle circular references in record", () => {
      const record = new TestRecord();
      (record as any).circular = record;

      const context = new FieldGetterContext("Circular", record);

      expect(context.record).toBe(record);
      expect((context.record as any).circular).toBe(record);
    });

    it("should handle large field index values", () => {
      const record = new TestRecord();
      const context = new FieldMapperContext(
        "Large",
        Number.MAX_SAFE_INTEGER,
        "value",
        record,
      );

      expect(context.fieldIndex).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle negative field index values", () => {
      const record = new TestRecord();
      const context = new FieldMapperContext("Negative", -1, "value", record);

      expect(context.fieldIndex).toBe(-1);
    });
  });
});
