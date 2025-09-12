import { TRANSACTION_TYPES } from './constants';

export type Denomination = {
  value: number;
  label: string;
};

export type DenominationCount = {
  d500: number;
  d200: number;
  d100: number;
  d50: number;
  d20: number;
  d10: number;
  d5: number;
  d2: number;
  d1: number;
};

export type TransactionType = keyof typeof TRANSACTION_TYPES;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  timestamp: string;
  denominations?: Partial<DenominationCount>;
  accountId?: string;
  atmId?: string;
  partnerBankUTR?: string;
  customerName?: string;
  companyName?: string;
  location?: string;
  upiTransactionId?: string;
  recordedBy: string;
  scope?: 'global' | 'company';
}

export type TransactionUpdatePayload = Omit<Transaction, 'id' | 'timestamp' | 'recordedBy' | 'type'>

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface DenominationVault {
  denominations: DenominationCount;
  upiBalance: number;
}
