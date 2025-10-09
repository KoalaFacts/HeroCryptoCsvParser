import {
  type ConversionOptions,
  SourceAdapter,
} from "../../core/SourceAdapter";
import type { TransactionCategorizer } from "../../core/TransactionCategorizer";
import {
  type Airdrop,
  Amount,
  Asset,
  DataSource,
  type Fee,
  type Interest,
  type LiquidityAdd,
  type LiquidityRemove,
  type Loan,
  type MarginTrade,
  type SpotTrade,
  type StakingDeposit,
  type StakingReward,
  type StakingWithdrawal,
  type Swap,
  type Transaction,
  type Transfer,
  type Unknown,
} from "../../types/transactions";
import { BinanceTransactionCategorizer } from "./BinanceTransactionCategorizer";
import type { BinanceTransactionRecord } from "./BinanceTransactionRecord";

/**
 * Adapts Binance transaction records to unified transaction format
 */
export class BinanceAdapter extends SourceAdapter<BinanceTransactionRecord> {
  private categorizer: TransactionCategorizer;

  constructor(categorizer?: TransactionCategorizer) {
    super();

    // Use provided categorizer or create default Binance categorizer
    this.categorizer = categorizer || new BinanceTransactionCategorizer();
  }

  get sourceName(): string {
    return "binance";
  }

  /**
   * Get the categorizer (for testing or external configuration)
   */
  getCategorizer(): TransactionCategorizer {
    return this.categorizer;
  }

  protected convertRecord(
    record: BinanceTransactionRecord,
    _options?: ConversionOptions,
  ): Transaction {
    const changeAmount = new Amount(record.change);
    const timestamp = new Date(record.utcTime);

    // Generate unique ID with counter for duplicate timestamps
    const baseId = `binance-${record.userId}-${timestamp.getTime()}-${record.coin}`;
    const id = this.generateUniqueId(baseId);

    // Use categorizer to determine transaction type
    const categorization = this.categorizer.categorize(
      record.operation,
      record.remark,
    );

    // Debug: log categorization for testing
    if (process.env.NODE_ENV === "test" && categorization.type === "UNKNOWN") {
      console.log(
        `Unknown operation: "${record.operation}" - Remark: "${record.remark}"`,
      );
    }

    // Special handling for amount-dependent categorization
    if (categorization.type === "INTEREST" || categorization.type === "FEE") {
      // For operations like "Realized Profit and Loss" or "Funding Fee"
      if (
        record.operation.toLowerCase().includes("profit and loss") ||
        record.operation.toLowerCase().includes("funding fee")
      ) {
        if (changeAmount.isNegative()) {
          const feeTx = this.createFee(id, timestamp, record, changeAmount);
          (feeTx as any).originalData = { categorization };
          return feeTx;
        } else {
          const interestTx = this.createInterest(
            id,
            timestamp,
            record,
            changeAmount,
          );
          (interestTx as any).originalData = { categorization };
          return interestTx;
        }
      }
    }

    // Map categorization result to specific transaction creators
    switch (categorization.type) {
      case "SPOT_TRADE": {
        const spotTradeTx = this.createSpotTrade(
          id,
          timestamp,
          record,
          changeAmount,
        );
        (spotTradeTx as any).originalData = { categorization };
        return spotTradeTx;
      }

      case "TRANSFER": {
        const direction =
          categorization.subType === "deposit"
            ? "IN"
            : categorization.subType === "withdrawal"
              ? "OUT"
              : "INTERNAL";
        return this.createTransfer(id, timestamp, record, direction);
      }

      case "STAKING_DEPOSIT":
        return this.createStakingDeposit(id, timestamp, record, changeAmount);

      case "STAKING_WITHDRAWAL":
        return this.createStakingWithdrawal(
          id,
          timestamp,
          record,
          changeAmount,
        );

      case "STAKING_REWARD":
        return this.createStakingReward(id, timestamp, record, changeAmount);

      case "SWAP": {
        const swapTx = this.createSwap(id, timestamp, record, changeAmount);
        (swapTx as any).originalData = {
          categorization,
          swapType: categorization.subType || "instant",
        };
        return swapTx;
      }

      case "LIQUIDITY_ADD":
        return this.createLiquidityAdd(id, timestamp, record, changeAmount);

      case "LIQUIDITY_REMOVE":
        return this.createLiquidityRemove(id, timestamp, record, changeAmount);

      case "AIRDROP": {
        const airdropTx = this.createAirdrop(
          id,
          timestamp,
          record,
          changeAmount,
        );
        (airdropTx as any).originalData = { categorization };
        return airdropTx;
      }

      case "FEE": {
        const feeTx = this.createFee(id, timestamp, record, changeAmount);
        (feeTx as any).originalData = { categorization };
        return feeTx;
      }

      case "INTEREST": {
        const interestTx = this.createInterest(
          id,
          timestamp,
          record,
          changeAmount,
        );
        (interestTx as any).originalData = { categorization };
        return interestTx;
      }

      case "MARGIN_TRADE": {
        const marginTradeTx = this.createMarginTrade(
          id,
          timestamp,
          record,
          changeAmount,
        );
        (marginTradeTx as any).originalData = { categorization };
        return marginTradeTx;
      }

      case "LOAN":
        return this.createLoan(id, timestamp, record, changeAmount);
      default:
        return this.createUnknown(id, timestamp, record, changeAmount);
    }
  }

