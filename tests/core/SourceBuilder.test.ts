import { describe, it, expect } from 'vitest';
import { SourceBuilder } from '@/core/SourceBuilder';
import { Source } from '@/core/Source';
import { SourceParser } from '@/core/SourceParser';
import { SourceAdapter } from '@/core/SourceAdapter';
import { BatchEntryRecord } from '@/core/BatchEntryRecord';
import { Transaction } from '@/types/transactions';
import { ParseResult } from '@/types/results';
import { ConversionResult } from '@/types/results';

// Test record implementation
class TestRecord extends BatchEntryRecord<TestRecord> {
  id: string = '';
  value: string = '';
  
  constructor() {
    super();
    this.fieldFor(r => r.id, 'ID', 0);
    this.fieldFor(r => r.value, 'Value', 1);
  }
}

// Test parser implementation
class TestParser extends SourceParser<TestRecord> {
  protected get RecordClass(): new () => TestRecord {
    return TestRecord;
  }
}

// Test adapter implementation
class TestAdapter extends SourceAdapter<TestRecord> {
  get sourceName(): string {
    return 'test';
  }
  
  protected convertRecord(record: TestRecord): Transaction {
    // Return any valid transaction type - using Unknown
    return {
      type: 'UNKNOWN',
      id: record.id,
      timestamp: new Date(),
      source: 'test',
      rawData: {
        value: record.value
      },
      metadata: {
        notes: record.value
      }
    } as any; // Cast to any since Transaction is a union type
  }
}

