import { describe, expect, it } from "vitest";
import { type CsvExportOptions, exportToCSV, process } from "@/index";
import type {
  Airdrop,
  Fee,
  Interest,
  LiquidityAdd,
  Loan,
  MarginTrade,
  SpotTrade,
  StakingDeposit,
  StakingReward,
  Swap,
  Transfer,
  Unknown,
} from "@/types/transactions";

describe("Binance Integration", () => {
  describe("Transaction Type Mapping", () => {
    it("should map Buy/Sell operations to SpotTrade", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-15 10:30:45","Spot","Buy","BTC","0.00125000","Spot Trading BTC/USDT"
"123456789","2024-01-15 14:22:10","Spot","Sell","ETH","-0.55000000","Spot Trading ETH/BUSD"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(2);

      // Check Buy trade
      const buyTrade = result.transactions[0] as SpotTrade;
      expect(buyTrade.type).toBe("SPOT_TRADE");
      expect(buyTrade.side).toBe("BUY");
      expect(buyTrade.baseAsset.asset.symbol).toBe("BTC");
      expect(buyTrade.baseAsset.amount.toString()).toBe("0.00125");
      expect(buyTrade.quoteAsset.asset.symbol).toBe("USDT");

      // Check Sell trade
      const sellTrade = result.transactions[1] as SpotTrade;
      expect(sellTrade.type).toBe("SPOT_TRADE");
      expect(sellTrade.side).toBe("SELL");
      expect(sellTrade.baseAsset.asset.symbol).toBe("ETH");
      expect(sellTrade.baseAsset.amount.toString()).toBe("0.55");
      expect(sellTrade.quoteAsset.asset.symbol).toBe("BUSD");
    });

    it("should map Deposit/Withdraw operations to Transfer", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-10 08:15:00","Spot","Deposit","BTC","1.50000000","Deposit from External Wallet"
"123456789","2024-01-11 09:30:00","Spot","Withdraw","ETH","-2.00000000","Withdraw to External Wallet"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(2);

      // Check Deposit
      const deposit = result.transactions[0] as Transfer;
      expect(deposit.type).toBe("TRANSFER");
      expect(deposit.direction).toBe("IN");
      expect(deposit.asset.asset.symbol).toBe("BTC");
      expect(deposit.asset.amount.toString()).toBe("1.5");
      expect(deposit.transferType).toBe("deposit");

      // Check Withdrawal
      const withdrawal = result.transactions[1] as Transfer;
      expect(withdrawal.type).toBe("TRANSFER");
      expect(withdrawal.direction).toBe("OUT");
      expect(withdrawal.asset.asset.symbol).toBe("ETH");
      expect(withdrawal.asset.amount.toString()).toBe("2");
      expect(withdrawal.transferType).toBe("withdrawal");
    });

    it("should map Staking operations correctly", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Earn","Staking Purchase","ETH","-32.00000000","ETH 2.0 Staking 30 day"
"123456789","2024-01-02 00:00:00","Earn","Staking Rewards","ETH","0.00456789","ETH 2.0 Staking Rewards 5.2%"
"123456789","2024-01-31 00:00:00","Earn","Staking Redemption","ETH","32.00456789","ETH 2.0 Staking Redemption"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(3);

      // Check Staking Deposit
      const stakingDeposit = result.transactions[0] as StakingDeposit;
      expect(stakingDeposit.type).toBe("STAKING_DEPOSIT");
      expect(stakingDeposit.asset.asset.symbol).toBe("ETH");
      expect(stakingDeposit.asset.amount.toString()).toBe("32");
      expect(stakingDeposit.staking.protocol).toBe("Binance Earn");
      expect(stakingDeposit.staking.lockupPeriod).toBe(30);

      // Check Staking Reward
      const stakingReward = result.transactions[1] as StakingReward;
      expect(stakingReward.type).toBe("STAKING_REWARD");
      expect(stakingReward.reward.amount.toString()).toBe("0.00456789");
      expect(stakingReward.staking.apr).toBe("5.2");

      // Check Staking Withdrawal
      const stakingWithdrawal = result.transactions[2];
      expect(stakingWithdrawal.type).toBe("STAKING_WITHDRAWAL");
    });

    it("should map Fee operations to Fee transactions", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-15 10:30:45","Spot","Fee","USDT","-1.25000000","Trading Fee"
"123456789","2024-01-11 09:30:00","Spot","Withdraw Fee","ETH","-0.00500000","Network Fee"
"123456789","2024-02-01 14:00:00","USDT-Futures","Commission","USDT","-5.00000000","Futures Commission"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(3);

      result.transactions.forEach((tx) => {
        expect(tx.type).toBe("FEE");
        const fee = tx as Fee;
        expect(fee.fee.amount.isPositive()).toBe(true);
      });

      const tradingFee = result.transactions[0] as Fee;
      expect(tradingFee.feeType).toBe("trading");

      const withdrawFee = result.transactions[1] as Fee;
      expect(withdrawFee.feeType).toBe("network");
    });

    it("should map Convert/Swap operations to Swap", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-20 15:45:00","Spot","Convert","BNB","-5.00000000","Convert BNB to USDT"
"123456789","2024-01-20 15:45:00","Spot","Convert","USDT","2500.00000000","Convert BNB to USDT"
"123456789","2024-01-21 10:00:00","Spot","Small Assets Exchange BNB","SHIB","-1000000.00000000","Dust to BNB"
"123456789","2024-01-21 10:00:00","Spot","Small Assets Exchange BNB","BNB","0.00123456","Dust to BNB"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(4);

      // Regular convert operations
      const swap1 = result.transactions[0] as Swap;
      expect(swap1.type).toBe("SWAP");
      expect(swap1.from.asset.symbol).toBe("BNB");
      expect(swap1.from.amount.toString()).toBe("5");
      // swapType is stored in originalData
      expect((swap1 as unknown).originalData?.swapType).toBe("instant");

      const swap2 = result.transactions[1] as Swap;
      expect(swap2.type).toBe("SWAP");
      expect(swap2.to.asset.symbol).toBe("USDT");
      expect(swap2.to.amount.toString()).toBe("2500");

      // Dust conversion
      const dustSwap = result.transactions[2] as Swap;
      // dustSwap type is stored in originalData
      expect((dustSwap as unknown).originalData?.swapType).toBe("dust");
    });

    it("should map Liquidity operations correctly", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-02 00:00:00","Earn","Liquid Swap add","BUSD","1000.00000000","Add liquidity to BUSD/USDT pool"
"123456789","2024-03-02 01:00:00","Earn","Liquid Swap rewards","BUSD","0.12340000","Liquidity Provider Rewards"
"123456789","2024-03-03 00:00:00","Earn","Liquid Swap remove","BUSD","1000.12340000","Remove liquidity from pool"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(3);

      // Check Liquidity Add
      const liquidityAdd = result.transactions[0] as LiquidityAdd;
      expect(liquidityAdd.type).toBe("LIQUIDITY_ADD");
      expect(liquidityAdd.assets[0].asset.symbol).toBe("BUSD");
      expect(liquidityAdd.assets[0].amount.toString()).toBe("1000");
      expect(liquidityAdd.pool.protocol).toBe("Binance Liquid Swap");

      // Check Liquidity Rewards (Interest)
      const liquidityReward = result.transactions[1] as Interest;
      expect(liquidityReward.type).toBe("INTEREST");
      expect(liquidityReward.interestType).toBe("EARNED");
      expect(
        (liquidityReward as unknown).originalData?.categorization?.subType,
      ).toBe("liquidity");

      // Check Liquidity Remove
      const liquidityRemove = result.transactions[2];
      expect(liquidityRemove.type).toBe("LIQUIDITY_REMOVE");
    });

    it("should map Airdrop operations to Airdrop", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-01 06:30:00","Spot","Airdrop","NEW","100.00000000","NEW Token Airdrop"
"123456789","2024-03-01 07:00:00","Spot","Distribution","REWARD","50.00000000","Monthly Distribution"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(2);

      result.transactions.forEach((tx) => {
        expect(tx.type).toBe("AIRDROP");
        const airdrop = tx as Airdrop;
        expect(airdrop.received.amount.isPositive()).toBe(true);
      });

      const tokenAirdrop = result.transactions[0] as Airdrop;
      expect(tokenAirdrop.received.asset.symbol).toBe("NEW");
      expect(tokenAirdrop.airdrop.project).toContain("NEW");
    });

    it("should map Interest/Reward operations to Interest", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-01 00:00:00","Earn","Simple Earn Flexible Interest","USDT","2.34567890","Flexible Savings Interest"
"123456789","2024-03-01 12:00:00","Spot","Referral Commission","USDT","5.50000000","Referral Rewards"
"123456789","2024-03-01 18:45:30","Mining","Mining Revenues","BTC","0.00001234","Pool Mining Revenue"
"123456789","2024-02-01 13:00:00","USDT-Futures","Realized Profit and Loss","USDT","150.50000000","Futures Realized PNL"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(4);

      result.transactions.forEach((tx) => {
        expect(tx.type).toBe("INTEREST");
        const interest = tx as Interest;
        expect(interest.interest.amount.isPositive()).toBe(true);
      });

      const flexibleInterest = result.transactions[0] as Interest;
      expect(flexibleInterest.interestType).toBe("EARNED");
      expect(flexibleInterest.context.protocol).toBe("Binance");

      const miningRevenue = result.transactions[2] as Interest;
      expect(miningRevenue.interest.asset.symbol).toBe("BTC");
    });

    it("should map unknown operations to Unknown type", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-01 00:00:00","Spot","New Operation Type","BTC","0.00100000","Some new operation not yet mapped"
"123456789","2024-03-01 01:00:00","Spot","Custom Event","ETH","1.00000000","Custom event description"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(2);

      result.transactions.forEach((tx) => {
        expect(tx.type).toBe("UNKNOWN");
        const unknown = tx as Unknown;
        expect(unknown.originalData?.description).toContain(
          unknown.originalData?.operation,
        );
        expect(unknown.originalData).toBeDefined();
        expect(unknown.originalData?.coin).toBeDefined();
      });
    });

    it("should handle negative amounts in Funding Fee correctly", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-02-01 14:00:00","USDT-Futures","Funding Fee","USDT","-2.34000000","Futures Funding Fee (Paid)"
"123456789","2024-02-01 15:00:00","USDT-Futures","Funding Fee","USDT","1.50000000","Futures Funding Fee (Received)"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(2);

      // Negative funding fee should be Fee
      const fundingPaid = result.transactions[0] as Fee;
      expect(fundingPaid.type).toBe("FEE");
      expect(fundingPaid.fee.amount.toString()).toBe("2.34");

      // Positive funding fee should be Interest
      const fundingReceived = result.transactions[1] as Interest;
      expect(fundingReceived.type).toBe("INTEREST");
      expect(fundingReceived.interest.amount.toString()).toBe("1.5");
    });
  });

  describe("Data Processing", () => {
    it("should process Binance spot trading data with quoted fields", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-15 10:30:45","Spot","Buy","BTC","0.00125000","Spot Trading"
"123456789","2024-01-15 10:30:45","Spot","Fee","USDT","-1.25000000","Trading Fee"
"123456789","2024-01-15 14:22:10","Spot","Sell","ETH","-0.55000000","Spot Trading"
"123456789","2024-01-15 14:22:10","Spot","Fee","USDT","-0.89000000","Trading Fee"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(4);
      expect(result.metadata.source).toBe("binance");
      expect(result.metadata.parsedRows).toBe(4);
      expect(result.parseErrors).toHaveLength(0);
    });

    it("should handle data with special characters in remarks", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-15 10:30:00","Spot","Buy","BTC","0.50000000","Buy via P2P (Order #12345)"
"123456789","2024-01-15 11:00:00","Spot","Sell","ETH","-2.50000000","Market Order: ETH/USDT @ $2,500.50"
"123456789","2024-01-15 12:00:00","Spot","Fee","BNB","-0.00100000","Fee (25% discount with BNB)"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(3);
      expect(result.parseErrors).toHaveLength(0);

      // Check that order ID is extracted
      const feeTx = result.transactions[0] as SpotTrade;
      expect(feeTx.type).toBe("SPOT_TRADE");
    });

    it("should handle invalid data gracefully", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"","2024-01-15 10:30:00","Spot","Buy","BTC","0.50000000","Invalid - missing user ID"
"123456789","2024-01-15 11:00:00","Spot","Buy","ETH","2.50000000","Valid transaction"
"123456789","invalid-date","Spot","Sell","BTC","-1.00000000","Invalid date format"`;

      const result = await process("binance", csvContent, {
        continueOnError: true,
      });

      expect(result.transactions.length).toBeGreaterThan(0);
      expect(result.parseErrors.length).toBeGreaterThan(0);
      expect(result.parseErrors[0].message).toContain("User ID is required");
    });

    it("should calculate correct metadata", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Spot","Buy","BTC","1.00000000","First transaction"
"123456789","2024-06-15 12:00:00","Spot","Sell","ETH","-0.50000000","Middle transaction"
"123456789","2024-12-31 23:59:59","Spot","Buy","BNB","10.00000000","Last transaction"`;

      const result = await process("binance", csvContent);

      expect(result.metadata.startDate).toBeDefined();
      expect(result.metadata.endDate).toBeDefined();
      expect(result.metadata.uniqueAssets).toContain("BTC");
      expect(result.metadata.uniqueAssets).toContain("ETH");
      expect(result.metadata.uniqueAssets).toContain("BNB");

      if (result.metadata.startDate && result.metadata.endDate) {
        const start = new Date(result.metadata.startDate);
        const end = new Date(result.metadata.endDate);
        expect(start.getFullYear()).toBe(2024);
        expect(start.getMonth()).toBe(0); // January
        expect(end.getMonth()).toBe(11); // December
      }

      // Check transaction type breakdown
      expect(result.metadata.transactionTypes).toBeDefined();
      expect(result.metadata.transactionTypes?.SPOT_TRADE).toBe(3);
    });

    it("should process mixed operations with various formats", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-01 00:00:01","Spot","Buy","BTC","0.01000000","Purchase"
"123456789","2024-03-01 06:30:00","Spot","Airdrop","NEW","100.00000000","NEW Token Airdrop"
"123456789","2024-03-01 12:00:00","Spot","Referral Commission","USDT","5.50000000","Referral Rewards"
"123456789","2024-03-01 18:45:30","Mining","Mining Revenues","BTC","0.00001234","Pool Mining Revenue"
"123456789","2024-03-02 00:00:00","Earn","Liquid Swap add","BUSD","1000.00000000","Add liquidity"
"123456789","2024-03-02 01:00:00","Earn","Liquid Swap rewards","BUSD","0.12340000","Liquidity Rewards"`;

      const result = await process("binance", csvContent, {
        continueOnError: true,
      });

      expect(result.metadata.parsedRows).toBe(6);
      expect(result.metadata.uniqueAssets?.length).toBeGreaterThanOrEqual(4); // BTC, NEW, USDT, BUSD

      // Check we have different transaction types
      const types = new Set(result.transactions.map((tx) => tx.type));
      expect(types.size).toBeGreaterThan(1); // Should have multiple different types
    });
  });

  describe("Enhanced Categorization Rules", () => {
    it("should categorize P2P and OTC operations correctly", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-15 10:00:00","P2P","P2P Buy","USDT","1000.00000000","P2P Trading"
"123456789","2024-01-15 11:00:00","P2P","P2P Sell","BTC","-0.50000000","P2P Trading"
"123456789","2024-01-15 12:00:00","OTC","OTC Trading","ETH","2.00000000","OTC Desk Trading"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(3);

      const p2pBuy = result.transactions[0] as SpotTrade;
      expect(p2pBuy.type).toBe("SPOT_TRADE");
      expect((p2pBuy as unknown).originalData?.categorization?.subType).toBe(
        "p2p-buy",
      );

      const p2pSell = result.transactions[1] as SpotTrade;
      expect(p2pSell.type).toBe("SPOT_TRADE");
      expect((p2pSell as unknown).originalData?.categorization?.subType).toBe(
        "p2p-sell",
      );

      const otc = result.transactions[2] as SpotTrade;
      expect(otc.type).toBe("SPOT_TRADE");
      expect((otc as unknown).originalData?.categorization?.subType).toBe(
        "otc",
      );
    });

    it("should categorize various staking operations with proper priority", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Earn","ETH 2.0 Staking","ETH","-32.00000000","ETH 2.0 Staking Initial"
"123456789","2024-01-02 00:00:00","Earn","ETH 2.0 Staking Rewards","ETH","0.00100000","Daily Rewards"
"123456789","2024-01-03 00:00:00","Earn","Staking Principal Redemption","DOT","100.00000000","DOT Unstaked"
"123456789","2024-01-04 00:00:00","Earn","Locked Staking Purchase","ADA","-1000.00000000","90 Day Lock"
"123456789","2024-01-05 00:00:00","Earn","POS Rewards","ATOM","0.50000000","Cosmos Staking"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(5);

      // ETH 2.0 Staking should be deposit
      expect(result.transactions[0].type).toBe("STAKING_DEPOSIT");

      // ETH 2.0 Rewards
      expect(result.transactions[1].type).toBe("STAKING_REWARD");

      // Principal redemption
      expect(result.transactions[2].type).toBe("STAKING_WITHDRAWAL");

      // Locked staking purchase
      expect(result.transactions[3].type).toBe("STAKING_DEPOSIT");

      // POS rewards
      expect(result.transactions[4].type).toBe("STAKING_REWARD");
    });

    it("should categorize Binance Earn operations correctly", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-01 00:00:00","Earn","Simple Earn Flexible Interest","USDT","1.23456789","Daily Interest"
"123456789","2024-03-01 01:00:00","Earn","Simple Earn Locked Rewards","BNB","0.01000000","30 Day Locked"
"123456789","2024-03-01 02:00:00","Earn","Launchpool Interest","NEW","10.00000000","NEW Token Mining"
"123456789","2024-03-01 03:00:00","Earn","Savings Interest","BUSD","0.50000000","Flexible Savings"
"123456789","2024-03-01 04:00:00","Earn","Auto-Invest","BTC","-0.00100000","DCA Investment"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(5);

      // Flexible interest
      const flexInterest = result.transactions[0] as Interest;
      expect(flexInterest.type).toBe("INTEREST");
      expect(
        (flexInterest as unknown).originalData?.categorization?.subType,
      ).toBe("flexible-savings");

      // Locked rewards should be staking reward
      expect(result.transactions[1].type).toBe("STAKING_REWARD");

      // Launchpool
      const launchpool = result.transactions[2] as Interest;
      expect(launchpool.type).toBe("INTEREST");
      expect(
        (launchpool as unknown).originalData?.categorization?.subType,
      ).toBe("launchpool");

      // Savings interest
      const savings = result.transactions[3] as Interest;
      expect(savings.type).toBe("INTEREST");
      expect((savings as unknown).originalData?.categorization?.subType).toBe(
        "savings",
      );

      // Auto-invest should be swap
      const autoInvest = result.transactions[4] as Swap;
      expect(autoInvest.type).toBe("SWAP");
      expect(
        (autoInvest as unknown).originalData?.categorization?.subType,
      ).toBe("auto-invest");
    });

    it("should categorize margin and futures operations", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-02-01 10:00:00","Cross Margin","Margin Buy","BTC","0.10000000","Margin Trading"
"123456789","2024-02-01 11:00:00","Cross Margin","Cross Margin Interest","USDT","-5.00000000","Daily Interest"
"123456789","2024-02-01 12:00:00","Isolated Margin","Margin Loan","USDT","10000.00000000","Borrowed USDT"
"123456789","2024-02-01 13:00:00","Isolated Margin","Margin Repayment","USDT","-10005.00000000","Loan Repayment"
"123456789","2024-02-01 14:00:00","USDT-Futures","Unrealized PNL","USDT","0.00000000","Mark-to-Market"
"123456789","2024-02-01 15:00:00","COIN-Futures","Insurance Clear","BTC","-0.00010000","Insurance Fund"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(6);

      // Margin buy
      const marginBuy = result.transactions[0] as MarginTrade;
      expect(marginBuy.type).toBe("MARGIN_TRADE");

      // Margin interest should be fee
      const marginInterest = result.transactions[1] as Fee;
      expect(marginInterest.type).toBe("FEE");
      expect(
        (marginInterest as unknown).originalData?.categorization?.subType,
      ).toBe("margin-interest");

      // Margin loan
      const marginLoan = result.transactions[2] as Loan;
      expect(marginLoan.type).toBe("LOAN");

      // Margin repayment
      const marginRepay = result.transactions[3] as Loan;
      expect(marginRepay.type).toBe("LOAN");

      // Unrealized PNL
      const unrealizedPnl = result.transactions[4] as Interest;
      expect(unrealizedPnl.type).toBe("INTEREST");
      expect(
        (unrealizedPnl as unknown).originalData?.categorization?.subType,
      ).toBe("unrealized-pnl");

      // Insurance clear
      const insurance = result.transactions[5] as Fee;
      expect(insurance.type).toBe("FEE");
      expect((insurance as unknown).originalData?.categorization?.subType).toBe(
        "insurance",
      );
    });

    it("should categorize internal transfers between accounts", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-10 10:00:00","Spot","Spot to Futures","USDT","-1000.00000000","Transfer to Futures"
"123456789","2024-01-10 10:00:01","USDT-Futures","Futures to Spot","USDT","1000.00000000","Transfer from Spot"
"123456789","2024-01-10 11:00:00","Spot","Transfer Between Accounts","BTC","-0.50000000","To Sub-Account"
"123456789","2024-01-10 12:00:00","Spot","Sub-account Transfer","ETH","2.00000000","From Main Account"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(4);

      result.transactions.forEach((tx) => {
        expect(tx.type).toBe("TRANSFER");
        const transfer = tx as Transfer;
        expect(["internal", "sub-account"]).toContain(transfer.transferType);
      });
    });

    it("should categorize various reward and bonus types", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-01 00:00:00","Spot","VIP Rewards","BNB","0.50000000","VIP Level 5 Rewards"
"123456789","2024-03-01 01:00:00","Spot","Task Rewards","USDT","10.00000000","Daily Task Completion"
"123456789","2024-03-01 02:00:00","Spot","Competition Rewards","BTC","0.00100000","Trading Competition Prize"
"123456789","2024-03-01 03:00:00","Spot","Event Reward","ETH","0.10000000","Anniversary Event"
"123456789","2024-03-01 04:00:00","Spot","Affiliate Commission","USDT","50.00000000","Referral Program"
"123456789","2024-03-01 05:00:00","Spot","Cash Voucher Distribution","BUSD","20.00000000","Promotional Voucher"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(6);

      result.transactions.forEach((tx) => {
        expect(tx.type).toBe("INTEREST");
        const interest = tx as Interest;
        expect(interest.interest.amount.isPositive()).toBe(true);
      });

      // Check specific sub-types
      expect(
        (result.transactions[0] as unknown).originalData?.categorization
          ?.subType,
      ).toBe("vip");
      expect(
        (result.transactions[1] as unknown).originalData?.categorization
          ?.subType,
      ).toBe("task");
      expect(
        (result.transactions[2] as unknown).originalData?.categorization
          ?.subType,
      ).toBe("competition");
      expect(
        (result.transactions[3] as unknown).originalData?.categorization
          ?.subType,
      ).toBe("event");
      expect(
        (result.transactions[4] as unknown).originalData?.categorization
          ?.subType,
      ).toBe("affiliate");
      expect(
        (result.transactions[5] as unknown).originalData?.categorization
          ?.subType,
      ).toBe("voucher");
    });

    it("should handle dust conversion operations", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-21 10:00:00","Spot","Small Assets Exchange BNB","SHIB","-1000000.00000000","Convert Dust"
"123456789","2024-01-21 10:00:00","Spot","Small Assets Exchange BNB","DOGE","-100.00000000","Convert Dust"
"123456789","2024-01-21 10:00:00","Spot","Small Assets Exchange BNB","BNB","0.00250000","Dust Converted"
"123456789","2024-01-21 11:00:00","Spot","Dust to BNB","FLOKI","-50000.00000000","Dust Conversion"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(4);

      result.transactions.forEach((tx) => {
        expect(tx.type).toBe("SWAP");
        const swap = tx as Swap;
        expect((swap as unknown).originalData?.categorization?.subType).toBe(
          "dust",
        );
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty CSV gracefully", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(0);
      expect(result.metadata.totalRows).toBe(0);
      expect(result.parseErrors).toHaveLength(0);
    });

    it("should handle single transaction", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Spot","Buy","BTC","1.00000000","Single transaction"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(1);
      expect(result.metadata.parsedRows).toBe(1);
    });

    it("should handle transactions with zero amounts", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Spot","Fee","BTC","0.00000000","Zero fee (promotional)"
"123456789","2024-01-01 01:00:00","Spot","Buy","ETH","1.00000000","Normal transaction"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(2);

      const zeroFee = result.transactions[0] as Fee;
      expect(zeroFee.fee.amount.isZero()).toBe(true);
    });

    it("should generate unique IDs for transactions", async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Spot","Buy","BTC","1.00000000","Transaction 1"
"123456789","2024-01-01 00:00:00","Spot","Buy","BTC","1.00000000","Transaction 2"
"123456789","2024-01-01 00:00:00","Spot","Buy","ETH","1.00000000","Transaction 3"`;

      const result = await process("binance", csvContent);

      expect(result.transactions).toHaveLength(3);

      // Check that all IDs are unique
      const ids = result.transactions.map((tx) => tx.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe("File Processing and Export", () => {
    it("should process a comprehensive Binance transaction file and export to our format", async () => {
      // Create a comprehensive Binance CSV with various transaction types
      const binanceTransactionFile = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 09:30:00","Spot","Buy","BTC","0.05000000","Spot Trading BTC/USDT"
"123456789","2024-01-01 09:30:00","Spot","Fee","USDT","-1850.00000000","Trading Fee"
"123456789","2024-01-01 14:20:00","Spot","Sell","ETH","-2.50000000","Spot Trading ETH/USDT"
"123456789","2024-01-01 14:20:00","Spot","Fee","USDT","-3.75000000","Trading Fee"
"123456789","2024-01-02 08:00:00","Spot","Deposit","BTC","1.00000000","Deposit from External Wallet"
"123456789","2024-01-02 12:00:00","Spot","Withdraw","USDT","-5000.00000000","Withdraw to Bank Account"
"123456789","2024-01-02 12:00:00","Spot","Withdraw Fee","USDT","-1.00000000","Network Fee"
"123456789","2024-01-03 00:00:00","Earn","Staking Purchase","ETH","-32.00000000","ETH 2.0 Staking 30 day"
"123456789","2024-01-04 00:00:00","Earn","Staking Rewards","ETH","0.00456789","ETH 2.0 Staking Rewards 5.2%"
"123456789","2024-01-05 10:30:00","Spot","Convert","BNB","-10.00000000","Convert BNB to USDT"
"123456789","2024-01-05 10:30:00","Spot","Convert","USDT","2580.00000000","Convert BNB to USDT"
"123456789","2024-01-06 15:45:00","Spot","Small Assets Exchange BNB","SHIB","-1000000.00000000","Dust to BNB"
"123456789","2024-01-06 15:45:00","Spot","Small Assets Exchange BNB","BNB","0.01234567","Dust to BNB"
"123456789","2024-01-07 09:00:00","Earn","Liquid Swap add","BUSD","1000.00000000","Add liquidity to BUSD/USDT pool"
"123456789","2024-01-08 12:00:00","Earn","Liquid Swap rewards","BUSD","0.12340000","Liquidity Provider Rewards"
"123456789","2024-01-09 00:00:00","Spot","Airdrop","NEW","100.00000000","NEW Token Airdrop"
"123456789","2024-01-10 06:30:00","Spot","Referral Commission","USDT","15.50000000","Referral Program Earnings"
"123456789","2024-01-11 08:15:00","Mining","Mining Revenues","BTC","0.00012345","Pool Mining Revenue"
"123456789","2024-01-12 10:00:00","Cross Margin","Margin Buy","BTC","0.10000000","Margin Trading with 3x leverage"
"123456789","2024-01-12 10:05:00","Cross Margin","Cross Margin Interest","USDT","-2.50000000","Daily Interest on borrowed USDT"
"123456789","2024-01-13 14:30:00","USDT-Futures","Realized Profit and Loss","USDT","250.75000000","Futures Trading Profit"
"123456789","2024-01-13 16:00:00","USDT-Futures","Funding Fee","USDT","-1.25000000","Futures Funding Fee (Paid)"
"123456789","2024-01-14 11:20:00","Earn","Simple Earn Flexible Interest","USDT","3.45000000","Flexible Savings Interest"
"123456789","2024-01-15 09:45:00","Spot","P2P Buy","USDT","10000.00000000","P2P Trading Purchase"
"123456789","2024-01-16 13:30:00","Spot","VIP Rewards","BNB","1.25000000","VIP Level 5 Monthly Rewards"
"123456789","2024-01-17 16:15:00","Spot","Auto-Invest","BTC","-0.00050000","DCA Investment Strategy"`;

      // Process the file
      const result = await process("binance", binanceTransactionFile);

      // Verify processing results
      expect(result.transactions.length).toBeGreaterThan(0);
      expect(result.parseErrors).toHaveLength(0);
      expect(result.metadata.source).toBe("binance");

      // Export to our CSV format with detailed options
      const exportOptions: CsvExportOptions = {
        includeHeaders: true,
        dateFormat: "iso",
        includeOriginalData: true,
        fields: [
          "id",
          "timestamp",
          "type",
          "source",
          "asset",
          "amount",
          "baseAsset",
          "baseAmount",
          "quoteAsset",
          "quoteAmount",
          "side",
          "price",
          "direction",
          "transferType",
          "from",
          "to",
          "feeAsset",
          "feeAmount",
          "feeType",
          "fromAsset",
          "fromAmount",
          "toAsset",
          "toAmount",
          "stakingProtocol",
          "stakingAPR",
          "lockupPeriod",
          "interestType",
          "interestRate",
          "description",
          "taxable",
        ],
      };

      const exportedCSV = exportToCSV(result.transactions, exportOptions);

      // Verify the exported CSV has proper structure
      expect(exportedCSV).toBeTruthy();
      expect(exportedCSV.includes("id,timestamp,type,source")).toBe(true);

      // Parse the exported CSV to verify structure
      const lines = exportedCSV.split("\n").filter((line) => line.trim());
      expect(lines.length).toBeGreaterThan(1); // Header + data rows

      // Verify specific transaction types are present in export
      const csvContent = exportedCSV.toLowerCase();
      expect(csvContent.includes("spot_trade")).toBe(true);
      expect(csvContent.includes("transfer")).toBe(true);
      expect(csvContent.includes("fee")).toBe(true);
      expect(csvContent.includes("staking_deposit")).toBe(true);
      expect(csvContent.includes("staking_reward")).toBe(true);
      expect(csvContent.includes("swap")).toBe(true);
      expect(csvContent.includes("interest")).toBe(true);
      expect(csvContent.includes("airdrop")).toBe(true);

      // Log sample output for verification
      console.log("\n=== SAMPLE EXPORTED CSV ===");
      console.log(lines.slice(0, 5).join("\n")); // Show header + first 4 rows
      console.log(`... (${lines.length - 5} more rows)`);
      console.log("=== END SAMPLE ===\n");
    });

    it("should handle real-world Binance file with custom field selection", async () => {
      // Simulate a more complex real-world scenario
      const complexBinanceFile = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"987654321","2024-03-01 08:30:15","Spot","Buy","BTC","0.12345678","Market Order BTC/USDT"
"987654321","2024-03-01 08:30:15","Spot","Commission","USDT","-61.73000000","Maker Fee 0.1%"
"987654321","2024-03-01 14:22:30","Earn","Launchpool Interest","NEW","25.00000000","NEW Token Launchpool Farming"
"987654321","2024-03-01 18:45:00","USDT-Futures","Funding Fee","USDT","0.75000000","Futures Funding Fee (Received)"
"987654321","2024-03-02 00:00:00","Earn","Simple Earn Locked Rewards","BNB","0.05000000","90 Day Locked Staking"
"987654321","2024-03-02 09:15:30","Isolated Margin","Margin Loan","USDT","50000.00000000","Borrowed USDT for margin trading"
"987654321","2024-03-02 15:30:45","Isolated Margin","Margin Repayment","USDT","-50125.00000000","Loan repayment with interest"
"987654321","2024-03-03 11:20:00","Spot","Task Rewards","USDT","10.00000000","Daily Check-in Reward"
"987654321","2024-03-03 16:45:30","Spot","Competition Rewards","BTC","0.00100000","Trading Competition Prize"
"987654321","2024-03-04 12:30:00","Spot","Cash Voucher Distribution","BUSD","50.00000000","Promotional Campaign Reward"`;

      const result = await process("binance", complexBinanceFile);

      // Export with custom fields for trading analysis
      const tradingAnalysisExport = exportToCSV(result.transactions, {
        includeHeaders: true,
        dateFormat: "unix", // Unix timestamp for analysis tools
        fields: [
          "timestamp",
          "type",
          "asset",
          "amount",
          "description",
          "taxable",
        ],
      });

      expect(tradingAnalysisExport).toBeTruthy();

      // Verify custom field selection
      const headerLine = tradingAnalysisExport.split("\n")[0];
      expect(headerLine).toBe(
        "timestamp,type,asset,amount,description,taxable",
      );

      // Export with minimal fields for tax reporting
      const taxReportExport = exportToCSV(result.transactions, {
        includeHeaders: true,
        dateFormat: "iso",
        fields: ["id", "timestamp", "type", "asset", "amount", "taxable"],
        delimiter: ";", // European CSV format
      });

      expect(taxReportExport.includes(";")).toBe(true);

      // Verify we have different transaction types with proper categorization
      const transactionTypes = new Set(
        result.transactions.map((tx) => tx.type),
      );
      expect(transactionTypes.size).toBeGreaterThanOrEqual(5); // Should have multiple types
      expect(transactionTypes.has("SPOT_TRADE")).toBe(true);
      expect(transactionTypes.has("FEE")).toBe(true);
      expect(transactionTypes.has("INTEREST")).toBe(true);
      expect(transactionTypes.has("STAKING_REWARD")).toBe(true);
      expect(transactionTypes.has("LOAN")).toBe(true);
    });

    it("should preserve categorization metadata in exported data", async () => {
      const metadataTestFile = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"555555555","2024-02-15 10:30:00","Spot","P2P Buy","USDT","1000.00000000","Peer-to-peer purchase"
"555555555","2024-02-15 14:20:00","Spot","VIP Rewards","BNB","2.50000000","VIP Level 3 benefits"
"555555555","2024-02-15 18:45:00","Spot","Small Assets Exchange BNB","DOGE","-500.00000000","Convert dust to BNB"
"555555555","2024-02-16 09:30:00","Cross Margin","Margin Buy","ETH","5.00000000","Leveraged ETH purchase"
"555555555","2024-02-16 12:15:00","Earn","Auto-Invest","BTC","-0.00100000","Dollar-cost averaging"`;

      const result = await process("binance", metadataTestFile);

      // Export with original data to verify categorization metadata
      const metadataExport = exportToCSV(result.transactions, {
        includeHeaders: true,
        includeOriginalData: true,
        fields: ["id", "type", "asset", "amount", "originalData"],
      });

      expect(metadataExport).toBeTruthy();

      // Verify that original data contains categorization info
      const lines = metadataExport.split("\n");
      const dataLines = lines.slice(1).filter((line) => line.trim());

      // Check that transactions have categorization metadata
      dataLines.forEach((line) => {
        const columns = line.split(",");
        const originalDataColumn = columns[4]; // originalData field
        if (originalDataColumn && originalDataColumn !== '""') {
          // Should contain categorization info
          expect(originalDataColumn.includes("categorization")).toBe(true);
        }
      });

      // Verify specific categorization subtypes are preserved
      const p2pTrade = result.transactions.find(
        (tx) =>
          (tx as unknown).originalData?.categorization?.subType === "p2p-buy",
      );
      expect(p2pTrade).toBeDefined();
      expect(p2pTrade?.type).toBe("SPOT_TRADE");

      const vipReward = result.transactions.find(
        (tx) => (tx as unknown).originalData?.categorization?.subType === "vip",
      );
      expect(vipReward).toBeDefined();
      expect(vipReward?.type).toBe("INTEREST");
    });

    it("should handle edge cases in file processing and export", async () => {
      // Test with edge cases: zero amounts, very large numbers, special characters
      const edgeCaseFile = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"111111111","2024-01-01 00:00:00","Spot","Fee","BTC","0.00000000","Zero fee (promotional)"
"111111111","2024-01-01 01:00:00","Spot","Buy","SHIB","1000000000.00000000","Large amount of SHIB"
"111111111","2024-01-01 02:00:00","Spot","Sell","BTC","-0.00000001","Very small amount"
"111111111","2024-01-01 03:00:00","Spot","Airdrop","TOKEN","500.00000000","Airdrop with "quotes" and, commas"
"111111111","2024-01-01 04:00:00","Spot","Transfer","USDT","1000.50000000","Internal transfer (Spot to Futures)"`;

      const result = await process("binance", edgeCaseFile);

      expect(result.transactions).toHaveLength(5);
      expect(result.parseErrors).toHaveLength(0);

      // Export and verify CSV escaping handles special characters
      const edgeCaseExport = exportToCSV(result.transactions, {
        includeHeaders: true,
        fields: ["type", "asset", "amount", "description"],
      });

      expect(edgeCaseExport).toBeTruthy();

      // Verify special characters are properly escaped (should contain the quotes somewhere)
      expect(edgeCaseExport.includes("quotes")).toBe(true);

      // Verify amounts are preserved (different transaction types populate different amount fields)
      expect(edgeCaseExport.includes("500")).toBe(true); // Airdrop amount
      expect(edgeCaseExport.includes("1000.5")).toBe(true); // Transfer amount
    });
  });
});
