import { describe, expect, it } from "vitest";
import { ValidationResult } from "@/core/ValidationResult";

describe("ValidationResult", () => {
  describe("constructor", () => {
    it("should create valid result by default", () => {
      const result = new ValidationResult();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("addError", () => {
    it("should add error and invalidate result", () => {
      const result = new ValidationResult();
      result.addError({
        code: "TEST_ERROR",
        message: "Test error message",
        field: "testField",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe("TEST_ERROR");
      expect(result.errors[0].message).toBe("Test error message");
      expect(result.errors[0].field).toBe("testField");
    });

    it("should add multiple errors", () => {
      const result = new ValidationResult();
      result.addError({
        code: "ERROR1",
        message: "First error",
      });
      result.addError({
        code: "ERROR2",
        message: "Second error",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it("should handle errors with value", () => {
      const result = new ValidationResult();
      result.addError({
        code: "INVALID_VALUE",
        message: "Invalid value",
        value: "test-value",
      });

      expect(result.errors[0].value).toBe("test-value");
    });
  });

  describe("addErrors", () => {
    it("should add multiple errors at once", () => {
      const result = new ValidationResult();
      const errors = [
        { code: "ERROR1", message: "First error" },
        { code: "ERROR2", message: "Second error" },
        { code: "ERROR3", message: "Third error" },
      ];

      result.addErrors(errors);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors.map((e) => e.code)).toEqual([
        "ERROR1",
        "ERROR2",
        "ERROR3",
      ]);
    });

    it("should handle empty array", () => {
      const result = new ValidationResult();
      result.addErrors([]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("merge", () => {
    it("should merge errors from another result", () => {
      const result1 = new ValidationResult();
      result1.addError({ code: "ERROR1", message: "Error 1" });

      const result2 = new ValidationResult();
      result2.addError({ code: "ERROR2", message: "Error 2" });

      result1.merge(result2);

      expect(result1.isValid).toBe(false);
      expect(result1.errors).toHaveLength(2);
      expect(result1.errors.map((e) => e.code)).toEqual(["ERROR1", "ERROR2"]);
    });

    it("should merge valid results", () => {
      const result1 = new ValidationResult();
      const result2 = new ValidationResult();

      result1.merge(result2);

      expect(result1.isValid).toBe(true);
      expect(result1.errors).toHaveLength(0);
    });

    it("should merge into empty result", () => {
      const result1 = new ValidationResult();
      const result2 = new ValidationResult();
      result2.addError({ code: "ERROR", message: "Test error" });

      result1.merge(result2);

      expect(result1.isValid).toBe(false);
      expect(result1.errors).toHaveLength(1);
    });
  });

  describe("static methods", () => {
    describe("success", () => {
      it("should create success result", () => {
        const result = ValidationResult.success();
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should create success result with data", () => {
        interface TestData {
          value: string;
        }
        const result = ValidationResult.success<TestData>({ value: "test" });
        expect(result.isValid).toBe(true);
        expect(result.data).toEqual({ value: "test" });
      });
    });

    describe("failure", () => {
      it("should create failure result with single error", () => {
        const result = ValidationResult.failure({
          code: "FAIL",
          message: "Failure message",
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe("FAIL");
      });

      it("should create failure result with multiple errors", () => {
        const errors = [
          { code: "FAIL1", message: "First failure" },
          { code: "FAIL2", message: "Second failure" },
        ];
        const result = ValidationResult.failure(errors);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
      });

      it("should create failure result with data", () => {
        interface TestData {
          attempted: boolean;
        }
        const result = ValidationResult.failure<TestData>(
          { code: "FAIL", message: "Failed" },
          { attempted: true },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toEqual({ attempted: true });
      });
    });

    describe("combine", () => {
      it("should combine multiple results", () => {
        const result1 = ValidationResult.success();
        const result2 = ValidationResult.failure({
          code: "ERROR1",
          message: "Error 1",
        });
        const result3 = ValidationResult.failure({
          code: "ERROR2",
          message: "Error 2",
        });

        const combined = ValidationResult.combine([result1, result2, result3]);

        expect(combined.isValid).toBe(false);
        expect(combined.errors).toHaveLength(2);
        expect(combined.errors.map((e) => e.code)).toEqual([
          "ERROR1",
          "ERROR2",
        ]);
      });

      it("should combine all valid results", () => {
        const result1 = ValidationResult.success();
        const result2 = ValidationResult.success();
        const result3 = ValidationResult.success();

        const combined = ValidationResult.combine([result1, result2, result3]);

        expect(combined.isValid).toBe(true);
        expect(combined.errors).toHaveLength(0);
      });

      it("should handle empty array", () => {
        const combined = ValidationResult.combine([]);
        expect(combined.isValid).toBe(true);
        expect(combined.errors).toHaveLength(0);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle error without field", () => {
      const result = new ValidationResult();
      result.addError({
        code: "NO_FIELD",
        message: "Error without field",
      });

      expect(result.errors[0].field).toBeUndefined();
    });

    it("should handle complex data types", () => {
      interface ComplexData {
        nested: {
          value: number;
          array: string[];
        };
      }

      const result = ValidationResult.success<ComplexData>({
        nested: {
          value: 42,
          array: ["a", "b", "c"],
        },
      });

      expect(result.data?.nested.value).toBe(42);
      expect(result.data?.nested.array).toEqual(["a", "b", "c"]);
    });

    it("should preserve error order", () => {
      const result = new ValidationResult();
      for (let i = 0; i < 10; i++) {
        result.addError({
          code: `ERROR_${i}`,
          message: `Error ${i}`,
        });
      }

      expect(result.errors.length).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(result.errors[i].code).toBe(`ERROR_${i}`);
      }
    });
  });
});
