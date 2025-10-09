import type { FieldDescriptor } from "../FieldDescriptor";
import type { BatchEntryRecordOptions } from "./BatchEntryRecordOptions";

export class CsvBatchEntryRecordOptions implements BatchEntryRecordOptions {
  delimiter = ",";
  hasHeaders = true;
  skipEmptyLines = true;
  trim = true;

  static Default = new CsvBatchEntryRecordOptions();

  validateFieldDefinitions(
    descriptors: FieldDescriptor<any>[],
    recordName: string,
  ): void {
    const indices = descriptors.map(
      (d) => d.definition.fieldLocator.fieldIndex,
    );
    const uniqueIndices = new Set(indices);

    if (indices.length !== uniqueIndices.size) {
      throw new Error(`Duplicate field indices found in ${recordName}`);
    }

    // Check for gaps in indices
    const sortedIndices = Array.from(uniqueIndices).sort((a, b) => a - b);
    for (let i = 0; i < sortedIndices.length - 1; i++) {
      if (sortedIndices[i + 1] - sortedIndices[i] > 1) {
        console.warn(`Gap in field indices detected in ${recordName}`);
      }
    }
  }

  writeLine(fields: string[], descriptors: FieldDescriptor<any>[]): string {
    const orderedFields = descriptors
      .sort(
        (a, b) =>
          a.definition.fieldLocator.fieldIndex -
          b.definition.fieldLocator.fieldIndex,
      )
      .map((_d, i) => fields[i] || "");

    return orderedFields.map((f) => this.escapeField(f)).join(this.delimiter);
  }

  readLine(line: string, descriptors: FieldDescriptor<any>[]): string[] {
    const fields = this.parseCSVLine(line);
    const result: string[] = [];

    for (const descriptor of descriptors) {
      const index = descriptor.definition.fieldLocator.fieldIndex;

      if (
        descriptor.definition.fieldLocator.fieldPositionFrom !== undefined &&
        descriptor.definition.fieldLocator.fieldPositionTo !== undefined
      ) {
        // Fixed-width field
        const field = fields[index] || "";
        result[index] = field.substring(
          descriptor.definition.fieldLocator.fieldPositionFrom,
          descriptor.definition.fieldLocator.fieldPositionTo,
        );
      } else {
        result[index] = fields[index] || "";
      }

      if (this.trim && result[index]) {
        result[index] = result[index].trim();
      }
    }

    return result;
  }

  private escapeField(field: string): string {
    if (
      field.includes(this.delimiter) ||
      field.includes('"') ||
      field.includes("\n")
    ) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === this.delimiter && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}
