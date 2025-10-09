/**
 * Storage Adapters Index
 *
 * Exports all storage adapter implementations and utilities.
 */

// Core adapter interface
export type {
  StorageAdapter,
  TransactionFilter,
  TaxReportSummary,
  StorageStats
} from './StorageAdapter';

// Platform-specific adapters
export { IndexedDBAdapter } from './IndexedDBAdapter';
export { MMKVAdapter } from './MMKVAdapter';
export { RxDBAdapter } from './RxDBAdapter';

// Storage factory
export {
  StorageFactory,
  createStorageAdapter,
  detectStoragePlatform,
  type StoragePlatform,
  type StorageFactoryConfig
} from './StorageFactory';

// Storage manager
export { StorageManager } from './StorageManager';
