import type { Denomination } from './types';

export const DENOMINATIONS: Denomination[] = [
  { value: 500, label: '₹500' },
  { value: 200, label: '₹200' },
  { value: 100, label: '₹100' },
  { value: 50, label: '₹50' },
  { value: 20, label: '₹20' },
  { value: 10, label: '₹10' },
  { value: 5, label: '₹5' },
  { value: 2, label: '₹2' },
  { value: 1, label: '₹1' },
];

export const TRANSACTION_TYPES = {
  CASH_CREDIT: 'Cash Credit',
  CASH_DEBIT: 'Cash Debit',
  UPI_CREDIT: 'UPI Credit',
  UPI_DEBIT: 'UPI Debit',
  BANK_DEPOSIT: 'Bank Deposit',
  ATM_WITHDRAWAL: 'ATM Withdrawal',
  COMPANY_ADJUSTMENT_DEBIT: 'ENTRY',
} as const;

export const COMPANY_NAMES = [
  'ASHIRVAD',
  'BELSTAR',
  'CHOLA',
  'CMS',
  'DELIVERY',
  'DIGAMBER',
  'FINOVA',
  'FLIPKART',
  'FUSION',
  'KOTAK',
  'LNT',
  'MEESHO',
  'NA',
  'ODH',
  'SATIN',
  'SATYA',
  'SWABHIMAN',
  'TVS',
  'UJJIVAN',
  'UNITY SMALL',
] as const;

export const LOCATIONS = [
    'RMU',
    'BXU',
    'KXU',
    'RDP',
] as const;

export const LOCAL_STORAGE_KEYS = {
  USER: 'denomination-depot-user',
  TRANSACTIONS: 'denomination-depot-transactions',
  VAULT: 'denomination-depot-vault',
};
