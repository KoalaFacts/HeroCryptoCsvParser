import { TaxEvent } from './TaxEvent';
import { Source } from './Source';

/**
 * Base transaction properties common to all transaction types
 * Contains minimal required fields for tracking and reporting
 */
export interface BaseTransaction {
  // Essential identifiers
  id: string; // Unique identifier for deduplication
  timestamp: Date; // When the transaction occurred
  source: Source; // Data source (exchange, wallet, protocol, etc.)
  
  // Tax reporting essentials
  taxEvents: TaxEvent[]; // Tax implications of this transaction
  
  // Original data for reference/audit
  originalData?: Record<string, string>; // Raw data from exchange CSV
}