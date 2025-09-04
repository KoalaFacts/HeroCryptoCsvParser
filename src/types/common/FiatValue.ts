import { Amount } from './Amount';

export type FiatCurrency = 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'CAD' 
  | 'AUD' 
  | 'JPY' 
  | 'CNY' 
  | 'CHF' 
  | 'NZD'
  | 'SGD'
  | 'HKD'
  | 'KRW'
  | 'INR'
  | 'BRL'
  | 'MXN'
  | string; // Allow other currencies

export interface FiatValue {
  amount: Amount;
  currency: FiatCurrency;
}