  // Track used IDs to ensure uniqueness
  private usedIds = new Set<string>();
  private idCounter = new Map<string, number>();

  /**
   * Generate a unique ID, adding a counter if necessary
   */
  private generateUniqueId(baseId: string): string {
    if (!this.usedIds.has(baseId)) {
      this.usedIds.add(baseId);
      return baseId;
    }

    // If ID exists, add counter
    const count = (this.idCounter.get(baseId) || 0) + 1;
    this.idCounter.set(baseId, count);
    const uniqueId = `${baseId}-${count}`;
    this.usedIds.add(uniqueId);
    return uniqueId;
  }

  private createSpotTrade(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): SpotTrade {
    // Parse trading pair from remark if possible
    const remark = record.remark.toLowerCase();
    let quoteAsset = "USDT"; // Default quote asset

    // Try to extract quote asset from remark (e.g., "Spot Trading BTC/USDT")
    const pairMatch = remark.match(/([A-Z]+)\/([A-Z]+)/i);
    if (pairMatch) {
      quoteAsset = pairMatch[2].toUpperCase();
    }

    return {
      type: "SPOT_TRADE",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      baseAsset: {
        asset: new Asset(record.coin),
        amount: changeAmount.abs(),
      },
      quoteAsset: {
        asset: new Asset(quoteAsset),
        amount: new Amount("0"), // Would need additional data to calculate
      },
      side: changeAmount.isPositive() ? "BUY" : "SELL",
      price: "0", // Would need additional data to calculate
    };
  }

  private createTransfer(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    direction: "IN" | "OUT" | "INTERNAL",
  ): Transfer {
    return {
      type: "TRANSFER",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      asset: {
        asset: new Asset(record.coin),
        amount: new Amount(record.change).abs(),
      },
      direction,
      transferType:
        direction === "IN"
          ? "deposit"
          : direction === "OUT"
            ? "withdrawal"
            : "internal",
      from:
        direction === "IN"
          ? { platform: "external" }
          : { platform: "binance", label: record.account },
      to:
        direction === "OUT"
          ? { platform: "external" }
          : { platform: "binance", label: record.account },
    };
  }

  private createStakingDeposit(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): StakingDeposit {
    const lockPeriod = this.extractLockPeriod(record.remark);
    return {
      type: "STAKING_DEPOSIT",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      asset: {
        asset: new Asset(record.coin),
        amount: changeAmount.abs(),
      },
      staking: {
        protocol: "Binance Earn",
        lockupPeriod: lockPeriod ? parseInt(lockPeriod, 10) : undefined,
        apr: this.extractAPR(record.remark),
      },
    };
  }

  private createStakingWithdrawal(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): StakingWithdrawal {
    return {
      type: "STAKING_WITHDRAWAL",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      asset: {
        asset: new Asset(record.coin),
        amount: changeAmount.abs(),
      },
      staking: {
        protocol: "Binance Earn",
      },
    };
  }

  private createStakingReward(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): StakingReward {
    return {
      type: "STAKING_REWARD",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      reward: {
        asset: new Asset(record.coin),
        amount: changeAmount.abs(),
      },
      staking: {
        protocol: "Binance Earn",
        apr: this.extractAPR(record.remark),
      },
    };
  }

  private createSwap(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): Swap {
    // For swaps/converts, we only see one side at a time
    // The full swap requires pairing with the opposite transaction
    const isFrom = changeAmount.isNegative();

    return {
      type: "SWAP",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      from: isFrom
        ? {
            asset: new Asset(record.coin),
            amount: changeAmount.abs(),
          }
        : {
            asset: new Asset("UNKNOWN"),
            amount: new Amount("0"),
          },
      to: !isFrom
        ? {
            asset: new Asset(record.coin),
            amount: changeAmount.abs(),
          }
        : {
            asset: new Asset("UNKNOWN"),
            amount: new Amount("0"),
          },
      // Additional metadata
      originalData: {
        platform: "Binance Convert",
        swapType: record.operation.includes("Small Assets")
          ? "dust"
          : "instant",
      },
    } as Swap;
  }

  private createLiquidityAdd(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): LiquidityAdd {
    return {
      type: "LIQUIDITY_ADD",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      assets: [
        {
          asset: new Asset(record.coin),
          amount: changeAmount.abs(),
        },
      ],
      lpTokens: {
        asset: new Asset(`${record.coin}-LP`),
        amount: new Amount("0"), // Would need additional data
      },
      pool: {
        protocol: "Binance Liquid Swap",
        name: `${record.coin} Pool`,
      },
    };
  }

