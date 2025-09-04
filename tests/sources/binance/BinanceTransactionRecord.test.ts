import { describe, it, expect } from 'vitest';
import { BinanceTransactionRecord } from '@/sources/binance/BinanceTransactionRecord';
import { BatchEntryRecord } from '@/core/BatchEntryRecord';

describe('BinanceTransactionRecord', () => {
  describe('field definitions', () => {
    it('should have correct field definitions', () => {
      const record = new BinanceTransactionRecord();
      const descriptors = record.getFieldDescriptors();
      
      // Just verify we have descriptors
      expect(descriptors).toBeDefined();
      expect(descriptors.length).toBeGreaterThan(0);
    });
  });

  describe('parsing Binance CSV', () => {
    it('should parse valid Binance transaction', () => {
      const csvLine = '123456,2024-01-15 10:30:00,Spot,Buy,BTC,0.5,Buy BTC with USDT';
      
      const result = BatchEntryRecord.parse(BinanceTransactionRecord, csvLine);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.userId).toBe('123456');
      expect(result.data?.utcTime).toBe('2024-01-15 10:30:00');
      expect(result.data?.account).toBe('Spot');
      expect(result.data?.operation).toBe('Buy');
      expect(result.data?.coin).toBe('BTC');
      expect(result.data?.change).toBe('0.5');
      expect(result.data?.remark).toBe('Buy BTC with USDT');
    });

    it('should validate required fields', () => {
      const csvLine = ',2024-01-15 10:30:00,Spot,Buy,BTC,0.5,';
      
      const result = BatchEntryRecord.parse(BinanceTransactionRecord, csvLine);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('User ID is required');
    });

    it('should handle deposit operation', () => {
      const csvLine = '123456,2024-01-15 10:30:00,Spot,Deposit,BTC,1.5,Deposit from wallet';
      
      const result = BatchEntryRecord.parse(BinanceTransactionRecord, csvLine);
      
      expect(result.isValid).toBe(true);
      expect(result.data?.operation).toBe('Deposit');
      expect(result.data?.change).toBe('1.5');
    });

    it('should handle withdrawal operation', () => {
      const csvLine = '123456,2024-01-15 10:30:00,Spot,Withdraw,BTC,-0.5,Withdraw to wallet';
      
      const result = BatchEntryRecord.parse(BinanceTransactionRecord, csvLine);
      
      expect(result.isValid).toBe(true);
      expect(result.data?.operation).toBe('Withdraw');
      expect(result.data?.change).toBe('-0.5');
    });

    it('should handle staking operations', () => {
      const csvLine = '123456,2024-01-15 10:30:00,Earn,Staking Rewards,ETH,0.05,ETH staking reward';
      
      const result = BatchEntryRecord.parse(BinanceTransactionRecord, csvLine);
      
      expect(result.isValid).toBe(true);
      expect(result.data?.account).toBe('Earn');
      expect(result.data?.operation).toBe('Staking Rewards');
    });

    it('should handle fee operations', () => {
      const csvLine = '123456,2024-01-15 10:30:00,Spot,Fee,BNB,-0.001,Trading fee';
      
      const result = BatchEntryRecord.parse(BinanceTransactionRecord, csvLine);
      
      expect(result.isValid).toBe(true);
      expect(result.data?.operation).toBe('Fee');
      expect(result.data?.coin).toBe('BNB');
      expect(result.data?.change).toBe('-0.001');
    });
  });

  describe('output', () => {
    it('should output valid CSV line', () => {
      const record = new BinanceTransactionRecord();
      record.userId = '123456';
      record.utcTime = '2024-01-15 10:30:00';
      record.account = 'Spot';
      record.operation = 'Buy';
      record.coin = 'BTC';
      record.change = '0.5';
      record.remark = 'Buy BTC';
      
      const output = record.output();
      
      expect(output).toBe('123456,2024-01-15 10:30:00,Spot,Buy,BTC,0.5,Buy BTC');
    });
  });
});