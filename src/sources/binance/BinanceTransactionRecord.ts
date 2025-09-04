import { BatchEntryRecord } from '../../core/BatchEntryRecord';
import { Amount, Asset, AssetAmount, TransactionType } from '../../types/transactions/index';
import { FieldValidationBuilder } from '../../core/FieldValidationBuilder';

export class BinanceTransactionRecord extends BatchEntryRecord<BinanceTransactionRecord> {
  userId: string = '';
  utcTime: string = '';
  account: string = '';
  operation: string = '';
  coin: string = '';
  change: string = '';
  remark: string = '';

  constructor() {
    super();
    this.defineFields();
  }

  private defineFields(): void {
    // Field order: "User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"
    
    // Field 0: User_ID
    this.fieldFor((x) => x.userId, 'User_ID', 0)
      .validateWith((v) => v
        .required('User ID is required')
      );

    // Field 1: UTC_Time
    this.fieldFor((x) => x.utcTime, 'UTC_Time', 1)
      .validateWith((v) => v
        .required('UTC time is required')
        .regex(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
          'Time must be in format YYYY-MM-DD HH:mm:ss'
        )
      );

    // Field 2: Account
    this.fieldFor((x) => x.account, 'Account', 2)
      .validateWith((v) => v
        .required('Account is required')
        .regex(/^(Spot|Earn|Funding|Margin|Futures|P2P|.*Wallet).*$/, 'Invalid account type')
      );

    // Field 3: Operation
    this.fieldFor((x) => x.operation, 'Operation', 3)
      .validateWith((v) => v
        .required('Operation is required')
      );

    // Field 4: Coin
    this.fieldFor((x) => x.coin, 'Coin', 4)
      .validateWith((v) => v
        .required('Coin is required')
        .minLength(1, 'Coin symbol must not be empty')
        .maxLength(20, 'Coin symbol too long')
      );

    // Field 5: Change (amount)
    this.fieldFor((x) => x.change, 'Change', 5)
      .validateWith((v) => v
        .required('Change amount is required')
        .must(
          (value: string) => {
            // Allow scientific notation, negative numbers, and regular decimals
            return /^-?\d+(\.\d+)?(E-?\d+)?$/i.test(value);
          },
          'Invalid amount format'
        )
      );

    // Field 6: Remark (optional)
    this.fieldFor((x) => x.remark, 'Remark', 6);
    
    // Example: If there were additional unused columns in the CSV:
    // this.fieldForSpare('Spare_1', 7);  // Field we don't need but must acknowledge
    // this.fieldForSpare('Spare_2', 8);  // Another unused field
  }
}