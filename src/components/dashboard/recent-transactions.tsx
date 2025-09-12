'use client';

import { useAppContext } from '@/context/app-context';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { ArrowDownLeft, ArrowUpRight, Banknote } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { TRANSACTION_TYPES } from '@/lib/constants';

export default function RecentTransactions() {
  const { transactions } = useAppContext();
  const recentTransactions = transactions.slice(0, 5);

  const getIcon = (type: string) => {
    if (type.includes('CREDIT')) return <ArrowUpRight className="h-4 w-4" />;
    if (type.includes('DEBIT')) return <ArrowDownLeft className="h-4 w-4" />;
    return <Banknote className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {recentTransactions.length > 0 ? (
        recentTransactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center">
             <Avatar className="h-9 w-9">
              <AvatarFallback>{getIcon(transaction.type)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{TRANSACTION_TYPES[transaction.type]}</p>
              <p className="text-sm text-muted-foreground">{formatDate(new Date(transaction.timestamp))}</p>
            </div>
            <div className="ml-auto font-medium">{formatCurrency(transaction.amount)}</div>
          </div>
        ))
      ) : (
        <p className="text-center text-sm text-muted-foreground py-8">No transactions yet.</p>
      )}
    </div>
  );
}
