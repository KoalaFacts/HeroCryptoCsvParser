/**
 * Represents a decimal amount with arbitrary precision
 * Uses string representation to avoid JavaScript floating point issues
 */
export class Amount {
  private readonly value: string;

  constructor(value: string | number | Amount) {
    if (value instanceof Amount) {
      this.value = value.value;
    } else if (typeof value === 'number') {
      // Handle scientific notation
      this.value = value.toFixed(20).replace(/\.?0+$/, '');
    } else {
      // Validate and normalize string
      const normalized = this.normalizeValue(value);
      if (!this.isValidAmount(normalized)) {
        throw new Error(`Invalid amount: ${value}`);
      }
      this.value = normalized;
    }
  }

  private normalizeValue(value: string): string {
    // Remove leading/trailing whitespace
    let normalized = value.trim();
    
    // Handle scientific notation
    if (normalized.includes('E') || normalized.includes('e')) {
      const parsed = parseFloat(normalized);
      if (isNaN(parsed)) {
        throw new Error(`Invalid scientific notation: ${value}`);
      }
      // Convert to fixed notation with sufficient precision
      normalized = parsed.toFixed(20).replace(/\.?0+$/, '');
    }
    
    // Remove unnecessary leading zeros but keep "0" or "0."
    normalized = normalized.replace(/^0+(?=\d)/, '');
    
    // Ensure we have at least "0" for values less than 1
    if (normalized.startsWith('.')) {
      normalized = '0' + normalized;
    }
    
    return normalized || '0';
  }

  private isValidAmount(value: string): boolean {
    // Check if it's a valid decimal number (positive or negative)
    return /^-?\d+(\.\d+)?$/.test(value);
  }

  toString(): string {
    return this.value;
  }

  toNumber(): number {
    return parseFloat(this.value);
  }

  isZero(): boolean {
    return parseFloat(this.value) === 0;
  }

  isNegative(): boolean {
    return this.value.startsWith('-');
  }

  isPositive(): boolean {
    return !this.isNegative() && !this.isZero();
  }

  abs(): Amount {
    if (this.isNegative()) {
      return new Amount(this.value.substring(1));
    }
    return this;
  }

  negate(): Amount {
    if (this.isZero()) {
      return this;
    }
    if (this.isNegative()) {
      return new Amount(this.value.substring(1));
    }
    return new Amount('-' + this.value);
  }

  equals(other: Amount | string | number): boolean {
    const otherAmount = other instanceof Amount ? other : new Amount(other);
    return parseFloat(this.value) === parseFloat(otherAmount.value);
  }

  compareTo(other: Amount | string | number): number {
    const otherAmount = other instanceof Amount ? other : new Amount(other);
    const thisNum = parseFloat(this.value);
    const otherNum = parseFloat(otherAmount.value);
    
    if (thisNum < otherNum) return -1;
    if (thisNum > otherNum) return 1;
    return 0;
  }

  isGreaterThan(other: Amount | string | number): boolean {
    return this.compareTo(other) > 0;
  }

  isLessThan(other: Amount | string | number): boolean {
    return this.compareTo(other) < 0;
  }

  isGreaterThanOrEqual(other: Amount | string | number): boolean {
    return this.compareTo(other) >= 0;
  }

  isLessThanOrEqual(other: Amount | string | number): boolean {
    return this.compareTo(other) <= 0;
  }

  // Basic arithmetic operations (for simple cases)
  // For complex arithmetic, consider using a proper decimal library
  add(other: Amount | string | number): Amount {
    const otherAmount = other instanceof Amount ? other : new Amount(other);
    const result = parseFloat(this.value) + parseFloat(otherAmount.value);
    return new Amount(result.toString());
  }

  subtract(other: Amount | string | number): Amount {
    const otherAmount = other instanceof Amount ? other : new Amount(other);
    const result = parseFloat(this.value) - parseFloat(otherAmount.value);
    return new Amount(result.toString());
  }

  multiply(other: Amount | string | number): Amount {
    const otherAmount = other instanceof Amount ? other : new Amount(other);
    const result = parseFloat(this.value) * parseFloat(otherAmount.value);
    return new Amount(result.toString());
  }

  divide(other: Amount | string | number): Amount {
    const otherAmount = other instanceof Amount ? other : new Amount(other);
    if (otherAmount.isZero()) {
      throw new Error('Division by zero');
    }
    const result = parseFloat(this.value) / parseFloat(otherAmount.value);
    return new Amount(result.toString());
  }

  // Formatting methods
  format(decimals?: number): string {
    const num = parseFloat(this.value);
    if (decimals !== undefined) {
      return num.toFixed(decimals);
    }
    return this.value;
  }

  static ZERO = new Amount('0');
}