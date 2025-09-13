'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import type { Transaction, DenominationVault, DenominationCount, TransactionUpdatePayload } from '@/lib/types';
import { initialTransactions, initialVault } from '@/lib/initial-data';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type AppState = {
  user: FirebaseUser | null;
  transactions: Transaction[];
  vault: DenominationVault;
  isInitialized: boolean;
};

type AppContextType = AppState & {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp' | 'recordedBy'>) => void;
  updateTransaction: (transactionId: string, updates: TransactionUpdatePayload) => void;
  updateVault: (newVault: Partial<DenominationVault>) => void;
  deleteTransactions: (transactionIds: string[]) => void;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

type Action =
  | { type: 'SET_USER'; payload: FirebaseUser | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_VAULT'; payload: DenominationVault }
  | { type: 'INITIALIZE'; payload: { user: FirebaseUser | null } };

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_VAULT':
      return { ...state, vault: action.payload };
    case 'INITIALIZE':
      return { ...state, isInitialized: true, user: action.payload.user };
    default:
      return state;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, initialTransactions);
  const [vault, setVault] = useLocalStorage<DenominationVault>(LOCAL_STORAGE_KEYS.VAULT, initialVault);

  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    transactions: [],
    vault: initialVault,
    isInitialized: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch({ type: 'INITIALIZE', payload: { user } });
      if (!user) {
         router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (state.isInitialized) {
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      dispatch({ type: 'SET_VAULT', payload: vault });
    }
  }, [state.isInitialized, transactions, vault]);

  const logout = async () => {
    await signOut(auth);
    dispatch({ type: 'SET_USER', payload: null });
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp' | 'recordedBy'>) => {
    if (!state.user || !state.user.email) {
      throw new Error("User not loaded or email is missing");
    }
    
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      recordedBy: state.user.email,
    };

    const newTransactions = [newTransaction, ...state.transactions];
    setTransactions(newTransactions);

    // Create a deep copy of the vault to avoid mutation issues.
    const newVault = JSON.parse(JSON.stringify(state.vault)) as DenominationVault;

    if (newTransaction.type === 'CASH_CREDIT' && newTransaction.denominations) {
        for (const key of Object.keys(newTransaction.denominations)) {
            const denomKey = key as keyof DenominationCount;
            const count = newTransaction.denominations[denomKey] || 0;
            newVault.denominations[denomKey] = (newVault.denominations[denomKey] || 0) + count;
        }
    } else if (newTransaction.type === 'CASH_DEBIT' && newTransaction.denominations) {
        for (const key of Object.keys(newTransaction.denominations)) {
            const denomKey = key as keyof DenominationCount;
            const count = newTransaction.denominations[denomKey] || 0;
            newVault.denominations[denomKey] = (newVault.denominations[denomKey] || 0) - count;
        }
    } else if (newTransaction.type === 'UPI_CREDIT') {
        newVault.upiBalance += newTransaction.amount;
    } else if (newTransaction.type === 'UPI_DEBIT') {
        newVault.upiBalance -= newTransaction.amount;
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
  
  const updateVault = (newVaultData: Partial<DenominationVault>) => {
    const updatedVault = { ...state.vault, ...newVaultData };
    setVault(updatedVault);
  };

  const deleteTransactions = (transactionIds: string[]) => {
    const newTransactions = state.transactions.filter(tx => !transactionIds.includes(tx.id));
    setTransactions(newTransactions);
    // Note: Deleting transactions does not automatically reverse vault changes for simplicity.
  };

  const contextValue = useMemo(() => ({
    ...state,
    logout,
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