  private createLiquidityRemove(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): LiquidityRemove {
    return {
      type: "LIQUIDITY_REMOVE",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      assets: [
        {
          asset: new Asset(record.coin),
          amount: changeAmount.abs(),
        },
      ],
      lpTokens: {
        asset: new Asset(`${record.coin}-LP`),
        amount: new Amount("0"), // Would need additional data
      },
      pool: {
        protocol: "Binance Liquid Swap",
        name: `${record.coin} Pool`,
      },
    };
  }

  private createAirdrop(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): Airdrop {
    return {
      type: "AIRDROP",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      received: {
        asset: new Asset(record.coin),
        amount: changeAmount.abs(),
      },
      airdrop: {
        project: this.extractProject(record.remark),
        reason: record.remark,
      },
    };
  }

  private createFee(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): Fee {
    return {
      type: "FEE",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      fee: {
        asset: new Asset(record.coin),
        amount: changeAmount.abs(),
      },
      feeType: this.determineFeeType(record.operation, record.remark),
      relatedTransactionId: this.extractRelatedTransaction(record.remark),
      description: record.remark,
    };
  }

  private createInterest(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): Interest {
    // Get the categorization result to check for subType
    const _categorization = this.categorizer.categorize(
      record.operation,
      record.remark,
    );

    // Determine interest type based on amount sign
    const interestType: "EARNED" | "PAID" = changeAmount.isPositive()
      ? "EARNED"
      : "PAID";

    return {
      type: "INTEREST",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      interest: {
        asset: new Asset(record.coin),
        amount: changeAmount.abs(),
      },
      interestType: interestType as "EARNED" | "PAID",
      context: {
        protocol: "Binance",
        rate: this.extractAPR(record.remark),
        period: this.extractPeriod(record.operation),
      },
    };
  }

  private createUnknown(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    _changeAmount: Amount,
  ): Unknown {
    return {
      type: "UNKNOWN",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      originalData: {
        description: `${record.operation}: ${record.remark}`,
        userId: record.userId,
        account: record.account,
        operation: record.operation,
        coin: record.coin,
        change: record.change,
        remark: record.remark,
      },
    };
  }

  // Helper methods
  private extractLockPeriod(remark: string): string | undefined {
    const match = remark.match(/(\d+)\s*(day|month|year)/i);
    return match ? match[1] : undefined;
  }

  private extractPeriod(operation: string): string {
    const op = operation.toLowerCase();
    if (op.includes("daily")) return "daily";
    if (op.includes("monthly")) return "monthly";
    if (op.includes("flexible")) return "flexible";
    return "variable";
  }

  private extractAPR(remark: string): string | undefined {
    const match = remark.match(/(\d+\.?\d*)%/);
    return match ? match[1] : undefined;
  }

  private extractProject(remark: string): string {
    // Extract token name or project from remark
    const match = remark.match(/([A-Z]+)\s+Token|([A-Z]+)\s+Airdrop/i);
    return match ? match[1] || match[2] : remark;
  }

  private determineFeeType(
    operation: string,
    remark: string,
  ): "trading" | "network" | "platform" | "other" {
    const op = operation.toLowerCase();
    const rmk = remark.toLowerCase();
    if (op.includes("trading") || rmk.includes("trading")) return "trading";
    if (
      op.includes("withdraw") ||
      op.includes("network") ||
      rmk.includes("network")
    )
      return "network";
    if (op.includes("platform") || rmk.includes("platform")) return "platform";
    return "other";
  }

  private extractRelatedTransaction(remark: string): string | undefined {
    // Try to extract order ID or transaction reference
    const match = remark.match(/#(\w+)|Order\s+(\w+)/i);
    return match ? match[1] || match[2] : undefined;
  }

  private createMarginTrade(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): MarginTrade {
    return {
      type: "MARGIN_TRADE",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      baseAsset: {
        asset: new Asset(record.coin),
        amount: changeAmount.abs(),
      },
      quoteAsset: {
        asset: new Asset("USDT"), // Default quote asset
        amount: new Amount("0"),
      },
      side: changeAmount.isPositive() ? "BUY" : "SELL",
      price: "0", // Would need additional data
      margin: {
        leverage: "1", // Would need additional data
        interestRate: undefined,
      },
    };
  }

  private createLoan(
    id: string,
    timestamp: Date,
    record: BinanceTransactionRecord,
    changeAmount: Amount,
  ): Loan {
    return {
      type: "LOAN",
      id,
      timestamp,
      source: DataSource.BINANCE,
      taxEvents: [],
      asset: {
        asset: new Asset(record.coin),
        amount: changeAmount.abs(),
      },
      operation: changeAmount.isPositive() ? "BORROW" : "REPAY",
      loan: {
        protocol: "Binance Margin",
        interestRate: undefined,
        collateral: undefined,
      },
    };
  }
}
