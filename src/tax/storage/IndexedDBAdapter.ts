/**
 * IndexedDB Storage Adapter for Browser Environment
 *
 * Provides high-performance offline storage for cryptocurrency tax data in browsers.
 * Optimized for handling millions of transactions with efficient indexing and chunked processing.
 */

import type { TaxableTransaction } from "../models/TaxableTransaction";
import type { TaxEvent } from "../models/TaxEvent";
import type { TaxReport } from "../models/TaxReport";
import {
	getTransactionAsset,
	getTransactionSource,
} from "../utils/transactionHelpers";
import type {
	StorageAdapter,
	StorageConfig,
	StorageStats,
	TaxReportSummary,
	TransactionFilter,
} from "./StorageAdapter";
import { DEFAULT_BATCH_CONFIG, StorageError } from "./StorageAdapter";

export class IndexedDBAdapter implements StorageAdapter {
	private db: IDBDatabase | null = null;
	private readonly dbName: string;
	private readonly version: number = 1;

	// Store names
	private readonly TRANSACTIONS_STORE = "transactions";
	private readonly REPORTS_STORE = "reports";
	private readonly CACHE_STORE = "cache";
	private readonly EVENTS_STORE = "events";

	constructor(config: StorageConfig) {
		this.dbName = config.databaseName || "crypto-tax-db";
	}

	async initialize(): Promise<void> {
		if (this.db) return;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);

