export class FieldGetterContext<TRecord> {
  constructor(
    public readonly fieldName: string,
    public readonly record: TRecord,
  ) {}
}

export class FieldMapperContext<TRecord> {
  constructor(
    public readonly fieldName: string,
    public readonly fieldIndex: number,
    public readonly rawValue: string | null,
    public readonly record: TRecord,
  ) {}
}

export class FieldFormatterContext<TRecord> {
  constructor(
    public readonly fieldName: string,
    public readonly currentValue: unknown,
    public readonly record: TRecord,
  ) {}
}

export class FieldValidatorContext<TRecord> {
  constructor(
    public readonly fieldName: string,
    public readonly currentValue: unknown,
    public readonly record: TRecord,
  ) {}
}
