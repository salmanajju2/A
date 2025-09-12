'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import type { User, Transaction, DenominationVault, DenominationCount, TransactionUpdatePayload } from '@/lib/types';
import { DENOMINATIONS } from '@/lib/constants';
import { initialTransactions, initialVault } from '@/lib/initial-data';


type AppState = {
  user: User | null;
  transactions: Transaction[];
  vault: DenominationVault;
  isInitialized: boolean;
};

const defaultUser: User = { id: '1', email: 'user@example.com', name: 'Ali Enterprises' };

type AppContextType = AppState & {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp' | 'recordedBy'>) => void;
  updateTransaction: (transactionId: string, updates: TransactionUpdatePayload) => void;
  updateVault: (newVault: DenominationVault) => void;
  deleteTransactions: (transactionIds: string[]) => void;
  login: (user: User) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_VAULT'; payload: DenominationVault }
  | { type: 'INITIALIZE' };

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_VAULT':
      return { ...state, vault: action.payload };
    case 'INITIALIZE':
      return { ...state, isInitialized: true };
    default:
      return state;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useLocalStorage<User | null>(LOCAL_STORAGE_KEYS.USER, null);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, initialTransactions);
  const [vault, setVault] = useLocalStorage<DenominationVault>(LOCAL_STORAGE_KEYS.VAULT, initialVault);

  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    transactions: [],
    vault: initialVault,
    isInitialized: false,
  });

  useEffect(() => {
    dispatch({ type: 'SET_USER', payload: user });
    dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
    dispatch({ type: 'SET_VAULT', payload: vault });
    dispatch({ type: 'INITIALIZE' });
  }, [user, transactions, vault]);

  const login = (userToLogin: User) => {
    setUser(userToLogin);
  }
  
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp' | 'recordedBy'>) => {
    if (!state.user) throw new Error("User not loaded");
    
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      recordedBy: state.user.email,
    };

    const newTransactions = [newTransaction, ...state.transactions];
    setTransactions(newTransactions);

    // This is a simplified vault update. For production, you'd want a more robust, atomic update mechanism.
    const newVault = JSON.parse(JSON.stringify(state.vault));
    if (newTransaction.type.includes('CASH')) {
      const denominations = newTransaction.denominations || {};
      for (const key in denominations) {
        const denominationKey = key as keyof DenominationCount;
        if(newTransaction.type === 'CASH_CREDIT') {
          newVault.denominations[denominationKey] = (newVault.denominations[denominationKey] || 0) + (denominations[denominationKey] || 0);
        } else { // CASH_DEBIT
          newVault.denominations[denominationKey] = (newVault.denominations[denominationKey] || 0) - (denominations[denominationKey] || 0);
        }
      }
    }
    if (newTransaction.type.includes('UPI')) {
       if(newTransaction.type === 'UPI_CREDIT') {
          newVault.upiBalance += newTransaction.amount;
        } else { // UPI_DEBIT
          newVault.upiBalance -= newTransaction.amount;
        }
    }
    setVault(newVault);
  };
  
  const updateTransaction = (transactionId: string, updates: TransactionUpdatePayload) => {
    // Note: This is a simplified update. It does not recalculate vault balances for simplicity.
    // A more robust solution would re-calculate balances or handle the diff.
    const newTransactions = state.transactions.map(tx => 
      tx.id === transactionId ? { ...tx, ...updates, id: tx.id, type: tx.type } as Transaction : tx
    );
    setTransactions(newTransactions);
  };
  
  const updateVault = (newVault: DenominationVault) => {
    setVault(newVault);
  };

  const deleteTransactions = (transactionIds: string[]) => {
    const newTransactions = state.transactions.filter(tx => !transactionIds.includes(tx.id));
    setTransactions(newTransactions);
    // Note: Deleting transactions does not automatically reverse vault changes for simplicity.
  };

  const contextValue = useMemo(() => ({
    ...state,
    login,
    addTransaction,
    updateTransaction,
    updateVault,
    deleteTransactions,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state]);

  if (!state.isInitialized) {
    return null; // Or a loading spinner
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
