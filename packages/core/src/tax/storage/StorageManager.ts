/**
 * Storage Manager Factory
 *
 * Creates and manages storage adapters based on platform and configuration.
 * Automatically selects the optimal storage implementation for the environment.
 */

import { IndexedDBAdapter } from "./IndexedDBAdapter";
import { MMKVAdapter } from "./MMKVAdapter";
import { RxDBAdapter } from "./RxDBAdapter";
import type { StorageAdapter, StorageConfig } from "./StorageAdapter";

/**
 * Detected platform type
 */
export type PlatformType = "browser" | "mobile-native" | "mobile-web" | "node";

/**
 * Storage manager for creating and managing storage adapters
 */
export class StorageManager {
  private static instance: StorageManager | null = null;
  private adapters: Map<string, StorageAdapter> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of StorageManager
   */
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Create a storage adapter based on configuration
   *
   * @param config Storage configuration
   * @returns Initialized storage adapter
   */
  async createAdapter(config: StorageConfig): Promise<StorageAdapter> {
    const platform = config.platform || this.detectPlatform();
    const adapterId = this.getAdapterId(platform, config.databaseName);

    // Return existing adapter if already created
    const existingAdapter = this.adapters.get(adapterId);
    if (existingAdapter) {
      return existingAdapter;
    }

    // Create new adapter based on platform
    let adapter: StorageAdapter;

    switch (platform) {
      case "browser":
        adapter = new IndexedDBAdapter({ ...config, platform });
        break;

      case "mobile-native":
        adapter = new MMKVAdapter({ ...config, platform });
        break;

      case "mobile-web":
        // Mobile web uses IndexedDB like browser
        adapter = new IndexedDBAdapter({ ...config, platform });
        break;

      case "node":
        // Node.js uses RxDB for unified API
        adapter = new RxDBAdapter({ ...config, platform });
        break;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Initialize adapter
    await adapter.initialize();

    // Cache adapter for reuse
    this.adapters.set(adapterId, adapter);

    return adapter;
  }

  /**
   * Create RxDB adapter (unified cross-platform)
   *
   * @param config Storage configuration
   * @returns Initialized RxDB adapter
   */
  async createRxDBAdapter(config: StorageConfig): Promise<StorageAdapter> {
    const adapterId = this.getAdapterId("rxdb", config.databaseName);

    const existingAdapter = this.adapters.get(adapterId);
    if (existingAdapter) {
      return existingAdapter;
    }

    const adapter = new RxDBAdapter({
      ...config,
      platform: config.platform || this.detectPlatform(),
    });

    await adapter.initialize();
    this.adapters.set(adapterId, adapter);

    return adapter;
  }

  /**
   * Get an existing adapter by ID
   *
   * @param adapterId Adapter identifier
   * @returns Storage adapter or null if not found
   */
  getAdapter(adapterId: string): StorageAdapter | null {
    return this.adapters.get(adapterId) || null;
  }

  /**
   * Close and remove an adapter
   *
   * @param adapterId Adapter identifier
   */
  async closeAdapter(adapterId: string): Promise<void> {
    const adapter = this.adapters.get(adapterId);
    if (adapter) {
      await adapter.close();
      this.adapters.delete(adapterId);
    }
  }

  /**
   * Close all adapters
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.adapters.values()).map((adapter) =>
      adapter.close(),
    );

    await Promise.all(closePromises);
    this.adapters.clear();
  }

  /**
   * Detect current platform
   *
   * @returns Detected platform type
   */
  detectPlatform(): PlatformType {
    // Check if running in Node.js
    if (
      typeof process !== "undefined" &&
      process.versions &&
      process.versions.node
    ) {
      return "node";
    }

    // Check if running in browser
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // Check if mobile device
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      return isMobile ? "mobile-web" : "browser";
    }

    // Check if running in React Native or mobile native
    if (
      typeof navigator !== "undefined" &&
      navigator.product === "ReactNative"
    ) {
      return "mobile-native";
    }

    // Default to browser
    return "browser";
  }

