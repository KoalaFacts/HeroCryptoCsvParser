import { Asset } from './Asset';
import { Amount } from './Amount';
import { FiatValue } from './FiatValue';

export interface AssetAmount {
  asset: Asset;
  amount: Amount;
  fiatValue?: FiatValue;
}