describe('SourceBuilder', () => {
  describe('basic building', () => {
    it('should build a source with all components', () => {
      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: 'test',
          displayName: 'Test Source',
          description: 'Test source for unit tests'
        })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      expect(source).toBeInstanceOf(Source);
      expect(source.getInfo().name).toBe('test');
      expect(source.getInfo().displayName).toBe('Test Source');
    });

    it('should build source with minimal info', () => {
      const source = new SourceBuilder<TestRecord>()
        .withInfo({
          name: 'minimal',
          displayName: 'Minimal'
        })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      expect(source.getInfo().name).toBe('minimal');
      expect(source.getInfo().description).toBeUndefined();
    });

    it('should throw error if info is missing', () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withRecordClass(TestRecord)
          .withAdapter(new TestAdapter())
          .build();
      }).toThrow('Source info is required');
    });

    it('should throw error if record class is missing', () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo({ name: 'test', displayName: 'Test' })
          .withAdapter(new TestAdapter())
          .build();
      }).toThrow('Either provide a parser or set a record class');
    });

    it('should throw error if adapter is missing', () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo({ name: 'test', displayName: 'Test' })
          .withRecordClass(TestRecord)
          .build();
      }).toThrow('Either provide an adapter or set a conversion function');
    });
  });

  describe('fluent API', () => {
    it('should support method chaining', () => {
      const builder = new SourceBuilder<TestRecord>();
      
      const result = builder
        .withInfo({ name: 'chain', displayName: 'Chain Test' })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter());

      expect(result).toBe(builder);
    });

    it('should allow setting components in any order', () => {
      const source1 = new SourceBuilder<TestRecord>()
        .withAdapter(new TestAdapter())
        .withInfo({ name: 'order1', displayName: 'Order 1' })
        .withRecordClass(TestRecord)
        .build();

      const source2 = new SourceBuilder<TestRecord>()
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .withInfo({ name: 'order2', displayName: 'Order 2' })
        .build();

      expect(source1).toBeInstanceOf(Source);
      expect(source2).toBeInstanceOf(Source);
    });

    it('should allow overwriting components', () => {
      const adapter1 = new TestAdapter();
      const adapter2 = new TestAdapter();
      
      const source = new SourceBuilder<TestRecord>()
        .withInfo({ name: 'first', displayName: 'First' })
        .withInfo({ name: 'second', displayName: 'Second' })
        .withRecordClass(TestRecord)
        .withAdapter(adapter1)
        .withAdapter(adapter2)
        .build();

      expect(source.getInfo().name).toBe('second');
    });
  });

  describe('custom parser', () => {
    it('should use custom parser if provided', () => {
      const customParser = new TestParser();
      
      const source = new SourceBuilder<TestRecord>()
        .withInfo({ name: 'custom', displayName: 'Custom' })
        .withRecordClass(TestRecord)
        .withParser(customParser)
        .withAdapter(new TestAdapter())
        .build();

      expect(source).toBeInstanceOf(Source);
    });

    it('should create default parser if not provided', () => {
      const source = new SourceBuilder<TestRecord>()
        .withInfo({ name: 'default', displayName: 'Default' })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      expect(source).toBeInstanceOf(Source);
    });

    it('should prefer custom parser over record class', () => {
      class CustomParser extends SourceParser<TestRecord> {
        protected get RecordClass(): new () => TestRecord {
          return TestRecord;
        }
        
        parse(content: string): ParseResult<TestRecord> {
          return {
            records: [],
            errors: [],
            metadata: { 
              totalLines: 999,
              skippedRows: 0,
              parsedRows: 999
            }
          };
        }
      }

      const source = new SourceBuilder<TestRecord>()
        .withInfo({ name: 'custom', displayName: 'Custom' })
        .withRecordClass(TestRecord)
        .withParser(new CustomParser())
        .withAdapter(new TestAdapter())
        .build();

      const result = source.parse('test');
      expect(result.metadata.totalLines).toBe(999);
    });
  });

  describe('source info validation', () => {
    it('should accept complete source info', () => {
      const info = {
        name: 'complete',
        displayName: 'Complete Source',
        description: 'A complete source description',
        website: 'https://example.com',
        documentation: 'https://docs.example.com',
        supportedFormats: ['csv', 'json'] as const,
        tags: ['exchange', 'spot', 'futures']
      };

      const source = new SourceBuilder<TestRecord>()
        .withInfo(info)
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      const sourceInfo = source.getInfo();
      expect(sourceInfo.name).toBe('complete');
      expect(sourceInfo.website).toBe('https://example.com');
      expect(sourceInfo.supportedFormats).toEqual(['csv', 'json']);
      expect(sourceInfo.tags).toEqual(['exchange', 'spot', 'futures']);
    });

    it('should handle empty strings in optional fields', () => {
      const info = {
        name: 'empty',
        displayName: 'Empty Fields',
        description: '',
        website: ''
      };

      const source = new SourceBuilder<TestRecord>()
        .withInfo(info)
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      expect(source.getInfo().description).toBe('');
      expect(source.getInfo().website).toBe('');
    });
  });

  describe('adapter validation', () => {
    it('should work with custom adapter', () => {
      class CustomAdapter extends SourceAdapter<TestRecord> {
        get sourceName(): string {
          return 'custom-adapter';
        }
        
        protected convertRecord(record: TestRecord): Transaction {
          return {
            type: 'UNKNOWN',
            id: `custom-${record.id}`,
            timestamp: new Date('2024-01-01'),
            source: 'custom-adapter',
            rawData: {
              asset: 'CUSTOM',
              amount: 100
            }
          } as any;
        }
      }

      const source = new SourceBuilder<TestRecord>()
        .withInfo({ name: 'custom', displayName: 'Custom' })
        .withRecordClass(TestRecord)
        .withAdapter(new CustomAdapter())
        .build();

      const record = new TestRecord();
      record.id = '123';
      record.value = 'test';
      
      const result = source.convert([record]);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].id).toBe('custom-123');
      expect((result.transactions[0] as any).rawData.asset).toBe('CUSTOM');
    });
  });

  describe('error handling', () => {
    it('should accept empty name', () => {
      // Empty name doesn't throw - it's just an empty string
      const source = new SourceBuilder<TestRecord>()
        .withInfo({ name: '', displayName: 'No Name' })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();
      expect(source).toBeDefined();
    });

    it('should accept empty display name', () => {
      // Empty display name doesn't throw - it's just an empty string
      const source = new SourceBuilder<TestRecord>()
        .withInfo({ name: 'test', displayName: '' })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();
      expect(source).toBeDefined();
    });

    it('should handle null values appropriately', () => {
      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo(null as any)
          .withRecordClass(TestRecord)
          .withAdapter(new TestAdapter())
          .build();
      }).toThrow('Source info is required');

      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo({ name: 'test', displayName: 'Test' })
          .withRecordClass(null as any)
          .withAdapter(new TestAdapter())
          .build();
      }).toThrow();

      expect(() => {
        new SourceBuilder<TestRecord>()
          .withInfo({ name: 'test', displayName: 'Test' })
          .withRecordClass(TestRecord)
          .withAdapter(null as any)
          .build();
      }).toThrow('Either provide an adapter or set a conversion function');
    });
  });

  describe('integration', () => {
    it('should create functional source that can process data', async () => {
      const source = new SourceBuilder<TestRecord>()
        .withInfo({ name: 'integration', displayName: 'Integration Test' })
        .withRecordClass(TestRecord)
        .withAdapter(new TestAdapter())
        .build();

      const csvContent = 'ID,Value\n001,Test Value\n002,Another Value';
      const result = await source.process(csvContent, { hasHeaders: true });

      expect(result.transactions).toHaveLength(2);
      expect((result.transactions[0] as any).metadata.notes).toBe('Test Value');
      expect((result.transactions[1] as any).metadata.notes).toBe('Another Value');
      expect(result.metadata.source).toBe('integration');
    });
  });

  describe('type safety', () => {
    it('should maintain type safety throughout building', () => {
      class TypedRecord extends BatchEntryRecord<TypedRecord> {
        typedField: number = 0;
        constructor() {
          super();
        }
      }

      class TypedAdapter extends SourceAdapter<TypedRecord> {
        get sourceName(): string {
          return 'typed';
        }
        
        protected convertRecord(record: TypedRecord): Transaction {
          // This should compile with proper type checking
          const fieldValue = record.typedField;
          return {
            id: `typed-${fieldValue}`,
            timestamp: new Date(),
            type: TransactionType.OTHER,
            direction: TransactionDirection.NONE,
            asset: 'TYPED',
            amount: fieldValue,
            platform: 'typed'
          };
        }
      }

      const source = new SourceBuilder<TypedRecord>()
        .withInfo({ name: 'typed', displayName: 'Typed' })
        .withRecordClass(TypedRecord)
        .withAdapter(new TypedAdapter())
        .build();

      expect(source).toBeInstanceOf(Source);
    });
  });
});