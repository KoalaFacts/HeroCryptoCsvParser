import { beforeEach, describe, expect, it } from "vitest";
import { BatchEntryRecord } from "@/core/BatchEntryRecord";
import type { Plugin } from "@/plugins/Plugin";
import { PluginPipeline } from "@/plugins/PluginPipeline";
import { PluginRegistry } from "@/plugins/PluginRegistry";
import { Amount, Asset, DataSource, type Transfer } from "@/types/transactions";

class TestRecord extends BatchEntryRecord<TestRecord> {
	public value: string = "";

	constructor() {
		super();
	}
}

describe("PluginRegistry", () => {
	let registry: PluginRegistry;

	beforeEach(() => {
		registry = new PluginRegistry();
	});

	describe("plugin registration", () => {
		it("should register a plugin", () => {
			const plugin: Plugin = {
				name: "test-plugin",
				processLine: (_ctx, next) => next(),
			};

			registry.register(plugin);

			expect(registry.getPlugins()).toContain(plugin);
		});

		it("should throw error when registering plugin without name", () => {
			const plugin: Plugin = {
				name: "",
				processLine: (_ctx, next) => next(),
			};

			expect(() => registry.register(plugin)).toThrow(
				"Plugin must have a name",
			);
		});

		it("should throw error when registering duplicate plugin", () => {
			const plugin: Plugin = {
				name: "test-plugin",
				processLine: (_ctx, next) => next(),
			};

			registry.register(plugin);

			expect(() => registry.register(plugin)).toThrow(
				'Plugin "test-plugin" is already registered',
			);
		});

		it("should unregister a plugin", () => {
			const plugin: Plugin = {
				name: "test-plugin",
				processLine: (_ctx, next) => next(),
			};

			registry.register(plugin);
			registry.unregister("test-plugin");

			expect(registry.getPlugins()).not.toContain(plugin);
		});

		it("should check if plugin is registered", () => {
			const plugin: Plugin = {
				name: "test-plugin",
				processLine: (_ctx, next) => next(),
			};

			expect(registry.has("test-plugin")).toBe(false);
			registry.register(plugin);
			expect(registry.has("test-plugin")).toBe(true);
		});

		it("should clear all plugins", () => {
			const plugin1: Plugin = {
				name: "plugin1",
				processLine: (_ctx, next) => next(),
			};
			const plugin2: Plugin = {
				name: "plugin2",
				processLine: (_ctx, next) => next(),
			};

			registry.register(plugin1);
			registry.register(plugin2);
			expect(registry.getPlugins()).toHaveLength(2);

			registry.clear();
			expect(registry.getPlugins()).toHaveLength(0);
		});
	});
});

