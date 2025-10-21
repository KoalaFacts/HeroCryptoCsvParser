import type { FieldDescriptor } from "../FieldDescriptor";

export interface BatchEntryRecordOptions {
  delimiter?: string;
  hasHeaders?: boolean;
  skipEmptyLines?: boolean;
  trim?: boolean;

  validateFieldDefinitions(
    descriptors: FieldDescriptor<unknown, unknown>[],
    recordName: string,
  ): void;
  writeLine(
    fields: string[],
    descriptors: FieldDescriptor<unknown, unknown>[],
  ): string;
  readLine(
    line: string,
    descriptors: FieldDescriptor<unknown, unknown>[],
  ): string[];
}
