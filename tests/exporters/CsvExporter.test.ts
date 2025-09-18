import { describe, it, expect } from 'vitest';
import { CsvExporter, exportToCSV } from '@/exporters/CsvExporter';
import { 
  SpotTrade, 
  Transfer, 
  Fee, 
  Interest,
  Airdrop,
  StakingDeposit,
  Swap,
  DataSource
} from '@/types/transactions';
import { Asset, Amount } from '@/types/transactions';

describe('CsvExporter', () => {
  const createSampleTransactions = () => {
    const now = new Date('2024-01-01T00:00:00Z');
    
    const spotTrade: SpotTrade = {
      type: 'SPOT_TRADE',
      id: 'trade-1',
      timestamp: now,
      source: DataSource.BINANCE,
      taxEvents: [],
      baseAsset: {
        asset: new Asset('BTC'),
        amount: new Amount('0.5')
      },
      quoteAsset: {
        asset: new Asset('USDT'),
        amount: new Amount('25000')
      },
      side: 'BUY',
      price: '50000'
    };
    
    const transfer: Transfer = {
      type: 'TRANSFER',
      id: 'transfer-1',
      timestamp: new Date('2024-01-02T00:00:00Z'),
      source: DataSource.BINANCE,
      taxEvents: [],
      asset: {
        asset: new Asset('ETH'),
        amount: new Amount('2.0')
      },
      direction: 'IN',
      transferType: 'deposit',
      from: { platform: 'external' },
      to: { platform: 'binance', label: 'main' }
    };
    
    const fee: Fee = {
      type: 'FEE',
      id: 'fee-1',
      timestamp: new Date('2024-01-03T00:00:00Z'),
      source: DataSource.BINANCE,
      taxEvents: [],
      fee: {
        asset: new Asset('BNB'),
        amount: new Amount('0.01')
      },
      feeType: 'trading',
      description: 'Trading fee for order #123'
    };
    
    return [spotTrade, transfer, fee];
  };
  
  describe('Basic Export', () => {
    it('should export transactions to CSV with headers', () => {
      const transactions = createSampleTransactions();
      const exporter = new CsvExporter();
      const csv = exporter.export(transactions);
      
      expect(csv).toContain('id,timestamp,type,source');
      expect(csv).toContain('trade-1');
      expect(csv).toContain('SPOT_TRADE');
      expect(csv).toContain('BTC');
      expect(csv).toContain('0.5');
    });
    
    it('should export without headers when specified', () => {
      const transactions = createSampleTransactions();
      const exporter = new CsvExporter({ includeHeaders: false });
      const csv = exporter.export(transactions);
      
      expect(csv).not.toContain('id,timestamp,type,source');
      expect(csv).toContain('trade-1');
    });
    
    it('should handle empty transaction list', () => {
      const exporter = new CsvExporter();
      const csv = exporter.export([]);
      
      expect(csv).toBe('');
    });
  });
  
  describe('Date Formatting', () => {
    it('should format dates as ISO by default', () => {
      const transactions = createSampleTransactions();
      const exporter = new CsvExporter();
      const csv = exporter.export(transactions);
      
      expect(csv).toContain('2024-01-01T00:00:00.000Z');
    });
    
    it('should format dates as Unix timestamp when specified', () => {
      const transactions = createSampleTransactions();
      const exporter = new CsvExporter({ dateFormat: 'unix' });
      const csv = exporter.export(transactions);
      
      expect(csv).toContain('1704067200'); // Unix timestamp for 2024-01-01
    });
    
    it('should use custom date formatter', () => {
      const transactions = createSampleTransactions();
      const exporter = new CsvExporter({ 
        dateFormat: (date) => date.toLocaleDateString('en-US')
      });
      const csv = exporter.export(transactions);
      
      expect(csv).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // MM/DD/YYYY format
    });
  });
  
  describe('Custom Delimiters', () => {
    it('should use custom delimiter', () => {
      const transactions = createSampleTransactions();
      const exporter = new CsvExporter({ delimiter: ';' });
      const csv = exporter.export(transactions);
      
      expect(csv).toContain('id;timestamp;type;source');
      expect(csv).toContain('trade-1;');
    });
    
    it('should use custom quote character', () => {
      const fee: Fee = {
        type: 'FEE',
        id: 'fee-1',
        timestamp: new Date(),
        source: DataSource.BINANCE,
        taxEvents: [],
        fee: {
          asset: new Asset('BNB'),
          amount: new Amount('0.01')
        },
        feeType: 'trading',
        description: 'Fee with, comma'
      };
      
      const exporter = new CsvExporter({ quote: "'" });
      const csv = exporter.export([fee]);
      
      expect(csv).toContain("'Fee with, comma'");
    });
  });
  
  describe('Field Selection', () => {
    it('should export only specified fields', () => {
      const transactions = createSampleTransactions();
      const exporter = new CsvExporter({ 
        fields: ['id', 'type', 'asset', 'amount'] 
      });
      const csv = exporter.export(transactions);
      
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      expect(headers).toEqual(['id', 'type', 'asset', 'amount']);
      expect(headers).not.toContain('timestamp');
      expect(headers).not.toContain('source');
    });
  });
  
  describe('Transaction Type Handling', () => {
    it('should handle SpotTrade correctly', () => {
      const spotTrade: SpotTrade = {
        type: 'SPOT_TRADE',
        id: 'trade-1',
        timestamp: new Date(),
        source: DataSource.BINANCE,
        taxEvents: [],
        baseAsset: {
          asset: new Asset('BTC'),
          amount: new Amount('1.5')
        },
        quoteAsset: {
          asset: new Asset('USDT'),
          amount: new Amount('60000')
        },
        side: 'SELL',
        price: '40000'
      };
      
      const csv = exportToCSV([spotTrade]);
      
      expect(csv).toContain('BTC');
      expect(csv).toContain('1.5');
      expect(csv).toContain('USDT');
      expect(csv).toContain('60000');
      expect(csv).toContain('SELL');
      expect(csv).toContain('40000');
    });
    
    it('should handle Interest correctly', () => {
      const interest: Interest = {
        type: 'INTEREST',
        id: 'interest-1',
        timestamp: new Date(),
        source: DataSource.BINANCE,
        taxEvents: [],
        interest: {
          asset: new Asset('USDT'),
          amount: new Amount('10.50')
        },
        interestType: 'EARNED',
        context: {
          protocol: 'Binance Earn',
          rate: '5.2',
          period: 'daily'
        }
      };
      
      const csv = exportToCSV([interest]);
      
      expect(csv).toContain('INTEREST');
      expect(csv).toContain('USDT');
      expect(csv).toContain('10.5');
      expect(csv).toContain('EARNED');
      expect(csv).toContain('Binance Earn daily');
    });
    
    it('should handle Airdrop correctly', () => {
      const airdrop: Airdrop = {
        type: 'AIRDROP',
        id: 'airdrop-1',
        timestamp: new Date(),
        source: DataSource.BINANCE,
        taxEvents: [],
        received: {
          asset: new Asset('TOKEN'),
          amount: new Amount('1000')
        },
        airdrop: {
          project: 'NewProject',
          reason: 'Initial distribution'
        }
      };
      
      const csv = exportToCSV([airdrop]);
      
      expect(csv).toContain('AIRDROP');
      expect(csv).toContain('TOKEN');
      expect(csv).toContain('1000');
      expect(csv).toContain('NewProject: Initial distribution');
    });
    
    it('should handle Swap correctly', () => {
      const swap: Swap = {
        type: 'SWAP',
        id: 'swap-1',
        timestamp: new Date(),
        source: DataSource.BINANCE,
        taxEvents: [],
        from: {
          asset: new Asset('BTC'),
          amount: new Amount('0.1')
        },
        to: {
          asset: new Asset('ETH'),
          amount: new Amount('1.5')
        }
      };
      
      const csv = exportToCSV([swap]);
      
      expect(csv).toContain('SWAP');
      expect(csv).toContain('BTC');
      expect(csv).toContain('0.1');
      expect(csv).toContain('ETH');
      expect(csv).toContain('1.5');
    });
  });
  
  describe('CSV Escaping', () => {
    it('should escape values with commas', () => {
      const fee: Fee = {
        type: 'FEE',
        id: 'fee-1',
        timestamp: new Date(),
        source: DataSource.BINANCE,
        taxEvents: [],
        fee: {
          asset: new Asset('BNB'),
          amount: new Amount('0.01')
        },
        feeType: 'trading',
        description: 'Fee for order, with comma'
      };
      
      const csv = exportToCSV([fee]);
      
      expect(csv).toContain('"Fee for order, with comma"');
    });
    
    it('should escape values with quotes', () => {
      const fee: Fee = {
        type: 'FEE',
        id: 'fee-1',
        timestamp: new Date(),
        source: DataSource.BINANCE,
        taxEvents: [],
        fee: {
          asset: new Asset('BNB'),
          amount: new Amount('0.01')
        },
        feeType: 'trading',
        description: 'Fee for "special" order'
      };
      
      const csv = exportToCSV([fee]);
      
      expect(csv).toContain('"Fee for ""special"" order"');
    });
    
    it('should escape values with newlines', () => {
      const fee: Fee = {
        type: 'FEE',
        id: 'fee-1',
        timestamp: new Date(),
        source: DataSource.BINANCE,
        taxEvents: [],
        fee: {
          asset: new Asset('BNB'),
          amount: new Amount('0.01')
        },
        feeType: 'trading',
        description: 'Fee\nwith\nnewlines'
      };
      
      const csv = exportToCSV([fee]);
      
      expect(csv).toContain('"Fee\nwith\nnewlines"');
    });
  });
  
  describe('Custom Mapper', () => {
    it('should use custom mapper function', () => {
      const transactions = createSampleTransactions();
      const exporter = new CsvExporter({ includeHeaders: false });
      
      const csv = exporter.exportWithMapper(transactions, (tx) => ({
        id: tx.id,
        type: tx.type,
        timestamp: tx.timestamp.toISOString().split('T')[0] // Date only
      }));
      
      const lines = csv.split('\n');
      expect(lines[0]).toContain('trade-1');
      expect(lines[0]).toContain('SPOT_TRADE');
      expect(lines[0]).toContain('2024-01-01');
      expect(lines[1]).toContain('transfer-1');
      expect(lines[1]).toContain('TRANSFER');
      expect(lines[1]).toContain('2024-01-02');
    });
  });
  
  describe('Tax Events', () => {
    it('should mark taxable transactions', () => {
      const spotTrade: SpotTrade = {
        type: 'SPOT_TRADE',
        id: 'trade-1',
        timestamp: new Date(),
        source: DataSource.BINANCE,
        taxEvents: [{
          type: 'CAPITAL_GAIN',
          timestamp: new Date(),
          description: 'Sale of BTC',
          amount: {
            asset: new Asset('USDT'),
            amount: new Amount('15000')
          },
          transactionId: 'trade-1'
        }],
        baseAsset: {
          asset: new Asset('BTC'),
          amount: new Amount('0.5')
        },
        quoteAsset: {
          asset: new Asset('USDT'),
          amount: new Amount('25000')
        },
        side: 'SELL',
        price: '50000'
      };
      
      const csv = exportToCSV([spotTrade]);
      
      expect(csv).toContain(',true'); // taxable column should be true
    });
  });
});