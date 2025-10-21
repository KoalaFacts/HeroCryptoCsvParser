/**
 * Storage Adapters Index
 *
 * Exports all storage adapter implementations and utilities.
 */

// Platform-specific adapters
export { IndexedDBAdapter } from "./IndexedDBAdapter";
export { MMKVAdapter } from "./MMKVAdapter";
export { RxDBAdapter } from "./RxDBAdapter";
// Core adapter interface
export type {
  StorageAdapter,
  StorageStats,
  TaxReportSummary,
  TransactionFilter,
} from "./StorageAdapter";

// Storage factory
export {
  createAdapter,
  createStorageAdapter,
  detectPlatform,
  detectStoragePlatform,
  getPlatformCapabilities,
  getRecommendedPlatform,
  isPlatformSupported,
  type StorageFactoryConfig,
  type StoragePlatform,
} from "./StorageFactory";

// Storage manager
export { StorageManager } from "./StorageManager";
