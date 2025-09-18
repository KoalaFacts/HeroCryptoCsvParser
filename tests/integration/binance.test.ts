import { describe, it, expect } from 'vitest';
import { process } from '@/index';
import { 
  Transaction,
  SpotTrade,
  Transfer,
  StakingDeposit,
  StakingReward,
  Swap,
  LiquidityAdd,
  Interest,
  Fee,
  Airdrop,
  Unknown
} from '@/types/transactions';

describe('Binance Integration', () => {
  describe('Transaction Type Mapping', () => {
    it('should map Buy/Sell operations to SpotTrade', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-15 10:30:45","Spot","Buy","BTC","0.00125000","Spot Trading BTC/USDT"
"123456789","2024-01-15 14:22:10","Spot","Sell","ETH","-0.55000000","Spot Trading ETH/BUSD"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(2);
      
      // Check Buy trade
      const buyTrade = result.transactions[0] as SpotTrade;
      expect(buyTrade.type).toBe('SPOT_TRADE');
      expect(buyTrade.side).toBe('BUY');
      expect(buyTrade.baseAsset.asset.symbol).toBe('BTC');
      expect(buyTrade.baseAsset.amount.toString()).toBe('0.00125');
      expect(buyTrade.quoteAsset.asset.symbol).toBe('USDT');
      
      // Check Sell trade
      const sellTrade = result.transactions[1] as SpotTrade;
      expect(sellTrade.type).toBe('SPOT_TRADE');
      expect(sellTrade.side).toBe('SELL');
      expect(sellTrade.baseAsset.asset.symbol).toBe('ETH');
      expect(sellTrade.baseAsset.amount.toString()).toBe('0.55');
      expect(sellTrade.quoteAsset.asset.symbol).toBe('BUSD');
    });

    it('should map Deposit/Withdraw operations to Transfer', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-10 08:15:00","Spot","Deposit","BTC","1.50000000","Deposit from External Wallet"
"123456789","2024-01-11 09:30:00","Spot","Withdraw","ETH","-2.00000000","Withdraw to External Wallet"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(2);
      
      // Check Deposit
      const deposit = result.transactions[0] as Transfer;
      expect(deposit.type).toBe('TRANSFER');
      expect(deposit.direction).toBe('IN');
      expect(deposit.asset.asset.symbol).toBe('BTC');
      expect(deposit.asset.amount.toString()).toBe('1.5');
      expect(deposit.transferType).toBe('deposit');
      
      // Check Withdrawal
      const withdrawal = result.transactions[1] as Transfer;
      expect(withdrawal.type).toBe('TRANSFER');
      expect(withdrawal.direction).toBe('OUT');
      expect(withdrawal.asset.asset.symbol).toBe('ETH');
      expect(withdrawal.asset.amount.toString()).toBe('2');
      expect(withdrawal.transferType).toBe('withdrawal');
    });

    it('should map Staking operations correctly', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Earn","Staking Purchase","ETH","-32.00000000","ETH 2.0 Staking 30 day"
"123456789","2024-01-02 00:00:00","Earn","Staking Rewards","ETH","0.00456789","ETH 2.0 Staking Rewards 5.2%"
"123456789","2024-01-31 00:00:00","Earn","Staking Redemption","ETH","32.00456789","ETH 2.0 Staking Redemption"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(3);
      
      // Check Staking Deposit
      const stakingDeposit = result.transactions[0] as StakingDeposit;
      expect(stakingDeposit.type).toBe('STAKING_DEPOSIT');
      expect(stakingDeposit.asset.asset.symbol).toBe('ETH');
      expect(stakingDeposit.asset.amount.toString()).toBe('32');
      expect(stakingDeposit.staking.protocol).toBe('Binance Earn');
      expect(stakingDeposit.staking.lockupPeriod).toBe(30);
      
      // Check Staking Reward
      const stakingReward = result.transactions[1] as StakingReward;
      expect(stakingReward.type).toBe('STAKING_REWARD');
      expect(stakingReward.reward.amount.toString()).toBe('0.00456789');
      expect(stakingReward.staking.apr).toBe('5.2');
      
      // Check Staking Withdrawal
      const stakingWithdrawal = result.transactions[2];
      expect(stakingWithdrawal.type).toBe('STAKING_WITHDRAWAL');
    });

    it('should map Fee operations to Fee transactions', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-15 10:30:45","Spot","Fee","USDT","-1.25000000","Trading Fee"
"123456789","2024-01-11 09:30:00","Spot","Withdraw Fee","ETH","-0.00500000","Network Fee"
"123456789","2024-02-01 14:00:00","USDT-Futures","Commission","USDT","-5.00000000","Futures Commission"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(3);
      
      result.transactions.forEach(tx => {
        expect(tx.type).toBe('FEE');
        const fee = tx as Fee;
        expect(fee.fee.amount.isPositive()).toBe(true);
      });
      
      const tradingFee = result.transactions[0] as Fee;
      expect(tradingFee.feeType).toBe('trading');
      
      const withdrawFee = result.transactions[1] as Fee;
      expect(withdrawFee.feeType).toBe('network');
    });

    it('should map Convert/Swap operations to Swap', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-20 15:45:00","Spot","Convert","BNB","-5.00000000","Convert BNB to USDT"
"123456789","2024-01-20 15:45:00","Spot","Convert","USDT","2500.00000000","Convert BNB to USDT"
"123456789","2024-01-21 10:00:00","Spot","Small Assets Exchange BNB","SHIB","-1000000.00000000","Dust to BNB"
"123456789","2024-01-21 10:00:00","Spot","Small Assets Exchange BNB","BNB","0.00123456","Dust to BNB"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(4);
      
      // Regular convert operations
      const swap1 = result.transactions[0] as Swap;
      expect(swap1.type).toBe('SWAP');
      expect(swap1.from.asset.symbol).toBe('BNB');
      expect(swap1.from.amount.toString()).toBe('5');
      // swapType is stored in originalData
      expect((swap1 as any).originalData?.swapType).toBe('instant');
      
      const swap2 = result.transactions[1] as Swap;
      expect(swap2.type).toBe('SWAP');
      expect(swap2.to.asset.symbol).toBe('USDT');
      expect(swap2.to.amount.toString()).toBe('2500');
      
      // Dust conversion
      const dustSwap = result.transactions[2] as Swap;
      // dustSwap type is stored in originalData
      expect((dustSwap as any).originalData?.swapType).toBe('dust');
    });

    it('should map Liquidity operations correctly', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-02 00:00:00","Earn","Liquid Swap add","BUSD","1000.00000000","Add liquidity to BUSD/USDT pool"
"123456789","2024-03-02 01:00:00","Earn","Liquid Swap rewards","BUSD","0.12340000","Liquidity Provider Rewards"
"123456789","2024-03-03 00:00:00","Earn","Liquid Swap remove","BUSD","1000.12340000","Remove liquidity from pool"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(3);
      
      // Check Liquidity Add
      const liquidityAdd = result.transactions[0] as LiquidityAdd;
      expect(liquidityAdd.type).toBe('LIQUIDITY_ADD');
      expect(liquidityAdd.assets[0].asset.symbol).toBe('BUSD');
      expect(liquidityAdd.assets[0].amount.toString()).toBe('1000');
      expect(liquidityAdd.pool.protocol).toBe('Binance Liquid Swap');
      
      // Check Liquidity Rewards (Interest)
      const liquidityReward = result.transactions[1] as Interest;
      expect(liquidityReward.type).toBe('INTEREST');
      expect(liquidityReward.interestType).toBe('liquidity');
      
      // Check Liquidity Remove
      const liquidityRemove = result.transactions[2];
      expect(liquidityRemove.type).toBe('LIQUIDITY_REMOVE');
    });

    it('should map Airdrop operations to Airdrop', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-01 06:30:00","Spot","Airdrop","NEW","100.00000000","NEW Token Airdrop"
"123456789","2024-03-01 07:00:00","Spot","Distribution","REWARD","50.00000000","Monthly Distribution"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(2);
      
      result.transactions.forEach(tx => {
        expect(tx.type).toBe('AIRDROP');
        const airdrop = tx as Airdrop;
        expect(airdrop.received.amount.isPositive()).toBe(true);
      });
      
      const tokenAirdrop = result.transactions[0] as Airdrop;
      expect(tokenAirdrop.received.asset.symbol).toBe('NEW');
      expect(tokenAirdrop.airdrop.project).toContain('NEW');
    });

    it('should map Interest/Reward operations to Interest', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-01 00:00:00","Earn","Simple Earn Flexible Interest","USDT","2.34567890","Flexible Savings Interest"
"123456789","2024-03-01 12:00:00","Spot","Referral Commission","USDT","5.50000000","Referral Rewards"
"123456789","2024-03-01 18:45:30","Mining","Mining Revenues","BTC","0.00001234","Pool Mining Revenue"
"123456789","2024-02-01 13:00:00","USDT-Futures","Realized Profit and Loss","USDT","150.50000000","Futures Realized PNL"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(4);
      
      result.transactions.forEach(tx => {
        expect(tx.type).toBe('INTEREST');
        const interest = tx as Interest;
        expect(interest.interest.amount.isPositive()).toBe(true);
      });
      
      const flexibleInterest = result.transactions[0] as Interest;
      expect(flexibleInterest.interestType).toBe('EARNED');
      expect(flexibleInterest.context.protocol).toBe('Binance');
      
      const miningRevenue = result.transactions[2] as Interest;
      expect(miningRevenue.interest.asset.symbol).toBe('BTC');
    });

    it('should map unknown operations to Unknown type', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-01 00:00:00","Spot","New Operation Type","BTC","0.00100000","Some new operation not yet mapped"
"123456789","2024-03-01 01:00:00","Spot","Custom Event","ETH","1.00000000","Custom event description"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(2);
      
      result.transactions.forEach(tx => {
        expect(tx.type).toBe('UNKNOWN');
        const unknown = tx as Unknown;
        expect(unknown.originalData?.description).toContain(unknown.originalData?.operation);
        expect(unknown.originalData).toBeDefined();
        expect(unknown.originalData?.coin).toBeDefined();
      });
    });

    it('should handle negative amounts in Funding Fee correctly', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-02-01 14:00:00","USDT-Futures","Funding Fee","USDT","-2.34000000","Futures Funding Fee (Paid)"
"123456789","2024-02-01 15:00:00","USDT-Futures","Funding Fee","USDT","1.50000000","Futures Funding Fee (Received)"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(2);
      
      // Negative funding fee should be Fee
      const fundingPaid = result.transactions[0] as Fee;
      expect(fundingPaid.type).toBe('FEE');
      expect(fundingPaid.fee.amount.toString()).toBe('2.34');
      
      // Positive funding fee should be Interest
      const fundingReceived = result.transactions[1] as Interest;
      expect(fundingReceived.type).toBe('INTEREST');
      expect(fundingReceived.interest.amount.toString()).toBe('1.5');
    });
  });

  describe('Data Processing', () => {
    it('should process Binance spot trading data with quoted fields', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-15 10:30:45","Spot","Buy","BTC","0.00125000","Spot Trading"
"123456789","2024-01-15 10:30:45","Spot","Fee","USDT","-1.25000000","Trading Fee"
"123456789","2024-01-15 14:22:10","Spot","Sell","ETH","-0.55000000","Spot Trading"
"123456789","2024-01-15 14:22:10","Spot","Fee","USDT","-0.89000000","Trading Fee"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(4);
      expect(result.metadata.source).toBe('binance');
      expect(result.metadata.parsedRows).toBe(4);
      expect(result.parseErrors).toHaveLength(0);
    });

    it('should handle data with special characters in remarks', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-15 10:30:00","Spot","Buy","BTC","0.50000000","Buy via P2P (Order #12345)"
"123456789","2024-01-15 11:00:00","Spot","Sell","ETH","-2.50000000","Market Order: ETH/USDT @ $2,500.50"
"123456789","2024-01-15 12:00:00","Spot","Fee","BNB","-0.00100000","Fee (25% discount with BNB)"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(3);
      expect(result.parseErrors).toHaveLength(0);
      
      // Check that order ID is extracted
      const feeTx = result.transactions[0] as SpotTrade;
      expect(feeTx.type).toBe('SPOT_TRADE');
    });

    it('should handle invalid data gracefully', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"","2024-01-15 10:30:00","Spot","Buy","BTC","0.50000000","Invalid - missing user ID"
"123456789","2024-01-15 11:00:00","Spot","Buy","ETH","2.50000000","Valid transaction"
"123456789","invalid-date","Spot","Sell","BTC","-1.00000000","Invalid date format"`;

      const result = await process('binance', csvContent, { continueOnError: true });
      
      expect(result.transactions.length).toBeGreaterThan(0);
      expect(result.parseErrors.length).toBeGreaterThan(0);
      expect(result.parseErrors[0].message).toContain('User ID is required');
    });

    it('should calculate correct metadata', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Spot","Buy","BTC","1.00000000","First transaction"
"123456789","2024-06-15 12:00:00","Spot","Sell","ETH","-0.50000000","Middle transaction"
"123456789","2024-12-31 23:59:59","Spot","Buy","BNB","10.00000000","Last transaction"`;

      const result = await process('binance', csvContent);
      
      expect(result.metadata.startDate).toBeDefined();
      expect(result.metadata.endDate).toBeDefined();
      expect(result.metadata.uniqueAssets).toContain('BTC');
      expect(result.metadata.uniqueAssets).toContain('ETH');
      expect(result.metadata.uniqueAssets).toContain('BNB');
      
      if (result.metadata.startDate && result.metadata.endDate) {
        const start = new Date(result.metadata.startDate);
        const end = new Date(result.metadata.endDate);
        expect(start.getFullYear()).toBe(2024);
        expect(start.getMonth()).toBe(0); // January
        expect(end.getMonth()).toBe(11); // December
      }
      
      // Check transaction type breakdown
      expect(result.metadata.transactionTypes).toBeDefined();
      expect(result.metadata.transactionTypes?.['SPOT_TRADE']).toBe(3);
    });

    it('should process mixed operations with various formats', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-03-01 00:00:01","Spot","Buy","BTC","0.01000000","Purchase"
"123456789","2024-03-01 06:30:00","Spot","Airdrop","NEW","100.00000000","NEW Token Airdrop"
"123456789","2024-03-01 12:00:00","Spot","Referral Commission","USDT","5.50000000","Referral Rewards"
"123456789","2024-03-01 18:45:30","Mining","Mining Revenues","BTC","0.00001234","Pool Mining Revenue"
"123456789","2024-03-02 00:00:00","Earn","Liquid Swap add","BUSD","1000.00000000","Add liquidity"
"123456789","2024-03-02 01:00:00","Earn","Liquid Swap rewards","BUSD","0.12340000","Liquidity Rewards"`;

      const result = await process('binance', csvContent, { continueOnError: true });
      
      expect(result.metadata.parsedRows).toBe(6);
      expect(result.metadata.uniqueAssets?.length).toBeGreaterThanOrEqual(4); // BTC, NEW, USDT, BUSD
      
      // Check we have different transaction types
      const types = new Set(result.transactions.map(tx => tx.type));
      expect(types.size).toBeGreaterThan(1); // Should have multiple different types
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty CSV gracefully', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(0);
      expect(result.metadata.totalRows).toBe(0);
      expect(result.parseErrors).toHaveLength(0);
    });

    it('should handle single transaction', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Spot","Buy","BTC","1.00000000","Single transaction"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(1);
      expect(result.metadata.parsedRows).toBe(1);
    });

    it('should handle transactions with zero amounts', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Spot","Fee","BTC","0.00000000","Zero fee (promotional)"
"123456789","2024-01-01 01:00:00","Spot","Buy","ETH","1.00000000","Normal transaction"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(2);
      
      const zeroFee = result.transactions[0] as Fee;
      expect(zeroFee.fee.amount.isZero()).toBe(true);
    });

    it('should generate unique IDs for transactions', async () => {
      const csvContent = `"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
"123456789","2024-01-01 00:00:00","Spot","Buy","BTC","1.00000000","Transaction 1"
"123456789","2024-01-01 00:00:00","Spot","Buy","BTC","1.00000000","Transaction 2"
"123456789","2024-01-01 00:00:00","Spot","Buy","ETH","1.00000000","Transaction 3"`;

      const result = await process('binance', csvContent);
      
      expect(result.transactions).toHaveLength(3);
      
      // Check that all IDs are unique
      const ids = result.transactions.map(tx => tx.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });
});