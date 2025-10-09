import type { FieldDescriptor } from "../FieldDescriptor";

export interface BatchEntryRecordOptions {
  delimiter?: string;
  hasHeaders?: boolean;
  skipEmptyLines?: boolean;
  trim?: boolean;

  validateFieldDefinitions(
    descriptors: FieldDescriptor<any>[],
    recordName: string,
  ): void;
  writeLine(fields: string[], descriptors: FieldDescriptor<any>[]): string;
  readLine(line: string, descriptors: FieldDescriptor<any>[]): string[];
}
