/**
 * Storage Adapter Interface for Crypto Tax Reporting
 *
 * Defines the contract for offline storage implementations across different platforms.
 * All implementations must support privacy-first architecture with no external data transmission.
 */

import type { TaxableTransaction } from "../models/TaxableTransaction";
import type { TaxEvent } from "../models/TaxEvent";
import type { TaxReport } from "../models/TaxReport";

export interface TransactionFilter {
  dateRange?: [Date, Date];
  assets?: string[];
  exchanges?: string[];
  transactionTypes?: string[];
  taxEventTypes?: string[];
  limit?: number;
  offset?: number;
}

export interface TaxReportSummary {
  id: string;
  jurisdiction: string;
  taxYear: number;
  generatedAt: Date;
  transactionCount: number;
  netTaxableAmount: number;
}

export interface StorageStats {
  totalTransactions: number;
  totalReports: number;
  cacheSize: number; // bytes
  storageUsed: number; // bytes
  storageAvailable: number; // bytes
  platform: string;
}

/**
 * Core storage adapter interface that all platform-specific implementations must follow
 */
export interface StorageAdapter {
  // Core transaction operations
  batchInsert(transactions: TaxableTransaction[]): Promise<void>;
  query(filter: TransactionFilter): Promise<TaxableTransaction[]>;
  update(id: string, updates: Partial<TaxableTransaction>): Promise<void>;
  delete(id: string): Promise<void>;

  // Tax calculation caching
  cacheTaxCalculation(key: string, result: unknown): Promise<void>;
  getCachedCalculation(key: string): Promise<unknown>;
  clearCache(): Promise<void>;

  // Report storage
  storeReport(report: TaxReport): Promise<void>;
  getReport(id: string): Promise<TaxReport | null>;
  listReports(): Promise<TaxReportSummary[]>;

  // Analytics and aggregations
  getTransactionsByDateRange(
    start: Date,
    end: Date,
  ): Promise<TaxableTransaction[]>;
  getTransactionsByAsset(asset: string): Promise<TaxableTransaction[]>;
  getTaxableEvents(year: number): Promise<TaxEvent[]>;

  // Storage management
  getStorageStats(): Promise<StorageStats>;
  cleanup(olderThan?: Date): Promise<void>;
  export(): Promise<string>;
  import(data: string): Promise<void>;

  // Platform-specific initialization and cleanup
  initialize(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Configuration for storage adapter initialization
 */
export interface StorageConfig {
  platform: "browser" | "mobile-native" | "mobile-web" | "node";
  encryptionKey?: string;
  databaseName?: string;
  maxCacheSize?: number; // MB
  compressionEnabled?: boolean;
  indexedFields?: string[];
}

/**
 * Base error class for storage operations
 */
export class StorageError extends Error {
  public readonly code: string;
  public readonly platform?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    platform?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "StorageError";
    this.code = code;
    this.platform = platform;
    this.details = details;
  }
}

/**
 * Storage operation result wrapper
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: StorageError;
  metadata?: {
    executionTime: number;
    itemsProcessed?: number;
    cacheHit?: boolean;
  };
}

/**
 * Batch operation configuration
 */
export interface BatchConfig {
  batchSize: number;
  maxConcurrency: number;
  retryAttempts: number;
  progressCallback?: (processed: number, total: number) => void;
}

/**
 * Default batch configuration for optimal performance
 */
export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchSize: 1000,
  maxConcurrency: 3,
  retryAttempts: 3,
};