			request.onerror = () => {
				reject(
					new StorageError(
						"Failed to open IndexedDB",
						"DB_OPEN_FAILED",
						"browser",
						{ dbName: this.dbName, error: request.error },
					),
				);
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Transactions store with indices for efficient querying
				if (!db.objectStoreNames.contains(this.TRANSACTIONS_STORE)) {
					const txStore = db.createObjectStore(this.TRANSACTIONS_STORE, {
						keyPath: "id",
					});
					txStore.createIndex("date", "originalTransaction.timestamp", {
						unique: false,
					});
					txStore.createIndex("asset", "originalTransaction.asset.symbol", {
						unique: false,
					});
					txStore.createIndex(
						"exchange",
						"originalTransaction.dataSource.name",
						{ unique: false },
					);
					txStore.createIndex("type", "taxTreatment.eventType", {
						unique: false,
					});
					txStore.createIndex("taxYear", "taxYear", { unique: false });
				}

				// Reports store
				if (!db.objectStoreNames.contains(this.REPORTS_STORE)) {
					const reportStore = db.createObjectStore(this.REPORTS_STORE, {
						keyPath: "id",
					});
					reportStore.createIndex("jurisdiction", "jurisdiction.code", {
						unique: false,
					});
					reportStore.createIndex("taxYear", "taxPeriod.year", {
						unique: false,
					});
					reportStore.createIndex("generatedAt", "generatedAt", {
						unique: false,
					});
				}

				// Cache store for tax calculations
				if (!db.objectStoreNames.contains(this.CACHE_STORE)) {
					db.createObjectStore(this.CACHE_STORE, { keyPath: "key" });
				}

				// Tax events store
				if (!db.objectStoreNames.contains(this.EVENTS_STORE)) {
					const eventStore = db.createObjectStore(this.EVENTS_STORE, {
						keyPath: "id",
					});
					eventStore.createIndex("timestamp", "timestamp", { unique: false });
					eventStore.createIndex("type", "type", { unique: false });
					eventStore.createIndex("year", "year", { unique: false });
				}
			};
		});
	}

	async close(): Promise<void> {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}

	async batchInsert(transactions: TaxableTransaction[]): Promise<void> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		const batchConfig = DEFAULT_BATCH_CONFIG;
		const batches = this.chunkArray(transactions, batchConfig.batchSize);

		for (const batch of batches) {
			await this.insertBatch(batch);

			if (batchConfig.progressCallback) {
				const processed =
					batches.indexOf(batch) * batchConfig.batchSize + batch.length;
				batchConfig.progressCallback(processed, transactions.length);
			}
		}
	}

	private async insertBatch(transactions: TaxableTransaction[]): Promise<void> {
		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(
				[this.TRANSACTIONS_STORE],
				"readwrite",
			);
			const store = transaction.objectStore(this.TRANSACTIONS_STORE);

			transaction.oncomplete = () => resolve();
			transaction.onerror = () =>
				reject(
					new StorageError(
						"Batch insert failed",
						"BATCH_INSERT_FAILED",
						"browser",
						{ batchSize: transactions.length },
					),
				);

			for (const tx of transactions) {
				const serialized = this.serializeTransaction(tx);
				store.add(serialized);
			}
		});
	}

	async query(filter: TransactionFilter): Promise<TaxableTransaction[]> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(
				[this.TRANSACTIONS_STORE],
				"readonly",
			);
			const store = transaction.objectStore(this.TRANSACTIONS_STORE);
			const results: TaxableTransaction[] = [];

			let request: IDBRequest;

			// Use appropriate index based on filter
			if (filter.dateRange) {
				const index = store.index("date");
				const range = IDBKeyRange.bound(
					filter.dateRange[0],
					filter.dateRange[1],
				);
				request = index.openCursor(range);
			} else if (filter.assets && filter.assets.length === 1) {
				const index = store.index("asset");
				request = index.openCursor(IDBKeyRange.only(filter.assets[0]));
			} else if (filter.exchanges && filter.exchanges.length === 1) {
				const index = store.index("exchange");
				request = index.openCursor(IDBKeyRange.only(filter.exchanges[0]));
			} else {
				request = store.openCursor();
			}

			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest).result;
				if (cursor) {
					const transaction = this.deserializeTransaction(cursor.value);
					if (this.matchesFilter(transaction, filter)) {
						results.push(transaction);
					}

					// Apply limit
					if (filter.limit && results.length >= filter.limit) {
						resolve(results);
						return;
					}

					cursor.continue();
				} else {
					// Apply offset
					const offset = filter.offset || 0;
					resolve(results.slice(offset));
				}
			};

			request.onerror = () =>
				reject(
					new StorageError("Query failed", "QUERY_FAILED", "browser", {
						filter,
					}),
				);
		});
	}

	async update(
		id: string,
		updates: Partial<TaxableTransaction>,
	): Promise<void> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(
				[this.TRANSACTIONS_STORE],
				"readwrite",
			);
			const store = transaction.objectStore(this.TRANSACTIONS_STORE);

			const getRequest = store.get(id);
			getRequest.onsuccess = () => {
				const existing = getRequest.result;
				if (!existing) {
					reject(
						new StorageError("Transaction not found", "NOT_FOUND", "browser", {
							id,
						}),
					);
					return;
				}

				const updated = {
					...this.deserializeTransaction(existing),
					...updates,
				};
				const serialized = this.serializeTransaction(updated);

				const putRequest = store.put(serialized);
				putRequest.onsuccess = () => resolve();
				putRequest.onerror = () =>
					reject(
						new StorageError("Update failed", "UPDATE_FAILED", "browser", {
							id,
							updates,
						}),
					);
			};

			getRequest.onerror = () =>
				reject(
					new StorageError(
						"Failed to retrieve transaction for update",
						"GET_FAILED",
						"browser",
						{ id },
					),
				);
		});
	}

	async delete(id: string): Promise<void> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(
				[this.TRANSACTIONS_STORE],
				"readwrite",
			);
			const store = transaction.objectStore(this.TRANSACTIONS_STORE);

			const request = store.delete(id);
			request.onsuccess = () => resolve();
			request.onerror = () =>
				reject(
					new StorageError("Delete failed", "DELETE_FAILED", "browser", { id }),
				);
		});
	}

	async cacheTaxCalculation(key: string, result: any): Promise<void> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.CACHE_STORE], "readwrite");
			const store = transaction.objectStore(this.CACHE_STORE);

			const cacheEntry = {
				key,
				result: JSON.stringify(result),
				timestamp: Date.now(),
				expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
			};

			const request = store.put(cacheEntry);
			request.onsuccess = () => resolve();
			request.onerror = () =>
				reject(
					new StorageError(
						"Cache write failed",
						"CACHE_WRITE_FAILED",
						"browser",
						{ key },
					),
				);
		});
	}

	async getCachedCalculation(key: string): Promise<any> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.CACHE_STORE], "readonly");
			const store = transaction.objectStore(this.CACHE_STORE);

			const request = store.get(key);
			request.onsuccess = () => {
				const entry = request.result;
				if (!entry) {
					resolve(null);
					return;
				}

				// Check expiration
				if (entry.expiresAt < Date.now()) {
					// Clean up expired entry
					this.db
						?.transaction([this.CACHE_STORE], "readwrite")
						.objectStore(this.CACHE_STORE)
						.delete(key);
					resolve(null);
					return;
				}

				try {
					const result = JSON.parse(entry.result);
					resolve(result);
				} catch (error) {
					reject(
						new StorageError(
							"Cache parse failed",
							"CACHE_PARSE_FAILED",
							"browser",
							{ key, error },
						),
					);
				}
			};

			request.onerror = () =>
				reject(
					new StorageError(
						"Cache read failed",
						"CACHE_READ_FAILED",
						"browser",
						{ key },
					),
				);
		});
	}

	async clearCache(): Promise<void> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.CACHE_STORE], "readwrite");
			const store = transaction.objectStore(this.CACHE_STORE);

			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = () =>
				reject(
					new StorageError(
						"Cache clear failed",
						"CACHE_CLEAR_FAILED",
						"browser",
					),
				);
		});
	}

	async storeReport(report: TaxReport): Promise<void> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(
				[this.REPORTS_STORE],
				"readwrite",
			);
			const store = transaction.objectStore(this.REPORTS_STORE);

			const serialized = {
				...report,
				serializedAt: new Date(),
				dataVersion: "1.0",
			};

			const request = store.put(serialized);
			request.onsuccess = () => resolve();
			request.onerror = () =>
				reject(
					new StorageError(
						"Report storage failed",
						"REPORT_STORE_FAILED",
						"browser",
						{ reportId: report.id },
					),
				);
		});
	}

	async getReport(id: string): Promise<TaxReport | null> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(
				[this.REPORTS_STORE],
				"readonly",
			);
			const store = transaction.objectStore(this.REPORTS_STORE);

			const request = store.get(id);
			request.onsuccess = () => {
				const result = request.result;
				resolve(result || null);
			};

			request.onerror = () =>
				reject(
					new StorageError(
						"Report retrieval failed",
						"REPORT_GET_FAILED",
						"browser",
						{ id },
					),
				);
		});
	}

	async listReports(): Promise<TaxReportSummary[]> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(
				[this.REPORTS_STORE],
				"readonly",
			);
			const store = transaction.objectStore(this.REPORTS_STORE);
			const results: TaxReportSummary[] = [];

			const request = store.openCursor();
			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest).result;
				if (cursor) {
					const report = cursor.value as TaxReport;
					results.push({
						id: report.id,
						jurisdiction: report.jurisdiction.code,
						taxYear: report.taxPeriod.year,
						generatedAt: report.generatedAt,
						transactionCount: report.metadata.totalTransactions,
						netTaxableAmount: report.summary.netTaxableAmount,
					});
					cursor.continue();
				} else {
					resolve(results);
				}
			};

			request.onerror = () =>
				reject(
					new StorageError(
						"Report list failed",
						"REPORT_LIST_FAILED",
						"browser",
					),
				);
		});
	}

	async getTransactionsByDateRange(
		start: Date,
		end: Date,
	): Promise<TaxableTransaction[]> {
		return this.query({ dateRange: [start, end] });
	}

	async getTransactionsByAsset(asset: string): Promise<TaxableTransaction[]> {
		return this.query({ assets: [asset] });
	}

	async getTaxableEvents(_year: number): Promise<TaxEvent[]> {
		// Implementation would query events store by year
		// For now, return empty array as TaxEvent model needs to be properly integrated
		return [];
	}

	async getStorageStats(): Promise<StorageStats> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		// Get storage quota if available
		let storageUsed = 0;
		let storageAvailable = 0;

		if ("storage" in navigator && "estimate" in navigator.storage) {
			try {
				const estimate = await navigator.storage.estimate();
				storageUsed = estimate.usage || 0;
				storageAvailable = estimate.quota || 0;
			} catch (_error) {
				// Fallback if storage API not available
			}
		}

		const [totalTransactions, totalReports, cacheSize] = await Promise.all([
			this.countRecords(this.TRANSACTIONS_STORE),
			this.countRecords(this.REPORTS_STORE),
			this.getCacheSize(),
		]);

		return {
			totalTransactions,
			totalReports,
			cacheSize,
			storageUsed,
			storageAvailable,
			platform: "browser",
		};
	}

	async cleanup(olderThan?: Date): Promise<void> {
		if (!this.db)
			throw new StorageError(
				"Database not initialized",
				"DB_NOT_INITIALIZED",
				"browser",
			);

		const cutoffDate =
			olderThan || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

		// Clean up expired cache entries
		await this.cleanupCache();

		// Optionally clean up old reports
		if (olderThan) {
			await this.cleanupOldReports(cutoffDate);
		}
	}

	async export(): Promise<string> {
		const [transactions, reports] = await Promise.all([
			this.query({}),
			this.listReports(),
		]);

		return JSON.stringify({
			version: "1.0",
			exportedAt: new Date(),
			transactions,
			reports,
		});
	}

	async import(data: string): Promise<void> {
		try {
			const parsed = JSON.parse(data);

			if (parsed.transactions && Array.isArray(parsed.transactions)) {
				await this.batchInsert(parsed.transactions);
			}

			if (parsed.reports && Array.isArray(parsed.reports)) {
				for (const report of parsed.reports) {
					await this.storeReport(report);
				}
			}
		} catch (error) {
			throw new StorageError("Import failed", "IMPORT_FAILED", "browser", {
				error,
			});
		}
	}

	// Helper methods

	private chunkArray<T>(array: T[], chunkSize: number): T[][] {
		const chunks: T[][] = [];
		for (let i = 0; i < array.length; i += chunkSize) {
			chunks.push(array.slice(i, i + chunkSize));
		}
		return chunks;
	}

	private serializeTransaction(transaction: TaxableTransaction): any {
		return {
			id: `${transaction.originalTransaction.id}`,
			...transaction,
			serializedAt: new Date(),
		};
	}

	private deserializeTransaction(data: any): TaxableTransaction {
		// Remove serialization metadata
		const { serializedAt: _serializedAt, ...transaction } = data;
		return transaction as TaxableTransaction;
	}

	private matchesFilter(
		transaction: TaxableTransaction,
		filter: TransactionFilter,
	): boolean {
		const asset = getTransactionAsset(transaction.originalTransaction);
		if (filter.assets && asset && !filter.assets.includes(asset)) {
			return false;
		}

		const source = getTransactionSource(transaction.originalTransaction);
		if (filter.exchanges && !filter.exchanges.includes(source)) {
			return false;
		}

		if (
			filter.transactionTypes &&
			!filter.transactionTypes.includes(transaction.originalTransaction.type)
		) {
			return false;
		}

		if (
			filter.taxEventTypes &&
			!filter.taxEventTypes.includes(transaction.taxTreatment.eventType)
		) {
			return false;
		}

		return true;
	}

	private async countRecords(storeName: string): Promise<number> {
		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([storeName], "readonly");
			const store = transaction.objectStore(storeName);

			const request = store.count();
			request.onsuccess = () => resolve(request.result);
			request.onerror = () =>
				reject(
					new StorageError("Count failed", "COUNT_FAILED", "browser", {
						storeName,
					}),
				);
		});
	}

	private async getCacheSize(): Promise<number> {
		// Estimate cache size in bytes
		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.CACHE_STORE], "readonly");
			const store = transaction.objectStore(this.CACHE_STORE);
			let totalSize = 0;

			const request = store.openCursor();
			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest).result;
				if (cursor) {
					totalSize += JSON.stringify(cursor.value).length * 2; // Rough estimate in bytes
					cursor.continue();
				} else {
					resolve(totalSize);
				}
			};

			request.onerror = () =>
				reject(
					new StorageError(
						"Cache size calculation failed",
						"CACHE_SIZE_FAILED",
						"browser",
					),
				);
		});
	}

	private async cleanupCache(): Promise<void> {
		const transaction = this.db!.transaction([this.CACHE_STORE], "readwrite");
		const store = transaction.objectStore(this.CACHE_STORE);
		const now = Date.now();

		const request = store.openCursor();
		request.onsuccess = (event) => {
			const cursor = (event.target as IDBRequest).result;
			if (cursor) {
				const entry = cursor.value;
				if (entry.expiresAt < now) {
					cursor.delete();
				}
				cursor.continue();
			}
		};
	}

	private async cleanupOldReports(cutoffDate: Date): Promise<void> {
		const transaction = this.db!.transaction([this.REPORTS_STORE], "readwrite");
		const store = transaction.objectStore(this.REPORTS_STORE);
		const index = store.index("generatedAt");

		const range = IDBKeyRange.upperBound(cutoffDate);
		const request = index.openCursor(range);

		request.onsuccess = (event) => {
			const cursor = (event.target as IDBRequest).result;
			if (cursor) {
				cursor.delete();
				cursor.continue();
			}
		};
	}
}
