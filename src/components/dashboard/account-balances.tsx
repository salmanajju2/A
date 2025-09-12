'use client';

import { useAppContext } from '@/context/app-context';
import { formatCurrency } from '@/lib/helpers';
import { Landmark, Wallet } from 'lucide-react';
import { useMemo } from 'react';

export default function AccountBalances() {
  const { vault } = useAppContext();

  const cashTotal = useMemo(() => {
    return Object.entries(vault.denominations).reduce((acc, [key, count]) => {
      const value = parseInt(key.replace('d', ''));
      return acc + value * count;
    }, 0);
  }, [vault.denominations]);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="p-3 bg-muted rounded-md mr-4">
            <Wallet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Cash in Vault</p>
          <p className="text-2xl font-bold font-headline">{formatCurrency(cashTotal)}</p>
        </div>
      </div>
      <div className="flex items-center">
        <div className="p-3 bg-muted rounded-md mr-4">
            <Landmark className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">UPI Balance</p>
          <p className="text-2xl font-bold font-headline">{formatCurrency(vault.upiBalance)}</p>
        </div>
      </div>
    </div>
  );
}
