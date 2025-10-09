import { describe, expect, it } from "vitest";
import { BatchEntryRecord } from "@/core/BatchEntryRecord";
import { FieldValidatorContext } from "@/core/FieldContext";
import { FieldValidationBuilder } from "@/core/FieldValidationBuilder";

// Test record
class TestRecord extends BatchEntryRecord<TestRecord> {
	value: any = "";

	constructor() {
		super();
	}
}

describe("FieldValidationBuilder", () => {
	describe("required validation", () => {
		it("should validate required fields", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.required("Field is required").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", "", record);
			const result1 = validator(context1);
			expect(result1.isValid).toBe(false);
			expect(result1.errors[0].message).toBe("Field is required");

			const context2 = new FieldValidatorContext("testField", "value", record);
			const result2 = validator(context2);
			expect(result2.isValid).toBe(true);
		});

		it("should handle null and undefined", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.required("Required").build();
			const record = new TestRecord();

			const contextNull = new FieldValidatorContext("testField", null, record);
			const contextUndefined = new FieldValidatorContext(
				"testField",
				undefined,
				record,
			);
			const contextEmpty = new FieldValidatorContext("testField", "", record);
			const contextSpaces = new FieldValidatorContext(
				"testField",
				"  ",
				record,
			);

			expect(validator(contextNull).isValid).toBe(false);
			expect(validator(contextUndefined).isValid).toBe(false);
			expect(validator(contextEmpty).isValid).toBe(false);
			expect(validator(contextSpaces).isValid).toBe(true); // Spaces are not considered empty by required
		});
	});

	describe("notNull validation", () => {
		it("should validate not null", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.notNull("Cannot be null").build();
			const record = new TestRecord();

			const contextNull = new FieldValidatorContext("testField", null, record);
			const contextValue = new FieldValidatorContext(
				"testField",
				"value",
				record,
			);
			const contextEmpty = new FieldValidatorContext("testField", "", record);

			expect(validator(contextNull).isValid).toBe(false);
			expect(validator(contextValue).isValid).toBe(true);
			expect(validator(contextEmpty).isValid).toBe(true); // Empty string is not null
		});
	});

	describe("equal/notEqual validation", () => {
		it("should validate equal", () => {
			const builder = new FieldValidationBuilder<TestRecord, string>(
				"testField",
			);
			const validator = builder
				.equal("expected", "Must equal expected")
				.build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext(
				"testField",
				"expected",
				record,
			);
			const context2 = new FieldValidatorContext("testField", "other", record);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(false);
		});

		it("should validate notEqual", () => {
			const builder = new FieldValidationBuilder<TestRecord, string>(
				"testField",
			);
			const validator = builder
				.notEqual("forbidden", "Cannot be forbidden")
				.build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext(
				"testField",
				"forbidden",
				record,
			);
			const context2 = new FieldValidatorContext(
				"testField",
				"allowed",
				record,
			);

			expect(validator(context1).isValid).toBe(false);
			expect(validator(context2).isValid).toBe(true);
		});
	});

	describe("notEmpty validation", () => {
		it("should validate not empty", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.notEmpty("Cannot be empty").build();
			const record = new TestRecord();

			const contextEmpty = new FieldValidatorContext("testField", "", record);
			const contextSpaces = new FieldValidatorContext(
				"testField",
				"  ",
				record,
			);
			const contextValue = new FieldValidatorContext(
				"testField",
				"value",
				record,
			);
			const contextEmptyArray = new FieldValidatorContext(
				"testField",
				[],
				record,
			);
			const contextFilledArray = new FieldValidatorContext(
				"testField",
				[1],
				record,
			);

			expect(validator(contextEmpty).isValid).toBe(false);
			expect(validator(contextSpaces).isValid).toBe(false);
			expect(validator(contextValue).isValid).toBe(true);
			expect(validator(contextEmptyArray).isValid).toBe(false);
			expect(validator(contextFilledArray).isValid).toBe(true);
		});
	});

	describe("regex validation", () => {
		it("should validate regex patterns", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder
				.regex(/^\d{3}-\d{3}-\d{4}$/, "Invalid phone")
				.build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext(
				"testField",
				"123-456-7890",
				record,
			);
			const context2 = new FieldValidatorContext(
				"testField",
				"1234567890",
				record,
			);
			const context3 = new FieldValidatorContext(
				"testField",
				"123-456-789",
				record,
			);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(false);
			expect(validator(context3).isValid).toBe(false);
		});

		it("should handle string patterns", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.regex("^[A-Z]+$", "Must be uppercase").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", "ABC", record);
			const context2 = new FieldValidatorContext("testField", "abc", record);
			const context3 = new FieldValidatorContext("testField", "AbC", record);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(false);
			expect(validator(context3).isValid).toBe(false);
		});
	});

	describe("length validations", () => {
		it("should validate minimum length", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.minLength(3, "Too short").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", "abc", record);
			const context2 = new FieldValidatorContext("testField", "abcd", record);
			const context3 = new FieldValidatorContext("testField", "ab", record);
			const context4 = new FieldValidatorContext("testField", "", record);
			const context5 = new FieldValidatorContext(
				"testField",
				[1, 2, 3],
				record,
			);
			const context6 = new FieldValidatorContext("testField", [1], record);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(true);
			expect(validator(context3).isValid).toBe(false);
			expect(validator(context4).isValid).toBe(false);
			expect(validator(context5).isValid).toBe(true);
			expect(validator(context6).isValid).toBe(false);
		});

		it("should validate maximum length", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.maxLength(5, "Too long").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", "abc", record);
			const context2 = new FieldValidatorContext("testField", "abcde", record);
			const context3 = new FieldValidatorContext("testField", "abcdef", record);
			const context4 = new FieldValidatorContext(
				"testField",
				[1, 2, 3],
				record,
			);
			const context5 = new FieldValidatorContext(
				"testField",
				[1, 2, 3, 4, 5, 6],
				record,
			);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(true);
			expect(validator(context3).isValid).toBe(false);
			expect(validator(context4).isValid).toBe(true);
			expect(validator(context5).isValid).toBe(false);
		});

		it("should validate exact length", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.exactLength(4, "Must be exactly 4").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", "abcd", record);
			const context2 = new FieldValidatorContext("testField", "abc", record);
			const context3 = new FieldValidatorContext("testField", "abcde", record);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(false);
			expect(validator(context3).isValid).toBe(false);
		});

		it("should handle null/undefined gracefully for length", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.minLength(3, "Too short").build();
			const record = new TestRecord();

			const contextNull = new FieldValidatorContext("testField", null, record);
			const contextUndefined = new FieldValidatorContext(
				"testField",
				undefined,
				record,
			);

			// Null/undefined should pass if not required
			expect(validator(contextNull).isValid).toBe(true);
			expect(validator(contextUndefined).isValid).toBe(true);
		});
	});

	describe("numeric validations", () => {
		it("should validate minimum value", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.min(5, "Too small").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", 10, record);
			const context2 = new FieldValidatorContext("testField", 5, record);
			const context3 = new FieldValidatorContext("testField", 4, record);
			const context4 = new FieldValidatorContext("testField", "10", record);
			const context5 = new FieldValidatorContext("testField", "3", record);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(true);
			expect(validator(context3).isValid).toBe(false);
			expect(validator(context4).isValid).toBe(true);
			expect(validator(context5).isValid).toBe(false);
		});

		it("should validate maximum value", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.max(100, "Too large").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", 50, record);
			const context2 = new FieldValidatorContext("testField", 100, record);
			const context3 = new FieldValidatorContext("testField", 101, record);
			const context4 = new FieldValidatorContext("testField", "50", record);
			const context5 = new FieldValidatorContext("testField", "200", record);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(true);
			expect(validator(context3).isValid).toBe(false);
			expect(validator(context4).isValid).toBe(true);
			expect(validator(context5).isValid).toBe(false);
		});

		it("should validate range", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.range(5, 10, "Out of range").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", 4, record);
			const context2 = new FieldValidatorContext("testField", 5, record);
			const context3 = new FieldValidatorContext("testField", 7, record);
			const context4 = new FieldValidatorContext("testField", 10, record);
			const context5 = new FieldValidatorContext("testField", 11, record);

			expect(validator(context1).isValid).toBe(false);
			expect(validator(context2).isValid).toBe(true);
			expect(validator(context3).isValid).toBe(true);
			expect(validator(context4).isValid).toBe(true);
			expect(validator(context5).isValid).toBe(false);
		});

		it("should handle non-numeric values", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.min(5, "Too small").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", "abc", record);
			const context2 = new FieldValidatorContext("testField", {}, record);
			const context3 = new FieldValidatorContext("testField", [], record);

			expect(validator(context1).isValid).toBe(false);
			expect(validator(context2).isValid).toBe(false);
			expect(validator(context3).isValid).toBe(false);
		});
	});

	describe("oneOf validation", () => {
		it("should validate value is in allowed list", () => {
			const builder = new FieldValidationBuilder<TestRecord, string>(
				"testField",
			);
			const validator = builder
				.oneOf(["red", "green", "blue"], "Invalid color")
				.build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", "red", record);
			const context2 = new FieldValidatorContext("testField", "green", record);
			const context3 = new FieldValidatorContext("testField", "yellow", record);
			const context4 = new FieldValidatorContext("testField", "", record);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(true);
			expect(validator(context3).isValid).toBe(false);
			expect(validator(context4).isValid).toBe(false);
		});

		it("should work with numeric values", () => {
			const builder = new FieldValidationBuilder<TestRecord, number>(
				"testField",
			);
			const validator = builder.oneOf([1, 2, 3], "Invalid number").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", 1, record);
			const context2 = new FieldValidatorContext("testField", 4, record);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(false);
		});
	});

	describe("chaining validations", () => {
		it("should chain multiple validations", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder
				.required("Required")
				.minLength(5, "Too short")
				.maxLength(10, "Too long")
				.build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", "", record);
			const result1 = validator(context1);
			expect(result1.isValid).toBe(false);
			expect(result1.errors[0].message).toBe("Required");

			const context2 = new FieldValidatorContext("testField", "abc", record);
			const result2 = validator(context2);
			expect(result2.isValid).toBe(false);
			expect(result2.errors[0].message).toBe("Too short");

			const context3 = new FieldValidatorContext(
				"testField",
				"abcdefghijk",
				record,
			);
			const result3 = validator(context3);
			expect(result3.isValid).toBe(false);
			expect(result3.errors[0].message).toBe("Too long");

			const context4 = new FieldValidatorContext(
				"testField",
				"perfect",
				record,
			);
			const result4 = validator(context4);
			expect(result4.isValid).toBe(true);
		});

		it("should collect all validation errors", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder
				.min(10, "Too small")
				.max(5, "Too large") // Intentionally impossible
				.build();
			const record = new TestRecord();

			const context = new FieldValidatorContext("testField", 7, record);
			const result = validator(context);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(2);
		});
	});

	describe("conditional validation", () => {
		it("should handle conditional validation with when", () => {
			const builder = new FieldValidationBuilder<TestRecord, string>(
				"testField",
			);
			const validator = builder
				.when(
					(_record, value) => value === "special",
					(b) => b.minLength(10, "Special values must be long"),
				)
				.build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext(
				"testField",
				"special",
				record,
			);
			const result1 = validator(context1);
			expect(result1.isValid).toBe(false);

			const context2 = new FieldValidatorContext(
				"testField",
				"special_long_value",
				record,
			);
			const result2 = validator(context2);
			expect(result2.isValid).toBe(true);

			const context3 = new FieldValidatorContext("testField", "normal", record);
			const result3 = validator(context3);
			expect(result3.isValid).toBe(true);
		});

		it("should handle conditional validation with unless", () => {
			const builder = new FieldValidationBuilder<TestRecord, string>(
				"testField",
			);
			const validator = builder
				.unless(
					(_record, value) => value === "exempt",
					(b) => b.minLength(5, "Must be at least 5 chars unless exempt"),
				)
				.build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", "exempt", record);
			const result1 = validator(context1);
			expect(result1.isValid).toBe(true);

			const context2 = new FieldValidatorContext("testField", "abc", record);
			const result2 = validator(context2);
			expect(result2.isValid).toBe(false);

			const context3 = new FieldValidatorContext("testField", "valid", record);
			const result3 = validator(context3);
			expect(result3.isValid).toBe(true);
		});

		it("should handle empty values correctly", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");

			// Not required, so empty should pass
			const validator1 = builder.minLength(5, "Too short").build();
			const record = new TestRecord();
			const context1 = new FieldValidatorContext("testField", "", record);
			expect(validator1(context1).isValid).toBe(false); // Empty string has length 0

			// Required, so empty should fail
			const builder2 = new FieldValidationBuilder<TestRecord>("testField");
			const validator2 = builder2
				.required("Required")
				.minLength(5, "Too short")
				.build();
			const context2 = new FieldValidatorContext("testField", "", record);
			expect(validator2(context2).isValid).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should handle special characters", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.required("Required").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", "\\n\\t", record);
			const context2 = new FieldValidatorContext("testField", "🚀", record);
			const context3 = new FieldValidatorContext("testField", "null", record);
			const context4 = new FieldValidatorContext(
				"testField",
				"undefined",
				record,
			);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(true);
			expect(validator(context3).isValid).toBe(true);
			expect(validator(context4).isValid).toBe(true);
		});

		it("should handle very long strings", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.maxLength(10, "Too long").build();
			const record = new TestRecord();

			const longString = "a".repeat(1000);
			const context = new FieldValidatorContext(
				"testField",
				longString,
				record,
			);
			expect(validator(context).isValid).toBe(false);
		});

		it("should handle numeric edge cases", () => {
			const builder = new FieldValidationBuilder<TestRecord>("testField");
			const validator = builder.min(0, "Must be positive").build();
			const record = new TestRecord();

			const context1 = new FieldValidatorContext("testField", 0, record);
			const context2 = new FieldValidatorContext("testField", -0, record);
			const context3 = new FieldValidatorContext("testField", Infinity, record);
			const context4 = new FieldValidatorContext(
				"testField",
				-Infinity,
				record,
			);
			const context5 = new FieldValidatorContext("testField", NaN, record);

			expect(validator(context1).isValid).toBe(true);
			expect(validator(context2).isValid).toBe(true);
			expect(validator(context3).isValid).toBe(true);
			expect(validator(context4).isValid).toBe(false);
			expect(validator(context5).isValid).toBe(false);
		});
	});
});
