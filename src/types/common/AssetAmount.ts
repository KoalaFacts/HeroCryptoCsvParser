import type { Amount } from "./Amount";
import type { Asset } from "./Asset";
import type { FiatValue } from "./FiatValue";

export interface AssetAmount {
  asset: Asset;
  amount: Amount;
  fiatValue?: FiatValue;
}
