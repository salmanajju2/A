import type { Transaction, DenominationVault } from './types';

export const initialVault: DenominationVault = {
  denominations: {
    d500: 20,
    d200: 50,
    d100: 100,
    d50: 200,
    d20: 250,
    d10: 500,
    d5: 1000,
    d2: 1000,
    d1: 1000,
  },
  upiBalance: 25000,
};

const now = new Date();
export const initialTransactions: Transaction[] = [
  {
    id: `txn_${now.getTime() - 10000}`,
    type: 'CASH_CREDIT',
    amount: 5000,
    timestamp: new Date(now.getTime() - 10000).toISOString(),
    customerName: 'Self',
    companyName: 'Ali Enterprises',
    location: 'Main Branch',
    recordedBy: 'user@example.com',
    denominations: { d500: 10 },
  },
  {
    id: `txn_${now.getTime() - 20000}`,
    type: 'UPI_CREDIT',
    amount: 1250,
    timestamp: new Date(now.getTime() - 20000).toISOString(),
    customerName: 'Client A',
    companyName: 'Client A Inc.',
    location: 'Remote',
    recordedBy: 'user@example.com',
    upiTransactionId: 'upi' + Math.random(),
  },
  {
    id: `txn_${now.getTime() - 30000}`,
    type: 'CASH_DEBIT',
    amount: 350,
    timestamp: new Date(now.getTime() - 30000).toISOString(),
    customerName: 'Local Store',
    companyName: 'Stationery World',
    location: 'City Market',
    recordedBy: 'user@example.com',
    denominations: { d100: 3, d50: 1 },
  },
];
