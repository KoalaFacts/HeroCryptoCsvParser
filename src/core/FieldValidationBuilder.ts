import type { FieldValidatorContext } from "./FieldContext";
import { ValidationResult } from "./ValidationResult";

export class FieldValidationBuilder<TRecord, TProperty = any> {
  private validationRules: Array<
    (context: FieldValidatorContext<TRecord>) => ValidationResult<TRecord>
  > = [];
  private errorCode?: string;

  constructor(
    private fieldName: string,
    errorCode?: string,
  ) {
    this.errorCode = errorCode;
  }

  when(
    predicate: (record: TRecord, value: TProperty) => boolean,
    conditionalRules: (
      builder: FieldValidationBuilder<TRecord, TProperty>,
    ) => void,
  ): this {
    const conditionalBuilder = new FieldValidationBuilder<TRecord, TProperty>(
      this.fieldName,
      this.errorCode,
    );
    conditionalRules(conditionalBuilder);

    this.validationRules.push((context) => {
      const typedValue = context.currentValue as TProperty;
      if (predicate(context.record, typedValue)) {
        return conditionalBuilder.build()(context);
      }
      return ValidationResult.success();
    });

    return this;
  }

  unless(
    predicate: (record: TRecord, value: TProperty) => boolean,
    conditionalRules: (
      builder: FieldValidationBuilder<TRecord, TProperty>,
    ) => void,
  ): this {
    return this.when(
      (record, value) => !predicate(record, value),
      conditionalRules,
    );
  }

  required(errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = context.currentValue;
      if (value === null || value === undefined || value === "") {
        return ValidationResult.failure({
          code: this.errorCode || "REQUIRED",
          message: errorMessage || `Field '${this.fieldName}' is required`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  notNull(errorMessage?: string): this {
    this.validationRules.push((context) => {
      if (context.currentValue === null) {
        return ValidationResult.failure({
          code: this.errorCode || "NOT_NULL",
          message: errorMessage || `Field '${this.fieldName}' cannot be null`,
          field: this.fieldName,
          value: context.currentValue,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  equal(expectedValue: TProperty, errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = context.currentValue as TProperty;
      if (value !== expectedValue) {
        return ValidationResult.failure({
          code: this.errorCode || "EQUAL",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must equal ${expectedValue}`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  notEqual(forbiddenValue: TProperty, errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = context.currentValue as TProperty;
      if (value === forbiddenValue) {
        return ValidationResult.failure({
          code: this.errorCode || "NOT_EQUAL",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must not equal ${forbiddenValue}`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  must(
    predicate:
      | ((value: TProperty) => boolean)
      | ((value: TProperty, record: TRecord) => boolean),
    errorMessage?: string,
  ): this {
    this.validationRules.push((context) => {
      const value = context.currentValue as TProperty;
      const isValid =
        predicate.length === 1
          ? (predicate as (value: TProperty) => boolean)(value)
          : (predicate as (value: TProperty, record: TRecord) => boolean)(
              value,
              context.record,
            );

      if (!isValid) {
        return ValidationResult.failure({
          code: this.errorCode || "MUST",
          message:
            errorMessage || `Field '${this.fieldName}' validation failed`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  mustNot(
    predicate:
      | ((value: TProperty) => boolean)
      | ((value: TProperty, record: TRecord) => boolean),
    errorMessage?: string,
  ): this {
    this.validationRules.push((context) => {
      const value = context.currentValue as TProperty;
      const isForbidden =
        predicate.length === 1
          ? (predicate as (value: TProperty) => boolean)(value)
          : (predicate as (value: TProperty, record: TRecord) => boolean)(
              value,
              context.record,
            );

      if (isForbidden) {
        return ValidationResult.failure({
          code: this.errorCode || "MUST_NOT",
          message:
            errorMessage || `Field '${this.fieldName}' validation failed`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  notEmpty(errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = context.currentValue;
      const isEmpty =
        value === null ||
        value === undefined ||
        value === "" ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "object" &&
          !Array.isArray(value) &&
          Object.keys(value).length === 0);

      if (isEmpty) {
        return ValidationResult.failure({
          code: this.errorCode || "NOT_EMPTY",
          message: errorMessage || `Field '${this.fieldName}' cannot be empty`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  // String-specific validations
  regex(pattern: RegExp | string, errorMessage?: string): this {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

    this.validationRules.push((context) => {
      const value = String(context.currentValue);
      if (!regex.test(value)) {
        return ValidationResult.failure({
          code: this.errorCode || "REGEX",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must match pattern ${regex}`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  minLength(min: number, errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = context.currentValue;
      // Skip validation for null/undefined (not required)
      if (value === null || value === undefined) {
        return ValidationResult.success();
      }
      const strValue = String(value);
      if (strValue.length < min) {
        return ValidationResult.failure({
          code: this.errorCode || "MIN_LENGTH",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must be at least ${min} characters`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  maxLength(max: number, errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = String(context.currentValue || "");
      if (value.length > max) {
        return ValidationResult.failure({
          code: this.errorCode || "MAX_LENGTH",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must be at most ${max} characters`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  exactLength(length: number, errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = String(context.currentValue || "");
      if (value.length !== length) {
        return ValidationResult.failure({
          code: this.errorCode || "EXACT_LENGTH",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must be exactly ${length} characters`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  // Number-specific validations
  min(minValue: number, errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = Number(context.currentValue);
      if (Number.isNaN(value) || value < minValue) {
        return ValidationResult.failure({
          code: this.errorCode || "MIN",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must be at least ${minValue}`,
          field: this.fieldName,
          value: context.currentValue,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  max(maxValue: number, errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = Number(context.currentValue);
      if (Number.isNaN(value) || value > maxValue) {
        return ValidationResult.failure({
          code: this.errorCode || "MAX",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must be at most ${maxValue}`,
          field: this.fieldName,
          value: context.currentValue,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  range(min: number, max: number, errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = Number(context.currentValue);
      if (Number.isNaN(value) || value < min || value > max) {
        return ValidationResult.failure({
          code: this.errorCode || "RANGE",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must be between ${min} and ${max}`,
          field: this.fieldName,
          value: context.currentValue,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  // Collection validations
  oneOf(allowedValues: TProperty[], errorMessage?: string): this {
    this.validationRules.push((context) => {
      const value = context.currentValue as TProperty;
      if (!allowedValues.includes(value)) {
        return ValidationResult.failure({
          code: this.errorCode || "ONE_OF",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must be one of: ${allowedValues.join(", ")}`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  oneOfEnum<E extends Record<string, any>>(
    enumType?: E,
    errorMessage?: string,
  ): this {
    this.validationRules.push((context) => {
      const value = context.currentValue;
      const enumValues = enumType ? Object.values(enumType) : [];

      if (!enumValues.includes(value)) {
        return ValidationResult.failure({
          code: this.errorCode || "ONE_OF_ENUM",
          message:
            errorMessage ||
            `Field '${this.fieldName}' must be a valid enum value`,
          field: this.fieldName,
          value,
        });
      }
      return ValidationResult.success();
    });
    return this;
  }

  build(): (
    context: FieldValidatorContext<TRecord>,
  ) => ValidationResult<TRecord> {
    return (context) => {
      const result = new ValidationResult<TRecord>();

      for (const rule of this.validationRules) {
        const ruleResult = rule(context);
        if (ruleResult.isInvalid) {
          result.merge(ruleResult);
          // Continue to collect all errors
        }
      }

      return result;
    };
  }
}
