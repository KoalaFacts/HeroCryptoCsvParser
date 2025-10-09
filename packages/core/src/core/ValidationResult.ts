export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

export class ValidationResult<T = void> {
  private _errors: ValidationError[] = [];
  private _warnings: string[] = [];
  private _data?: T;

  get isValid(): boolean {
    return this._errors.length === 0;
  }

  get isInvalid(): boolean {
    return !this.isValid;
  }

  get errors(): ReadonlyArray<ValidationError> {
    return this._errors;
  }

  get warnings(): ReadonlyArray<string> {
    return this._warnings;
  }

  get data(): T | undefined {
    return this._data;
  }

  get firstError(): ValidationError | undefined {
    return this._errors[0];
  }

  static new<T = void>(): ValidationResult<T> {
    return new ValidationResult<T>();
  }

  static success<T>(data?: T): ValidationResult<T> {
    const result = new ValidationResult<T>();
    if (data !== undefined) {
      result.withData(data);
    }
    return result;
  }

  static failure<T>(
    error: ValidationError | ValidationError[] | string,
    data?: T,
  ): ValidationResult<T> {
    const result = new ValidationResult<T>();
    if (typeof error === "string") {
      result.addError({ code: "VALIDATION_ERROR", message: error });
    } else if (Array.isArray(error)) {
      result.addErrors(error);
    } else {
      result.addError(error);
    }
    if (data !== undefined) {
      result.withData(data);
    }
    return result;
  }

  static combine<T>(results: ValidationResult<any>[]): ValidationResult<T> {
    const combined = new ValidationResult<T>();
    for (const result of results) {
      combined.merge(result);
    }
    return combined;
  }

  addError(error: ValidationError): this {
    this._errors.push(error);
    return this;
  }

  addErrors(errors: ValidationError[]): this {
    this._errors.push(...errors);
    return this;
  }

  addWarning(warning: string): this {
    this._warnings.push(warning);
    return this;
  }

  withData(data: T): this {
    this._data = data;
    return this;
  }

  merge(other: ValidationResult<any>): this {
    this._errors.push(...other._errors);
    this._warnings.push(...other._warnings);
    return this;
  }

  mapData<U>(mapper: (data: T) => U): ValidationResult<U> {
    const result = new ValidationResult<U>();
    result._errors = [...this._errors];
    result._warnings = [...this._warnings];

    if (this.isValid && this._data !== undefined) {
      result.withData(mapper(this._data));
    }

    return result;
  }

  throwIfInvalid(): void {
    if (this.isInvalid) {
      const error = this.firstError;
      throw new Error(error?.message || "Validation failed");
    }
  }

  toJSON() {
    return {
      isValid: this.isValid,
      errors: this._errors,
      warnings: this._warnings,
      data: this._data,
    };
  }
}