  /**
   * Get recommended storage adapter for current platform
   *
   * @returns Recommended adapter type
   */
  getRecommendedAdapter(): string {
    const platform = this.detectPlatform();

    switch (platform) {
      case "browser":
        return "IndexedDB (recommended for browsers)";
      case "mobile-native":
        return "MMKV (recommended for React Native)";
      case "mobile-web":
        return "IndexedDB (recommended for mobile web)";
      case "node":
        return "RxDB (recommended for Node.js)";
      default:
        return "Unknown";
    }
  }

  /**
   * Check if a specific storage type is available
   *
   * @param storageType Storage type to check
   * @returns True if available
   */
  async isStorageAvailable(
    storageType: "indexeddb" | "mmkv" | "rxdb",
  ): Promise<boolean> {
    switch (storageType) {
      case "indexeddb":
        return typeof indexedDB !== "undefined";

      case "mmkv":
        // Check if MMKV is available (typically in React Native)
        try {
          // This would check for MMKV module availability
          return (
            typeof navigator !== "undefined" &&
            navigator.product === "ReactNative"
          );
        } catch {
          return false;
        }

      case "rxdb":
        // RxDB can run on any platform
        return true;

      default:
        return false;
    }
  }

  /**
   * Get storage adapter capabilities for current platform
   *
   * @returns Platform capabilities
   */
  getPlatformCapabilities(): {
    platform: PlatformType;
    supportsEncryption: boolean;
    supportsCompression: boolean;
    supportsOfflineStorage: boolean;
    maxStorageSize: string;
  } {
    const platform = this.detectPlatform();

    switch (platform) {
      case "browser":
        return {
          platform,
          supportsEncryption: true,
          supportsCompression: true,
          supportsOfflineStorage: true,
          maxStorageSize: "80% of disk space (IndexedDB quota)",
        };

      case "mobile-native":
        return {
          platform,
          supportsEncryption: true,
          supportsCompression: true,
          supportsOfflineStorage: true,
          maxStorageSize: "Device dependent (MMKV)",
        };

      case "mobile-web":
        return {
          platform,
          supportsEncryption: true,
          supportsCompression: true,
          supportsOfflineStorage: true,
          maxStorageSize: "50-80MB typical (IndexedDB quota)",
        };

      case "node":
        return {
          platform,
          supportsEncryption: true,
          supportsCompression: true,
          supportsOfflineStorage: true,
          maxStorageSize: "Disk space dependent",
        };

      default:
        return {
          platform: "browser",
          supportsEncryption: false,
          supportsCompression: false,
          supportsOfflineStorage: false,
          maxStorageSize: "Unknown",
        };
    }
  }

  /**
   * Generate unique adapter ID
   *
   * @param platform Platform type
   * @param databaseName Database name
   * @returns Unique adapter ID
   */
  private getAdapterId(platform: string, databaseName?: string): string {
    const dbName = databaseName || "default";
    return `${platform}_${dbName}`;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static reset(): void {
    if (StorageManager.instance) {
      StorageManager.instance.closeAll().catch(() => {
        // Ignore close errors during reset
      });
      StorageManager.instance = null;
    }
  }
}

/**
 * Initialize storage with automatic platform detection
 *
 * @param config Storage configuration (platform will be auto-detected if not provided)
 * @returns Initialized storage adapter
 */
export async function initializeStorage(
  config: Partial<StorageConfig> = {},
): Promise<StorageAdapter> {
  const manager = StorageManager.getInstance();
  const platform = config.platform || manager.detectPlatform();

  const fullConfig: StorageConfig = {
    platform,
    databaseName: config.databaseName || "crypto_tax_db",
    encryptionKey: config.encryptionKey,
    maxCacheSize: config.maxCacheSize || 100,
    compressionEnabled: config.compressionEnabled ?? true,
    indexedFields: config.indexedFields || ["date", "asset", "exchange"],
  };

  return manager.createAdapter(fullConfig);
}

/**
 * Get current storage manager instance
 */
export function getStorageManager(): StorageManager {
  return StorageManager.getInstance();
}

/**
 * Close all storage connections
 */
export async function closeAllStorage(): Promise<void> {
  const manager = StorageManager.getInstance();
  await manager.closeAll();
}
