/**
 * Storage Factory
 *
 * Factory to select and instantiate the appropriate storage adapter
 * based on the runtime platform (browser, mobile, unified).
 */

import { IndexedDBAdapter } from "./IndexedDBAdapter";
import { MMKVAdapter } from "./MMKVAdapter";
import { RxDBAdapter } from "./RxDBAdapter";
import type {
	StorageConfig as BaseStorageConfig,
	StorageAdapter,
} from "./StorageAdapter";

/**
 * Platform type detection
 */
export type StoragePlatform =
	| "browser"
	| "mobile-native"
	| "mobile-web"
	| "unified"
	| "auto";

/**
 * Storage configuration options for factory
 */
export interface StorageFactoryConfig {
	platform?: StoragePlatform;
	databaseName?: string;
	encryption?: boolean;
	encryptionKey?: string;
	compression?: boolean;
	maxCacheSize?: number;
}

/**
 * Map factory platform to base platform
 */
function mapToPlatform(
	platform: StoragePlatform,
): "browser" | "mobile-native" | "mobile-web" | "node" {
	switch (platform) {
		case "browser":
			return "browser";
		case "mobile-native":
			return "mobile-native";
		case "mobile-web":
			return "mobile-web";
		case "unified":
			return "browser"; // Default unified to browser
		default:
			return "browser";
	}
}

/**
 * Detect the current platform
 */
export function detectPlatform(): "browser" | "mobile-native" | "unified" {
	// Check for browser environment
	if (
		typeof window !== "undefined" &&
		typeof window.indexedDB !== "undefined"
	) {
		return "browser";
	}

	// Check for React Native environment
	if (
		typeof global !== "undefined" &&
		(global as typeof globalThis & { navigator?: { product?: string } })
			.navigator?.product === "ReactNative"
	) {
		return "mobile-native";
	}

	// Default to unified RxDB for maximum compatibility
	return "unified";
}

/**
 * Generate encryption key for secure storage
 */
function generateEncryptionKey(): string {
	// In production, this should use a secure key derivation function
	// For now, generate a random key
	const array = new Uint8Array(32);
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		crypto.getRandomValues(array);
	}
	return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}

/**
 * Create storage adapter for the specified platform
 */
export function createAdapter(
	config: StorageFactoryConfig = {},
): StorageAdapter {
	const platform = config.platform || "auto";
	const resolvedPlatform = platform === "auto" ? detectPlatform() : platform;

	const baseConfig: BaseStorageConfig = {
		platform: mapToPlatform(resolvedPlatform),
		databaseName: config.databaseName || "crypto-tax-db",
		encryptionKey:
			config.encryptionKey ||
			(config.encryption ? generateEncryptionKey() : undefined),
		maxCacheSize: config.maxCacheSize,
		compressionEnabled: config.compression,
	};

	switch (resolvedPlatform) {
		case "browser":
			return new IndexedDBAdapter(baseConfig);

		case "mobile-native":
			return new MMKVAdapter(baseConfig);

		case "mobile-web":
		case "unified":
			return new RxDBAdapter(baseConfig);

		default:
			throw new Error(`Unsupported platform: ${resolvedPlatform}`);
	}
}

/**
 * Check if platform is supported
 */
export function isPlatformSupported(platform: StoragePlatform): boolean {
	if (platform === "auto") {
		return true;
	}

	switch (platform) {
		case "browser":
			return (
				typeof window !== "undefined" && typeof window.indexedDB !== "undefined"
			);

		case "mobile-native":
			return (
				typeof global !== "undefined" &&
				(global as typeof globalThis & { navigator?: { product?: string } })
					.navigator?.product === "ReactNative"
			);

		case "mobile-web":
		case "unified":
			return true; // RxDB works everywhere

		default:
			return false;
	}
}

/**
 * Get recommended platform for current environment
 */
export function getRecommendedPlatform(): StoragePlatform {
	const detected = detectPlatform();

	// Prefer native implementations for better performance
	if (detected === "browser" || detected === "mobile-native") {
		return detected;
	}

	return "unified";
}

/**
 * Get platform capabilities
 */
export function getPlatformCapabilities(platform: StoragePlatform): {
	encryption: boolean;
	compression: boolean;
	indexing: boolean;
	streaming: boolean;
	maxStorageSize: number; // MB
} {
	const resolvedPlatform = platform === "auto" ? detectPlatform() : platform;

	switch (resolvedPlatform) {
		case "browser":
			return {
				encryption: false, // IndexedDB doesn't provide built-in encryption
				compression: true,
				indexing: true,
				streaming: true,
				maxStorageSize: 50, // Varies by browser, ~50MB typical
			};

		case "mobile-native":
		case "mobile-web":
			return {
				encryption: true, // MMKV supports encryption
				compression: true,
				indexing: false, // MMKV is key-value store
				streaming: false,
				maxStorageSize: 100, // Depends on device, typically more than browser
			};

		case "unified":
			return {
				encryption: true, // RxDB supports encryption
				compression: true,
				indexing: true,
				streaming: true,
				maxStorageSize: 100,
			};

		default:
			return {
				encryption: false,
				compression: false,
				indexing: false,
				streaming: false,
				maxStorageSize: 10,
			};
	}
}

/**
 * Create a storage adapter with automatic platform detection
 */
export function createStorageAdapter(
	config?: StorageFactoryConfig,
): StorageAdapter {
	return createAdapter(config);
}

/**
 * Get the current platform
 */
export function detectStoragePlatform(): StoragePlatform {
	return detectPlatform();
}
