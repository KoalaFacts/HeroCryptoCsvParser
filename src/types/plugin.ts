import { Transaction } from './transactions/index';

export interface TransactionCategorizerContext {
  transaction: Transaction;
  allTransactions?: Transaction[];
  exchangeName?: string;
}

export interface TransactionCategorizer {
  name: string;
  version: string;
  categorize(context: TransactionCategorizerContext): {
    taxCategory?: string;
    customTags?: string[];
    notes?: string;
  };
}

export interface ParserPlugin {
  name: string;
  version: string;
  preProcess?(transactions: Transaction[]): Transaction[];
  postProcess?(transactions: Transaction[]): Transaction[];
  categorizer?: TransactionCategorizer;
}

export interface PluginRegistry {
  register(plugin: ParserPlugin): void;
  unregister(pluginName: string): void;
  getPlugin(name: string): ParserPlugin | undefined;
  getAllPlugins(): ParserPlugin[];
}