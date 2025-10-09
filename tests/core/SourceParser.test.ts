import { describe, expect, it } from "vitest";
import { BatchEntryRecord } from "@/core/BatchEntryRecord";
import { SourceParser } from "@/core/SourceParser";

// Test record class
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

// Test parser implementation
class TestParser extends SourceParser<TestRecord> {
	protected get RecordClass() {
		return TestRecord;
	}
}

describe("SourceParser", () => {
	const parser = new TestParser();

	describe("parse with headers", () => {
		it("should parse content with headers by default", () => {
			const content = `ID,Value
1,Test1
2,Test2
3,Test3`;

			const result = parser.parse(content);

			expect(result.records).toHaveLength(3);
			expect(result.records[0].id).toBe("1");
			expect(result.records[0].value).toBe("Test1");
			expect(result.metadata.totalRows).toBe(3);
			expect(result.metadata.parsedRows).toBe(3);
			expect(result.metadata.failedRows).toBe(0);
		});

		it("should skip headers when hasHeaders is true", () => {
			const content = `ID,Value
1,Test1`;

			const result = parser.parse(content, { hasHeaders: true });

			expect(result.records).toHaveLength(1);
			expect(result.records[0].id).toBe("1");
		});

		it("should not skip first line when hasHeaders is false", () => {
			const content = `1,Test1
2,Test2`;

			const result = parser.parse(content, { hasHeaders: false });

			expect(result.records).toHaveLength(2);
			expect(result.records[0].id).toBe("1");
		});
	});

	describe("parse with skip rows", () => {
		it("should skip additional rows after headers", () => {
			const content = `ID,Value
Comment line
Another comment
1,Test1
2,Test2`;

			const result = parser.parse(content, { skipRows: 2 });

			expect(result.records).toHaveLength(2);
			expect(result.records[0].id).toBe("1");
		});
	});

	describe("parse with max rows", () => {
		it("should limit number of parsed rows", () => {
			const content = `ID,Value
1,Test1
2,Test2
3,Test3
4,Test4
5,Test5`;

			const result = parser.parse(content, { maxRows: 3 });

			expect(result.records).toHaveLength(3);
			expect(result.metadata.totalRows).toBe(3);
		});
	});

	describe("error handling", () => {
		it("should collect parse errors", () => {
			const content = `ID,Value
1
2,Test2
3`;

			const result = parser.parse(content, { continueOnError: true });

			expect(result.records).toHaveLength(1);
			expect(result.errors).toHaveLength(2);
			expect(result.errors[0].row).toBe(2);
			expect(result.metadata.failedRows).toBe(2);
		});

		it("should stop on error when continueOnError is false", () => {
			const content = `ID,Value
1
2,Test2
3,Test3`;

			const result = parser.parse(content, { continueOnError: false });

			// When continueOnError is false, it processes until it hits an error
			// The first line "1" is invalid, so we should get an error
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0].row).toBe(2); // Row 2 is the line with "1"
		});

		it("should include line data in errors", () => {
			const content = `ID,Value
invalid_line`;

			const result = parser.parse(content);

			expect(result.errors[0].data).toBe("invalid_line");
		});
	});

	describe("empty lines", () => {
		it("should skip empty lines", () => {
			const content = `ID,Value
1,Test1

2,Test2

3,Test3`;

			const result = parser.parse(content);

			expect(result.records).toHaveLength(3);
			expect(result.errors).toHaveLength(0);
		});
	});

	describe("different line endings", () => {
		it("should handle Windows line endings (\\r\\n)", () => {
			const content = `ID,Value\r\n1,Test1\r\n2,Test2`;

			const result = parser.parse(content);

			expect(result.records).toHaveLength(2);
		});

		it("should handle Unix line endings (\\n)", () => {
			const content = `ID,Value\n1,Test1\n2,Test2`;

			const result = parser.parse(content);

			expect(result.records).toHaveLength(2);
		});

		it("should handle mixed line endings", () => {
			const content = `ID,Value\r\n1,Test1\n2,Test2`;

			const result = parser.parse(content);

			expect(result.records).toHaveLength(2);
		});
	});
});
