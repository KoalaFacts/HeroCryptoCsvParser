import { BaseTransaction } from '../common/BaseTransaction';

export interface Unknown extends BaseTransaction {
  type: 'UNKNOWN';
}