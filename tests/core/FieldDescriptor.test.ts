import { describe, expect, it } from "vitest";
import { BatchEntryRecord } from "@/core/BatchEntryRecord";
import {
	FieldFormatterContext,
	FieldGetterContext,
	FieldMapperContext,
	FieldValidatorContext,
} from "@/core/FieldContext";
import {
	FieldDefinition,
	FieldDescriptor,
	FieldLocator,
} from "@/core/FieldDescriptor";

// Test record for field descriptor tests
class TestRecord extends BatchEntryRecord<TestRecord> {
	id: string = "";
	name: string = "";
	age: number = 0;
	active: boolean = false;
}

describe("FieldDescriptor", () => {
	describe("basic field definition", () => {
		it("should create field descriptor with definition", () => {
			const definition = new FieldDefinition("Name", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, string>(definition);

			expect(field.definition.name).toBe("Name");
			expect(field.definition.fieldLocator.fieldIndex).toBe(0);
		});

		it("should handle field locator correctly", () => {
			const locator = new FieldLocator(5);
			const definition = new FieldDefinition("ID", locator);
			const field = new FieldDescriptor<TestRecord, string>(definition);

			expect(field.definition.fieldLocator.fieldIndex).toBe(5);
			expect(field.definition.fieldLocator.getOrderingKey()).toBe(5);
			expect(field.definition.fieldLocator.isFixedWidth()).toBe(false);
		});

		it("should handle fixed-width field locator", () => {
			const locator = new FieldLocator(0, 10, 20);
			const definition = new FieldDefinition("FixedField", locator);
			const field = new FieldDescriptor<TestRecord, string>(definition);

			expect(field.definition.fieldLocator.isFixedWidth()).toBe(true);
			expect(field.definition.fieldLocator.getOrderingKey()).toBe(10);
		});
	});

	describe("mapWith", () => {
		it("should map values using mapper function", () => {
			const definition = new FieldDefinition("Age", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, number>(definition);

			field.mapWith((value) => parseInt(value, 10));

			const record = new TestRecord();
			const context = new FieldMapperContext("Age", 0, "25", record);

			// Test internal mapper behavior
			if (field.mapper) {
				const result = field.mapper(context);
				expect(result.isValid).toBe(true);
			}
		});

		it("should handle null/undefined in mapper", () => {
			const definition = new FieldDefinition("Name", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, string>(definition);

			field.mapWith((value) => value || "default");

			const record = new TestRecord();
			const context1 = new FieldMapperContext("Name", 0, "", record);
			const context2 = new FieldMapperContext("Name", 0, null as any, record);

			if (field.mapper) {
				expect(field.mapper(context1).isValid).toBe(true);
				expect(field.mapper(context2).isValid).toBe(true);
			}
		});

		it("should chain multiple mappers", () => {
			const definition = new FieldDefinition("Name", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, string>(definition);

			// Note: chaining mappers replaces the previous mapper
			field
				.mapWith((value) => value.trim())
				.mapWith((value) => value.toUpperCase());

			const record = new TestRecord();
			const context = new FieldMapperContext("Name", 0, "HELLO", record);

			if (field.mapper) {
				const result = field.mapper(context);
				expect(result.isValid).toBe(true);
			}
		});
	});

	describe("validateWith", () => {
		it("should validate using validation builder", () => {
			const definition = new FieldDefinition("ID", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, string>(definition);

			field.validateWith((v) => v.required("ID is required"));

			const record = new TestRecord();
			const context1 = new FieldValidatorContext("ID", "", record);
			const context2 = new FieldValidatorContext("ID", "123", record);

			if (field.validator) {
				const result1 = field.validator(context1);
				expect(result1.isValid).toBe(false);
				expect(result1.errors[0].message).toBe("ID is required");

				const result2 = field.validator(context2);
				expect(result2.isValid).toBe(true);
			}
		});

		it("should handle complex validation chains", () => {
			const definition = new FieldDefinition("Age", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, number>(definition);

			field.validateWith((v) =>
				v
					.required("Age is required")
					.min(0, "Age must be positive")
					.max(150, "Age must be realistic"),
			);

			const record = new TestRecord();

			if (field.validator) {
				const context1 = new FieldValidatorContext("Age", -5, record);
				const result1 = field.validator(context1);
				expect(result1.isValid).toBe(false);

				const context2 = new FieldValidatorContext("Age", 200, record);
				const result2 = field.validator(context2);
				expect(result2.isValid).toBe(false);

				const context3 = new FieldValidatorContext("Age", 25, record);
				const result3 = field.validator(context3);
				expect(result3.isValid).toBe(true);
			}
		});
	});

	describe("formatWith", () => {
		it("should format values for output", () => {
			const definition = new FieldDefinition("Age", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, number>(definition);

			field.formatWith((value) => value?.toString() || "0");

			const record = new TestRecord();
			record.age = 25;

			const context = new FieldFormatterContext("Age", 25, record);

			if (field.formatter) {
				const formatted = field.formatter(context);
				expect(formatted).toBe("25");
			}
		});

		it("should handle null/undefined in formatter", () => {
			const definition = new FieldDefinition("Name", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, string>(definition);

			field.formatWith((value) => value || "N/A");

			const record = new TestRecord();
			const context1 = new FieldFormatterContext("Name", null, record);
			const context2 = new FieldFormatterContext("Name", undefined, record);

			if (field.formatter) {
				expect(field.formatter(context1)).toBe("N/A");
				expect(field.formatter(context2)).toBe("N/A");
			}
		});

		it("should format boolean values", () => {
			const definition = new FieldDefinition("Active", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, boolean>(definition);

			field.formatWith((value) => (value ? "Yes" : "No"));

			const record = new TestRecord();

			if (field.formatter) {
				const context1 = new FieldFormatterContext("Active", true, record);
				expect(field.formatter(context1)).toBe("Yes");

				const context2 = new FieldFormatterContext("Active", false, record);
				expect(field.formatter(context2)).toBe("No");
			}
		});
	});

	describe("fluent chaining", () => {
		it("should support full fluent chain", () => {
			const definition = new FieldDefinition("Name", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, string>(definition);

			const result = field
				.mapWith((value) => value.trim())
				.validateWith((v) => v.required("Required").minLength(3, "Too short"))
				.formatWith((value) => value.toUpperCase());

			// Check that chaining returns the same instance
			expect(result).toBe(field);
		});
	});

	describe("field types", () => {
		it("should handle string fields", () => {
			const definition = new FieldDefinition("Name", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, string>(definition);

			field.mapWith((value) => value.toLowerCase());
			field.setWith((ctx, value) => {
				ctx.record.name = value;
			});

			const record = new TestRecord();
			const context = new FieldMapperContext("Name", 0, "HELLO", record);

			if (field.mapper) {
				const result = field.mapper(context);
				expect(result.isValid).toBe(true);
				expect(record.name).toBe("hello");
			}
		});

		it("should handle number fields", () => {
			const definition = new FieldDefinition("Age", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, number>(definition);

			field.mapWith((value) => Math.round(parseFloat(value)));
			field.setWith((ctx, value) => {
				ctx.record.age = value;
			});

			const record = new TestRecord();
			const context = new FieldMapperContext("Age", 0, "25.7", record);

			if (field.mapper) {
				const result = field.mapper(context);
				expect(result.isValid).toBe(true);
				expect(record.age).toBe(26);
			}
		});

		it("should handle boolean fields", () => {
			const definition = new FieldDefinition("Active", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, boolean>(definition);

			field.mapWith((value) => value === "true" || value === "1");
			field.setWith((ctx, value) => {
				ctx.record.active = value;
			});

			const record = new TestRecord();

			if (field.mapper) {
				const context1 = new FieldMapperContext("Active", 0, "true", record);
				const result1 = field.mapper(context1);
				expect(result1.isValid).toBe(true);
				expect(record.active).toBe(true);

				const record2 = new TestRecord();
				const context2 = new FieldMapperContext("Active", 0, "1", record2);
				const result2 = field.mapper(context2);
				expect(result2.isValid).toBe(true);
				expect(record2.active).toBe(true);

				const record3 = new TestRecord();
				const context3 = new FieldMapperContext("Active", 0, "false", record3);
				const result3 = field.mapper(context3);
				expect(result3.isValid).toBe(true);
				expect(record3.active).toBe(false);
			}
		});
	});

	describe("error handling", () => {
		it("should handle mapper errors gracefully", () => {
			const definition = new FieldDefinition("Age", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, number>(definition);

			field.mapWith((value) => {
				const num = parseInt(value, 10);
				if (Number.isNaN(num)) {
					throw new Error("Invalid number");
				}
				return num;
			});

			const record = new TestRecord();
			const context = new FieldMapperContext("Age", 0, "abc", record);

			if (field.mapper) {
				const result = field.mapper(context);
				expect(result.isValid).toBe(false);
				expect(result.errors[0].message).toBe("Invalid number");
			}
		});
	});

	describe("getter and setter", () => {
		it("should set and get values", () => {
			const definition = new FieldDefinition("Name", new FieldLocator(0));
			const field = new FieldDescriptor<TestRecord, string>(definition);

			const record = new TestRecord();
			record.name = "Test";

			field.getWith((ctx) => ctx.record.name);
			field.setWith((ctx, value) => {
				ctx.record.name = value;
			});

			const getterContext = new FieldGetterContext("Name", record);

			if (field.getter) {
				expect(field.getter(getterContext)).toBe("Test");
			}

			if (field.setter) {
				field.setter(getterContext, "Updated");
				expect(record.name).toBe("Updated");
			}
		});
	});

	describe("FieldDescriptorBuilder", () => {
		it("should build field descriptor with builder", () => {
			const definition = new FieldDefinition("Name", new FieldLocator(0));
			const descriptor = FieldDescriptor.builder<TestRecord, string>(definition)
				.mapWith((value) => value.trim())
				.validateWith((v) => v.required("Required"))
				.formatWith((value) => value.toUpperCase())
				.build();

			expect(descriptor).toBeInstanceOf(FieldDescriptor);
			expect(descriptor.mapper).toBeDefined();
			expect(descriptor.validator).toBeDefined();
			expect(descriptor.formatter).toBeDefined();
		});
	});
});
