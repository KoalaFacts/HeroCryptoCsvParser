import {
  type FieldFormatterContext,
  FieldGetterContext,
  type FieldMapperContext,
  type FieldValidatorContext,
} from "./FieldContext";
import { FieldValidationBuilder } from "./FieldValidationBuilder";
import { ValidationResult } from "./ValidationResult";

export class FieldLocator {
  constructor(
    public readonly fieldIndex: number,
    public readonly fieldPositionFrom?: number,
    public readonly fieldPositionTo?: number,
  ) {}

  getOrderingKey(): number {
    // For fixed-width fields, use position; otherwise use index
    return this.fieldPositionFrom ?? this.fieldIndex;
  }

  isFixedWidth(): boolean {
    return (
      this.fieldPositionFrom !== undefined && this.fieldPositionTo !== undefined
    );
  }
}

export class FieldDefinition {
  constructor(
    public readonly name: string,
    public readonly fieldLocator: FieldLocator,
  ) {}
}

export class FieldDescriptor<TRecord, TProperty = unknown> {
  public getter?: (context: FieldGetterContext<TRecord>) => TProperty;
  public setter?: (
    context: FieldGetterContext<TRecord>,
    value: TProperty,
  ) => void;
  public mapper?: (
    context: FieldMapperContext<TRecord>,
  ) => ValidationResult<TRecord>;
  public validator?: (
    context: FieldValidatorContext<TRecord>,
  ) => ValidationResult<TRecord>;
  public formatter?: (context: FieldFormatterContext<TRecord>) => string;

  constructor(public readonly definition: FieldDefinition) {}

  // Fluent builder methods
  getWith(getter: (context: FieldGetterContext<TRecord>) => TProperty): this {
    this.getter = getter;
    return this;
  }

  setWith(
    setter: (context: FieldGetterContext<TRecord>, value: TProperty) => void,
  ): this {
    this.setter = setter;
    return this;
  }

  mapWith(
    mapper: (rawValue: string) => TProperty,
    errorMessage?: string,
    errorCode?: string,
  ): this {
    this.mapper = (context) => {
      try {
        const mappedValue = mapper(context.rawValue ?? "");
        if (this.setter) {
          const getterContext = new FieldGetterContext(
            context.fieldName,
            context.record,
          );
          this.setter(getterContext, mappedValue);
        }
        return ValidationResult.success<TRecord>();
      } catch (error) {
        return ValidationResult.failure<TRecord>({
          code: errorCode || "MAPPING_ERROR",
          message:
            errorMessage ||
            (error instanceof Error ? error.message : "Mapping failed"),
          field: context.fieldName,
          value: context.rawValue,
        });
      }
    };
    return this;
  }

  validateWith(
    rules: (
      builder: FieldValidationBuilder<TRecord, TProperty>,
    ) => FieldValidationBuilder<TRecord, TProperty>,
  ): this {
    const builder = new FieldValidationBuilder<TRecord, TProperty>(
      this.definition.name,
    );
    const configuredBuilder = rules(builder);
    this.validator = configuredBuilder.build();
    return this;
  }

  formatWith(formatter: (value: TProperty) => string): this {
    this.formatter = (context) => {
      const value = context.currentValue as TProperty;
      return formatter(value);
    };
    return this;
  }

  // Builder class for more complex scenarios
  static builder<T, P>(
    definition: FieldDefinition,
  ): FieldDescriptorBuilder<T, P> {
    return new FieldDescriptorBuilder<T, P>(definition);
  }
}

export class FieldDescriptorBuilder<TRecord, TProperty> {
  private descriptor: FieldDescriptor<TRecord, TProperty>;

  constructor(definition: FieldDefinition) {
    this.descriptor = new FieldDescriptor<TRecord, TProperty>(definition);
  }

  getWith(getter: (context: FieldGetterContext<TRecord>) => TProperty): this {
    this.descriptor.getWith(getter);
    return this;
  }

  setWith(
    setter: (context: FieldGetterContext<TRecord>, value: TProperty) => void,
  ): this {
    this.descriptor.setWith(setter);
    return this;
  }

  mapWith(
    mapper: (rawValue: string) => TProperty,
    errorMessage?: string,
    errorCode?: string,
  ): this {
    this.descriptor.mapWith(mapper, errorMessage, errorCode);
    return this;
  }

  validateWith(
    rules: (
      builder: FieldValidationBuilder<TRecord, TProperty>,
    ) => FieldValidationBuilder<TRecord, TProperty>,
  ): this {
    this.descriptor.validateWith(rules);
    return this;
  }

  formatWith(formatter: (value: TProperty) => string): this {
    this.descriptor.formatWith(formatter);
    return this;
  }

  build(): FieldDescriptor<TRecord, TProperty> {
    return this.descriptor;
  }
}
