/**
 * ATO Format Validator
 *
 * Validates data formats for Australian Taxation Office (ATO) compliance.
 */

import type { ValidationIssue, ValidationResult } from './TransactionValidator';

/**
 * ATO XML format validator
 */
export class ATOFormatValidator {
  /**
   * Validate XML structure for ATO SBR submission
   */
  validateXMLStructure(xmlContent: string): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Check XML is well-formed
    if (!this.isWellFormedXML(xmlContent)) {
      issues.push({
        field: 'xml',
        message: 'XML is not well-formed',
        severity: 'error',
        code: 'MALFORMED_XML'
      });
      return this.buildResult(issues);
    }

    // Check for required namespaces
    this.validateNamespaces(xmlContent, issues);

    // Check for required elements
    this.validateRequiredElements(xmlContent, issues);

    return this.buildResult(issues);
  }

  /**
   * Validate capital gains data format
   */
  validateCapitalGainsFormat(data: {
    totalCapitalGains: number;
    totalCapitalLosses: number;
    netCapitalGain: number;
    cgtDiscount: number;
  }): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Amounts should be in cents (whole numbers)
    if (!Number.isInteger(data.totalCapitalGains * 100)) {
      issues.push({
        field: 'totalCapitalGains',
        message: 'Capital gains must be in whole cents',
        severity: 'warning',
        code: 'PRECISION_WARNING',
        suggestion: 'Round to 2 decimal places'
      });
    }

    // Amounts should not exceed ATO limits
    const MAX_AMOUNT = 999999999999; // 12 digits

    if (data.totalCapitalGains > MAX_AMOUNT) {
      issues.push({
        field: 'totalCapitalGains',
        message: 'Amount exceeds ATO maximum',
        severity: 'error',
        code: 'AMOUNT_TOO_LARGE'
      });
    }

    // Net gain calculation
    const calculatedNet = data.totalCapitalGains - data.totalCapitalLosses;
    if (Math.abs(data.netCapitalGain - calculatedNet) > 0.01) {
      issues.push({
        field: 'netCapitalGain',
        message: 'Net capital gain does not match calculation',
        severity: 'error',
        code: 'CALCULATION_ERROR'
      });
    }

    return this.buildResult(issues);
  }

  /**
   * Validate TFN (Tax File Number) format
   */
  validateTFN(tfn: string): ValidationResult {
    const issues: ValidationIssue[] = [];

    // TFN should be 8 or 9 digits
    if (!/^\d{8,9}$/.test(tfn)) {
      issues.push({
        field: 'tfn',
        message: 'TFN must be 8 or 9 digits',
        severity: 'error',
        code: 'INVALID_TFN_FORMAT'
      });
      return this.buildResult(issues);
    }

    // Validate TFN checksum (simplified)
    if (!this.validateTFNChecksum(tfn)) {
      issues.push({
        field: 'tfn',
        message: 'TFN checksum validation failed',
        severity: 'warning',
        code: 'INVALID_TFN_CHECKSUM',
        suggestion: 'Verify TFN is correct'
      });
    }

    return this.buildResult(issues);
  }

  /**
   * Validate ABN (Australian Business Number) format
   */
  validateABN(abn: string): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Remove spaces
    const cleanABN = abn.replace(/\s/g, '');

    // ABN should be 11 digits
    if (!/^\d{11}$/.test(cleanABN)) {
      issues.push({
        field: 'abn',
        message: 'ABN must be 11 digits',
        severity: 'error',
        code: 'INVALID_ABN_FORMAT'
      });
      return this.buildResult(issues);
    }

    // Validate ABN checksum
    if (!this.validateABNChecksum(cleanABN)) {
      issues.push({
        field: 'abn',
        message: 'ABN checksum validation failed',
        severity: 'error',
        code: 'INVALID_ABN_CHECKSUM'
      });
    }

    return this.buildResult(issues);
  }

  /**
   * Validate date format for ATO
   */
  validateATODateFormat(date: Date | string): ValidationResult {
    const issues: ValidationIssue[] = [];

    let dateObj: Date;

    if (typeof date === 'string') {
      // Should be in YYYY-MM-DD format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        issues.push({
          field: 'date',
          message: 'Date must be in YYYY-MM-DD format',
          severity: 'error',
          code: 'INVALID_DATE_FORMAT'
        });
        return this.buildResult(issues);
      }

      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    // Check date is valid
    if (isNaN(dateObj.getTime())) {
      issues.push({
        field: 'date',
        message: 'Invalid date value',
        severity: 'error',
        code: 'INVALID_DATE'
      });
    }

    return this.buildResult(issues);
  }

  // Private helper methods

  /**
   * Check if XML is well-formed
   */
  private isWellFormedXML(xml: string): boolean {
    try {
      // Basic XML validation (in a real implementation, use a proper XML parser)
      const openTags = xml.match(/<[^/][^>]*>/g) || [];
      const closeTags = xml.match(/<\/[^>]+>/g) || [];

      // Simple check: opening and closing tag count should match
      return openTags.length >= closeTags.length;
    } catch {
      return false;
    }
  }

  /**
   * Validate required namespaces
   */
  private validateNamespaces(xml: string, issues: ValidationIssue[]): void {
    const requiredNamespaces = [
      'xmlns:sbr=',
      'xmlns:xsi='
    ];

    for (const ns of requiredNamespaces) {
      if (!xml.includes(ns)) {
        issues.push({
          field: 'xml.namespaces',
          message: `Missing required namespace: ${ns}`,
          severity: 'error',
          code: 'MISSING_NAMESPACE'
        });
      }
    }
  }

  /**
   * Validate required elements
   */
  private validateRequiredElements(xml: string, issues: ValidationIssue[]): void {
    const requiredElements = [
      'TaxReturn',
      'TaxYear',
      'CapitalGains'
    ];

    for (const element of requiredElements) {
      if (!xml.includes(`<${element}`) && !xml.includes(`<${element.toLowerCase()}`)) {
        issues.push({
          field: 'xml.elements',
          message: `Missing required element: ${element}`,
          severity: 'warning',
          code: 'MISSING_ELEMENT'
        });
      }
    }
  }

  /**
   * Validate TFN checksum (simplified algorithm)
   */
  private validateTFNChecksum(tfn: string): boolean {
    // This is a simplified validation
    // Real TFN validation uses a more complex algorithm
    const weights = [1, 4, 3, 7, 5, 8, 6, 9, 10];
    let sum = 0;

    for (let i = 0; i < Math.min(tfn.length, 9); i++) {
      sum += parseInt(tfn[i]) * weights[i];
    }

    return sum % 11 === 0;
  }

  /**
   * Validate ABN checksum
   */
  private validateABNChecksum(abn: string): boolean {
    // ABN checksum algorithm
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    let sum = 0;

    // Subtract 1 from first digit
    const firstDigit = parseInt(abn[0]) - 1;
    sum += firstDigit * weights[0];

    // Add remaining digits with weights
    for (let i = 1; i < 11; i++) {
      sum += parseInt(abn[i]) * weights[i];
    }

    return sum % 89 === 0;
  }

  /**
   * Build validation result
   */
  private buildResult(issues: ValidationIssue[]): ValidationResult {
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    const info = issues.filter(i => i.severity === 'info');

    return {
      isValid: errors.length === 0,
      issues,
      errors,
      warnings,
      info
    };
  }
}

/**
 * Create an ATO format validator
 */
export function createATOFormatValidator(): ATOFormatValidator {
  return new ATOFormatValidator();
}

/**
 * Validate XML for ATO submission
 */
export function validateATOXML(xmlContent: string): ValidationResult {
  const validator = createATOFormatValidator();
  return validator.validateXMLStructure(xmlContent);
}
