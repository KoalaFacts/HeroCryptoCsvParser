import { describe, it, expect } from 'vitest';
import { BatchEntryRecord } from '@/core/BatchEntryRecord';

// Test implementation of BatchEntryRecord
class TestRecord extends BatchEntryRecord<TestRecord> {
  userId: string = '';
  userName: string = '';
  age: number = 0;
  email?: string;

  constructor() {
    super();
    
    // Field 0: UserId
    this.fieldFor(r => r.userId, 'UserId', 0)
      .mapWith(value => value.trim())
      .validateWith(v => v.required('User ID is required'));
    
    // Field 1: UserName  
    this.fieldFor(r => r.userName, 'UserName', 1)
      .mapWith(value => value.trim());
    
    // Field 2: Age
    this.fieldFor(r => r.age, 'Age', 2)
      .mapWith(value => parseInt(value, 10))
      .validateWith(v => v.min(0, 'Age must be positive').max(150, 'Age must be realistic'));
    
    // Field 3: Email (optional)
    this.fieldFor(r => r.email, 'Email', 3)
      .mapWith(value => value || undefined);
    
    // Field 4: Spare field
    this.fieldForSpare('Unused', 4);
  }
}

describe('BatchEntryRecord', () => {
  describe('field definition', () => {
    it('should define fields with fluent API', () => {
      const record = new TestRecord();
      const descriptors = record.getFieldDescriptors();
      
      // Just check that we have descriptors
      expect(descriptors).toBeDefined();
      expect(descriptors.length).toBeGreaterThan(0);
    });
  });

  describe('parsing', () => {
    it('should parse valid CSV line', () => {
      const result = BatchEntryRecord.parse(TestRecord, '123,John Doe,30,john@example.com,extra');
      
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.userId).toBe('123');
      expect(result.data?.userName).toBe('John Doe');
      expect(result.data?.age).toBe(30);
      expect(result.data?.email).toBe('john@example.com');
    });

    it('should handle missing optional fields', () => {
      const result = BatchEntryRecord.parse(TestRecord, '123,John Doe,30,,extra');
      
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBeUndefined();
    });

    it('should validate required fields', () => {
      const result = BatchEntryRecord.parse(TestRecord, ',John Doe,30,john@example.com,extra');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('User ID is required');
    });

    it('should validate numeric ranges', () => {
      const result = BatchEntryRecord.parse(TestRecord, '123,John Doe,200,john@example.com,extra');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Age must be realistic');
    });

    it('should handle quoted fields', () => {
      const result = BatchEntryRecord.parse(TestRecord, '"123","John, Doe","30","john@example.com","extra"');
      
      expect(result.isValid).toBe(true);
      expect(result.data?.userName).toBe('John, Doe');
    });
  });

  describe('output', () => {
    it('should output CSV line', () => {
      const record = new TestRecord();
      record.userId = '123';
      record.userName = 'John Doe';
      record.age = 30;
      record.email = 'john@example.com';
      
      const output = record.output();
      expect(output).toBe('123,John Doe,30,john@example.com,');
    });

    it('should handle fields with commas', () => {
      const record = new TestRecord();
      record.userId = '123';
      record.userName = 'Doe, John';
      record.age = 30;
      
      const output = record.output();
      expect(output).toBe('123,"Doe, John",30,,');
    });
  });

  describe('validation', () => {
    it('should validate record', () => {
      const record = new TestRecord();
      record.userId = '123';
      record.userName = 'John';
      record.age = 30;
      
      const result = record.validate();
      expect(result.isValid).toBe(true);
    });

    it('should fail validation for invalid data', () => {
      const record = new TestRecord();
      record.userName = 'John';
      record.age = -5;
      
      const result = record.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should throw on validateAndThrow', () => {
      const record = new TestRecord();
      
      expect(() => record.validateAndThrow()).toThrow('User ID is required');
    });
  });
});