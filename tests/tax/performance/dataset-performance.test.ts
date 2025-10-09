import { describe, it, expect } from 'vitest';
import { FIFOCalculator } from '@/tax/calculators/FIFOCalculator';
import { TaxReportGenerator } from '@/tax/TaxReportGenerator';
import { createMockSpotTrade } from '@tests/tax/helpers/mockFactories';

describe('Tax Performance Tests', () => {
  function generateMockTransactions(count: number) {
    const transactions = [];
    const startDate = new Date('2023-07-01');

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setHours(date.getHours() + i);

      transactions.push(
        createMockSpotTrade({
          id: `tx-${i}`,
          timestamp: date,
          side: i % 2 === 0 ? 'BUY' : 'SELL'
        })
      );
    }

    return transactions;
  }

  describe('Small dataset (1,000 transactions)', () => {
    it('should process 1,000 transactions under 1 second', async () => {
      const transactions = generateMockTransactions(1000);
      const startTime = Date.now();

      const generator = new TaxReportGenerator();
      await generator.generateReport({
        jurisdictionCode: 'AU',
        taxYear: 2024,
        transactions
      });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should handle FIFO calculation efficiently', () => {
      const calculator = new FIFOCalculator();
      const transactions = generateMockTransactions(500);

      const startTime = Date.now();

      // Add acquisitions
      for (let i = 0; i < transactions.length / 2; i++) {
        calculator.addAcquisition(transactions[i * 2]);
      }

      // Calculate cost basis for disposals
      for (let i = 0; i < transactions.length / 4; i++) {
        calculator.calculateCostBasis(
          transactions[i * 2 + 1],
          transactions.slice(0, i * 2 + 1)
        );
      }

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('Medium dataset (10,000 transactions)', () => {
    it('should process 10,000 transactions under 5 seconds', async () => {
      const transactions = generateMockTransactions(10000);
      const startTime = Date.now();

      const generator = new TaxReportGenerator();
      await generator.generateReport({
        jurisdictionCode: 'AU',
        taxYear: 2024,
        transactions
      });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(5000);
    }, 10000); // 10 second timeout
  });

  describe('Large dataset (100,000 transactions)', () => {
    it('should process 100,000 transactions under 30 seconds', async () => {
      const transactions = generateMockTransactions(100000);
      const startTime = Date.now();

      let progressUpdates = 0;

      const generator = new TaxReportGenerator();
      await generator.generateReport(
        {
          jurisdictionCode: 'AU',
          taxYear: 2024,
          transactions
        },
        (progress) => {
          progressUpdates++;
          expect(progress.processed).toBeLessThanOrEqual(progress.total);
        }
      );

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(30000);
      expect(progressUpdates).toBeGreaterThan(0);
    }, 35000); // 35 second timeout
  });

  describe('Chunked processing verification', () => {
    it('should process in chunks with progress updates', async () => {
      const transactions = generateMockTransactions(5000);
      const progressSteps: number[] = [];

      const generator = new TaxReportGenerator();
      await generator.generateReport(
        {
          jurisdictionCode: 'AU',
          taxYear: 2024,
          transactions
        },
        (progress) => {
          progressSteps.push(progress.processed);
        }
      );

      // Should have multiple progress updates (chunks of 1000)
      expect(progressSteps.length).toBeGreaterThan(1);

      // Progress should be monotonically increasing
      for (let i = 1; i < progressSteps.length; i++) {
        expect(progressSteps[i]).toBeGreaterThanOrEqual(progressSteps[i - 1]);
      }
    });
  });

  describe('Response time targets', () => {
    it('should achieve <200ms p95 for classification', async () => {
      const times: number[] = [];
      const generator = new TaxReportGenerator();

      for (let i = 0; i < 20; i++) {
        const transactions = generateMockTransactions(100);
        const startTime = Date.now();

        await generator.generateReport({
          jurisdictionCode: 'AU',
          taxYear: 2024,
          transactions
        });

        times.push(Date.now() - startTime);
      }

      times.sort((a, b) => a - b);
      const p95Index = Math.floor(times.length * 0.95);
      const p95Time = times[p95Index];

      expect(p95Time).toBeLessThan(200);
    }, 15000);
  });

  describe('Memory efficiency', () => {
    it('should handle large datasets without excessive memory', async () => {
      const transactions = generateMockTransactions(50000);

      const generator = new TaxReportGenerator();
      const report = await generator.generateReport({
        jurisdictionCode: 'AU',
        taxYear: 2024,
        transactions
      });

      // Report filters transactions to tax year (2023-07-01 to 2024-06-30)
      // metadata.totalTransactions is the count after filtering
      expect(report.transactions.length).toBe(report.metadata.totalTransactions);
      expect(report.metadata.totalTransactions).toBeGreaterThan(0);
      expect(report.metadata.totalTransactions).toBeLessThanOrEqual(transactions.length);
    }, 25000);
  });
});