describe("PluginPipeline", () => {
	let registry: PluginRegistry;
	let pipeline: PluginPipeline;

	beforeEach(() => {
		registry = new PluginRegistry();
	});

	describe("line processing", () => {
		it("should process line through plugin chain", () => {
			const plugin1: Plugin = {
				name: "uppercase",
				processLine: (ctx, next) => {
					ctx.data = ctx.data?.toUpperCase() || null;
					return next();
				},
			};

			const plugin2: Plugin = {
				name: "trim",
				processLine: (ctx, next) => {
					ctx.data = ctx.data?.trim() || null;
					return next();
				},
			};

			registry.register(plugin1);
			registry.register(plugin2);
			pipeline = new PluginPipeline(registry.getPlugins());

			const result = pipeline.executeLine("  hello world  ", 1);

			expect(result).toBe("HELLO WORLD");
		});

		it("should filter lines when plugin returns null", () => {
			const plugin: Plugin = {
				name: "filter",
				processLine: (ctx, next) => {
					if (ctx.data?.includes("skip")) {
						ctx.data = null;
					}
					return next();
				},
			};

			registry.register(plugin);
			pipeline = new PluginPipeline(registry.getPlugins());

			expect(pipeline.executeLine("normal line", 1)).toBe("normal line");
			expect(pipeline.executeLine("skip this line", 2)).toBeNull();
		});

		it("should pass metadata through context", () => {
			let capturedMetadata: any = null;

			const plugin: Plugin = {
				name: "metadata-capture",
				processLine: (ctx, next) => {
					capturedMetadata = ctx.metadata;
					return next();
				},
			};

			registry.register(plugin);
			pipeline = new PluginPipeline(registry.getPlugins());
			pipeline.executeLine("test", 42);

			expect(capturedMetadata).toEqual({ lineNumber: 42 });
		});
	});

	describe("record processing", () => {
		it("should process record through plugin chain", () => {
			const plugin: Plugin = {
				name: "modify-record",
				processRecord: (ctx, next) => {
					if (ctx.data && ctx.data instanceof TestRecord) {
						ctx.data.value = "modified";
					}
					return next();
				},
			};

			registry.register(plugin);
			pipeline = new PluginPipeline(registry.getPlugins());

			const record = new TestRecord();
			record.value = "original";

			const result = pipeline.executeRecord(record, 1);

			expect(result?.value).toBe("modified");
		});

		it("should filter records when plugin returns null", () => {
			const plugin: Plugin = {
				name: "filter-record",
				processRecord: (ctx, next) => {
					if (
						ctx.data &&
						ctx.data instanceof TestRecord &&
						ctx.data.value === "filter"
					) {
						ctx.data = null;
					}
					return next();
				},
			};

			registry.register(plugin);
			pipeline = new PluginPipeline(registry.getPlugins());

			const record1 = new TestRecord();
			record1.value = "keep";

			const record2 = new TestRecord();
			record2.value = "filter";

			expect(pipeline.executeRecord(record1, 1)?.value).toBe("keep");
			expect(pipeline.executeRecord(record2, 2)).toBeNull();
		});
	});

	describe("transaction processing", () => {
		it("should process transaction through plugin chain", () => {
			const plugin: Plugin = {
				name: "modify-transaction",
				processTransaction: (ctx, next) => {
					if (ctx.data && ctx.data.type === "TRANSFER") {
						const transfer = ctx.data as Transfer;
						transfer.asset = {
							asset: new Asset("BTC"),
							amount: new Amount("1000"),
						};
					}
					return next();
				},
			};

			registry.register(plugin);
			pipeline = new PluginPipeline(registry.getPlugins());

			const transaction: Transfer = {
				id: "test-123",
				timestamp: new Date(),
				type: "TRANSFER",
				direction: "IN",
				asset: {
					asset: new Asset("BTC"),
					amount: new Amount("100"),
				},
				source: DataSource.custom("test", "exchange"),
				taxEvents: [],
			};

			const result = pipeline.executeTransaction(transaction, 0);

			expect((result as Transfer)?.asset?.amount.toString()).toBe("1000");
		});
	});

	describe("error handling", () => {
		it("should throw when plugin throws error", () => {
			const plugin: Plugin = {
				name: "error-plugin",
				processLine: (_ctx, _next) => {
					throw new Error("Plugin error");
				},
			};

			registry.register(plugin);
			pipeline = new PluginPipeline(registry.getPlugins());

			expect(() => pipeline.executeLine("test", 1)).toThrow("Plugin error");
		});
	});

	describe("plugin chain order", () => {
		it("should execute plugins in order of registration", () => {
			const order: string[] = [];

			const plugin1: Plugin = {
				name: "first",
				processLine: (_ctx, next) => {
					order.push("first-before");
					const result = next();
					order.push("first-after");
					return result;
				},
			};

			const plugin2: Plugin = {
				name: "second",
				processLine: (_ctx, next) => {
					order.push("second-before");
					const result = next();
					order.push("second-after");
					return result;
				},
			};

			registry.register(plugin1);
			registry.register(plugin2);
			pipeline = new PluginPipeline(registry.getPlugins());

			pipeline.executeLine("test", 1);

			expect(order).toEqual([
				"first-before",
				"second-before",
				"second-after",
				"first-after",
			]);
		});
	});

	describe("selective hook implementation", () => {
		it("should skip plugins that do not implement specific hook", () => {
			const plugin1: Plugin = {
				name: "line-only",
				processLine: (ctx, next) => {
					ctx.data = "modified";
					return next();
				},
			};

			const plugin2: Plugin = {
				name: "record-only",
				processRecord: (ctx, next) => {
					if (ctx.data && ctx.data instanceof TestRecord) {
						ctx.data.value = "modified";
					}
					return next();
				},
			};

			registry.register(plugin1);
			registry.register(plugin2);
			pipeline = new PluginPipeline(registry.getPlugins());

			// Plugin1 should affect lines but not records
			expect(pipeline.executeLine("test", 1)).toBe("modified");

			const record = new TestRecord();
			record.value = "original";

			// Plugin2 should affect records but not lines
			const recordResult = pipeline.executeRecord(record, 1);
			expect(recordResult?.value).toBe("modified");
		});
	});
});
