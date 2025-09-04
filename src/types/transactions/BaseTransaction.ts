import { TaxEvent } from '../common/TaxEvent';
import { Source } from '../common/Source';
import { TransactionType } from './Transaction';

/**
 * Base transaction properties common to all transaction types
 * Contains minimal required fields for tracking and reporting
 */
export interface BaseTransaction {
  /**
   * Unique identifier for deduplication
   */
  id: string;

  /**
   * Specific transaction type (e.g., 'SPOT_TRADE', 'TRANSFER', etc.)
   */
  type: TransactionType;

  /**
  * When the transaction occurred at UTC time
  */
  timestamp: Date;

  /**
  * Data source (exchange, wallet, protocol, etc.)
  */
  source: Source;

  /**
   * Tax implications of this transaction
   */
  taxEvents: TaxEvent[];

  /**
   * Original data for reference/audit
   */
  originalData?: Record<string, string>;
}