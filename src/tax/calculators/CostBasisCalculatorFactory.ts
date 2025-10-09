/**
 * Cost Basis Calculator Factory
 *
 * Factory to select and instantiate the appropriate cost basis calculator
 * based on the specified method (FIFO, Specific Identification, etc.)
 */

import type { Transaction } from '../../types/transactions';
import type { CostBasis, CostBasisMethod } from '../models/CostBasis';
import { FIFOCalculator, createFIFOCalculator } from './FIFOCalculator';
import {
  SpecificIdentificationCalculator,
  createSpecificIdentificationCalculator,
  type LotIdentifier
} from './SpecificIdentificationCalculator';

/**
 * Base interface for all cost basis calculators
 */
export interface ICostBasisCalculator {
  calculateCostBasis(
    disposal: Transaction,
    acquisitions: Transaction[],
    options?: any
  ): CostBasis;
}

/**
 * Cost Basis Calculator Factory
 */
export class CostBasisCalculatorFactory {
  /**
   * Create a calculator instance for the specified method
   */
  static createCalculator(
    method: CostBasisMethod
  ): FIFOCalculator | SpecificIdentificationCalculator {
    switch (method) {
      case 'FIFO':
        return createFIFOCalculator();

      case 'SPECIFIC_IDENTIFICATION':
        return createSpecificIdentificationCalculator();

      default:
        throw new Error(`Unsupported cost basis method: ${method}`);
    }
  }

  /**
   * Calculate cost basis using the specified method
   *
   * @param method Cost basis method to use
   * @param disposal Disposal transaction
   * @param acquisitions Available acquisition transactions
   * @param options Method-specific options
   * @returns Cost basis result
   */
  static calculateCostBasis(
    method: CostBasisMethod,
    disposal: Transaction,
    acquisitions: Transaction[],
    options?: {
      // For SPECIFIC_IDENTIFICATION
      lotIdentifiers?: LotIdentifier[];
      // For future methods
      [key: string]: any;
    }
  ): CostBasis {
    switch (method) {
      case 'FIFO': {
        const calculator = createFIFOCalculator();
        return calculator.calculateCostBasis(disposal, acquisitions);
      }

      case 'SPECIFIC_IDENTIFICATION': {
        const calculator = createSpecificIdentificationCalculator();

        if (!options?.lotIdentifiers) {
          throw new Error(
            'Specific Identification method requires lotIdentifiers in options'
          );
        }

        return calculator.calculateCostBasis(
          disposal,
          options.lotIdentifiers,
          acquisitions
        );
      }

      default:
        throw new Error(`Unsupported cost basis method: ${method}`);
    }
  }

  /**
   * Get supported cost basis methods
   */
  static getSupportedMethods(): CostBasisMethod[] {
    return ['FIFO', 'SPECIFIC_IDENTIFICATION'];
  }

  /**
   * Check if a method is supported
   */
  static isMethodSupported(method: string): method is CostBasisMethod {
    return this.getSupportedMethods().includes(method as CostBasisMethod);
  }

  /**
   * Get default cost basis method
   */
  static getDefaultMethod(): CostBasisMethod {
    return 'FIFO';
  }

  /**
   * Get method description
   */
  static getMethodDescription(method: CostBasisMethod): string {
    switch (method) {
      case 'FIFO':
        return 'First-In-First-Out: Uses the oldest acquisition lots first for cost basis calculation';

      case 'SPECIFIC_IDENTIFICATION':
        return 'Specific Identification: Allows manual selection of specific acquisition lots for tax optimization';

      default:
        return 'Unknown method';
    }
  }

  /**
   * Get recommended method for a jurisdiction
   */
  static getRecommendedMethod(
    jurisdictionCode: string
  ): CostBasisMethod {
    switch (jurisdictionCode) {
      case 'AU':
        // Australia allows both FIFO and Specific Identification
        // FIFO is simpler and widely used
        return 'FIFO';

      default:
        return this.getDefaultMethod();
    }
  }

  /**
   * Validate calculator options for a method
   */
  static validateOptions(
    method: CostBasisMethod,
    options?: any
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (method) {
      case 'FIFO':
        // FIFO doesn't require special options
        break;

      case 'SPECIFIC_IDENTIFICATION':
        if (!options?.lotIdentifiers) {
          errors.push('lotIdentifiers is required for Specific Identification method');
        } else if (!Array.isArray(options.lotIdentifiers)) {
          errors.push('lotIdentifiers must be an array');
        } else if (options.lotIdentifiers.length === 0) {
          errors.push('lotIdentifiers must not be empty');
        }
        break;

      default:
        errors.push(`Unknown cost basis method: ${method}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Create a cost basis calculator for the specified method
 */
export function createCostBasisCalculator(
  method: CostBasisMethod
): FIFOCalculator | SpecificIdentificationCalculator {
  return CostBasisCalculatorFactory.createCalculator(method);
}

/**
 * Calculate cost basis using the specified method
 */
export function calculateCostBasis(
  method: CostBasisMethod,
  disposal: Transaction,
  acquisitions: Transaction[],
  options?: any
): CostBasis {
  return CostBasisCalculatorFactory.calculateCostBasis(
    method,
    disposal,
    acquisitions,
    options
  );
}

/**
 * Get all supported cost basis methods
 */
export function getSupportedCostBasisMethods(): CostBasisMethod[] {
  return CostBasisCalculatorFactory.getSupportedMethods();
}
