import {
  FieldFormatterContext,
  FieldGetterContext,
  FieldMapperContext,
  FieldValidatorContext,
} from "./FieldContext";
import {
  FieldDefinition,
  FieldDescriptor,
  FieldLocator,
} from "./FieldDescriptor";
import type { BatchEntryRecordOptions } from "./options/BatchEntryRecordOptions";
import { CsvBatchEntryRecordOptions } from "./options/CsvBatchEntryRecordOptions";
import { ValidationResult } from "./ValidationResult";

export abstract class BatchEntryRecord<
  TRecord extends BatchEntryRecord<TRecord>,
> {
  private _fieldBuilders: FieldDescriptor<TRecord>[] = [];
  private _fieldDescriptors?: ReadonlyArray<FieldDescriptor<TRecord>>;
  private _recordHeaders?: string[];
  private _options?: BatchEntryRecordOptions;

  private getOptions(): BatchEntryRecordOptions {
    return this._options || CsvBatchEntryRecordOptions.Default;
  }

  protected configOptions(config: () => BatchEntryRecordOptions): TRecord {
    if (!config) {
      throw new Error("Config function is required");
    }

    this._options = config();
    return this as unknown as TRecord;
  }

  public getFieldDescriptors(): ReadonlyArray<FieldDescriptor<TRecord>> {
    if (!this._fieldDescriptors) {
      this._fieldDescriptors = this._fieldBuilders.sort((a, b) => {
        const aKey = a.definition.fieldLocator.getOrderingKey();
        const bKey = b.definition.fieldLocator.getOrderingKey();
        return aKey - bKey;
      });

      if (this._fieldDescriptors.length === 0) {
        throw new Error(
          `No fields defined for ${this.constructor.name}. Use 'fieldFor' to define fields.`,
        );
      }

      // Check for unique field names
      const names = this._fieldDescriptors.map((fd) => fd.definition.name);
      const uniqueNames = new Set(names);

      if (names.length !== uniqueNames.size) {
        throw new Error(
          `Field names must be unique in ${this.constructor.name}.`,
        );
      }

      const options = this.getOptions();
      options.validateFieldDefinitions(
        this._fieldDescriptors as FieldDescriptor<any>[],
        this.constructor.name,
      );
    }

    return this._fieldDescriptors;
  }

  public getRecordHeaders(): string[] {
    if (!this._recordHeaders) {
      const descriptors = [...this.getFieldDescriptors()];
      this._recordHeaders = descriptors
        .sort(
          (a, b) =>
            a.definition.fieldLocator.fieldIndex -
            b.definition.fieldLocator.fieldIndex,
        )
        .map((fd: FieldDescriptor<TRecord>) => fd.definition.name);
    }

    return this._recordHeaders;
  }

  public validate(): ValidationResult<TRecord> {
    const result = new ValidationResult<TRecord>();

    for (const descriptor of this.getFieldDescriptors()) {
      if (!descriptor.validator) continue;

      const getterContext = new FieldGetterContext<TRecord>(
        descriptor.definition.name,
        this as unknown as TRecord,
      );

      const currentValue = descriptor.getter?.(getterContext);

      const validatorContext = new FieldValidatorContext<TRecord>(
        descriptor.definition.name,
        currentValue,
        this as unknown as TRecord,
      );

      const fieldResult = descriptor.validator(validatorContext);
      result.merge(fieldResult);
    }

    return result;
  }

  public validateAndThrow(): void {
    const result = this.validate();

    if (!result.isValid) {
      const firstError = result.errors[0];
      throw new Error(firstError?.message || "Field validation error");
    }
  }

  public output(): string {
    this.validateAndThrow();
    return this.writeLine(this.getFormattedFields());
  }

  public static parse<T extends BatchEntryRecord<T>>(
    RecordClass: new () => T,
    lineContent: string,
  ): ValidationResult<T> {
    const record = new RecordClass();
    const fields = record.readLine(lineContent);
    const descriptors = record.getFieldDescriptors();

    if (fields.length !== descriptors.length) {
      const result = new ValidationResult<T>();
      result.addError({
        code: "FIELD_COUNT_MISMATCH",
        message: `Expected ${descriptors.length} fields, but got ${fields.length}.`,
      });
      return result;
    }

    const result = new ValidationResult<T>();

    // Apply mappers
    for (let i = 0; i < descriptors.length; i++) {
      const descriptor = descriptors[i];
      if (descriptor.mapper) {
        const fieldValue = fields[i];
        const mapperContext = new FieldMapperContext<T>(
          descriptor.definition.name,
          descriptor.definition.fieldLocator.fieldIndex,
          fieldValue,
          record as unknown as T,
        );
        const mapperResult = descriptor.mapper(mapperContext);
        result.merge(mapperResult);
      }
    }

    if (!result.isValid) {
      return result;
    }

    // Validate the record
    const validationResult = record.validate();
    result.merge(validationResult);

    if (result.isValid) {
      result.withData(record);
    }

    return result;
  }

  /**
   * Define a field with fluent API
   * @param propertySelector - Function that selects the property from the record
   * @param fieldName - Name of the field in CSV header
   * @param fieldIndex - Index of the field in CSV row (0-based)
   */
  protected fieldFor<TProperty>(
    propertySelector: (record: TRecord) => TProperty,
    fieldName: string,
    fieldIndex: number,
  ): FieldDescriptor<TRecord, TProperty> {
    const definition = new FieldDefinition(
      fieldName,
      new FieldLocator(fieldIndex),
    );
    const descriptor = new FieldDescriptor<TRecord, TProperty>(definition);

    // Set default getter based on property selector
    descriptor.getter = (ctx) => propertySelector(ctx.record);

    // Extract property name for default mapper
    const selectorStr = propertySelector.toString();
    const propertyMatch = selectorStr.match(/\.(\w+)/);
    const propertyName = propertyMatch ? propertyMatch[1] : "";

    // Set default setter for the property
    descriptor.setter = (ctx, value) => {
      if (propertyName) {
        (ctx.record as any)[propertyName] = value;
      }
    };

    // Set default identity mapper - maps raw string value directly to property
    descriptor.mapper = (ctx: FieldMapperContext<TRecord>) => {
      const result = new ValidationResult<TRecord>();
      try {
        // Default behavior: pass the raw value directly through (identity function)
        const mappedValue = ctx.rawValue as any as TProperty;
        if (descriptor.setter) {
          const getterContext = new FieldGetterContext(
            ctx.fieldName,
            ctx.record,
          );
          descriptor.setter(getterContext, mappedValue);
        }
      } catch (error) {
        result.addError({
          code: "MAPPING_ERROR",
          message: error instanceof Error ? error.message : "Mapping failed",
          field: fieldName,
        });
      }
      return result;
    };

    this._fieldBuilders.push(descriptor);
    return descriptor;
  }

  /**
   * Define a spare/unmapped field that doesn't correspond to any property
   * Used for fields in the CSV that we don't need but must acknowledge for schema compliance
   * @param fieldName - Name of the field in CSV header
   * @param fieldIndex - Index of the field in CSV row (0-based)
   */
  protected fieldForSpare(
    fieldName: string,
    fieldIndex: number,
  ): FieldDescriptor<TRecord, any> {
    const definition = new FieldDefinition(
      fieldName,
      new FieldLocator(fieldIndex),
    );
    const descriptor = new FieldDescriptor<TRecord, any>(definition);

    // Spare fields have no getter/setter
    descriptor.getter = () => undefined;

    // Default mapper that does nothing
    descriptor.mapper = () => ValidationResult.success<TRecord>();

    // Default formatter returns empty string
    descriptor.formatter = () => "";

    this._fieldBuilders.push(descriptor);
    return descriptor;
  }

  /**
   * Define a fixed-width field with fluent API
   */
  protected fieldForWithPosition<TProperty>(
    propertySelector: (record: TRecord) => TProperty,
    fieldName: string,
    fieldIndex: number,
    fieldPositionFrom: number,
    fieldPositionTo: number,
  ): FieldDescriptor<TRecord, TProperty> {
    const locator = new FieldLocator(
      fieldIndex,
      fieldPositionFrom,
      fieldPositionTo,
    );
    const definition = new FieldDefinition(fieldName, locator);
    const descriptor = new FieldDescriptor<TRecord, TProperty>(definition);

    // Set default getter based on property selector
    descriptor.getter = (ctx) => propertySelector(ctx.record);

    // Extract property name for default mapper
    const selectorStr = propertySelector.toString();
    const propertyMatch = selectorStr.match(/\.(\w+)/);
    const propertyName = propertyMatch ? propertyMatch[1] : "";

    // Set default mapper that assigns to the property
    descriptor.mapWith = function (mapper: (value: string) => TProperty) {
      this.mapper = (ctx: FieldMapperContext<TRecord>) => {
        const result = new ValidationResult<TRecord>();
        try {
          const mappedValue = mapper(ctx.rawValue);
          if (mappedValue !== undefined && propertyName) {
            (ctx.record as any)[propertyName] = mappedValue;
          }
        } catch (error) {
          result.addError({
            code: "MAPPING_ERROR",
            message: error instanceof Error ? error.message : "Mapping failed",
            field: fieldName,
          });
        }
        return result;
      };
      return this;
    };

    this._fieldBuilders.push(descriptor);
    return descriptor;
  }

  protected writeLine(fields: string[]): string {
    if (!fields) {
      throw new Error("Fields cannot be null");
    }

    const options = this.getOptions();
    const descriptors = [...this.getFieldDescriptors()];
    return options.writeLine(fields, descriptors as FieldDescriptor<any>[]);
  }

  protected readLine(line: string): string[] {
    if (!line) {
      throw new Error("Line cannot be null or empty");
    }

    const options = this.getOptions();
    const descriptors = [...this.getFieldDescriptors()];
    return options.readLine(line, descriptors as FieldDescriptor<any>[]);
  }

  private getFormattedFields(): string[] {
    return this.getFieldDescriptors().map((descriptor) => {
      const getterContext = new FieldGetterContext<TRecord>(
        descriptor.definition.name,
        this as unknown as TRecord,
      );
      let currentValue = descriptor.getter?.(getterContext) ?? "";

      if (descriptor.formatter) {
        const formatterContext = new FieldFormatterContext<TRecord>(
          descriptor.definition.name,
          currentValue,
          this as unknown as TRecord,
        );
        currentValue = descriptor.formatter(formatterContext);
      }

      return currentValue?.toString() ?? "";
    });
  }
}
