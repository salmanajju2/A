'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/app-context';
import { formatCurrency } from '@/lib/helpers';
import { useMemo } from 'react';

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  statType: 'credit' | 'debit' | 'net';
}

export default function StatCard({ title, icon, statType }: StatCardProps) {
    const { transactions } = useAppContext();

    const value = useMemo(() => {
        const credit = transactions
            .filter(tx => tx.type.includes('CREDIT'))
            .reduce((acc, tx) => acc + tx.amount, 0);

        const debit = transactions
            .filter(tx => tx.type.includes('DEBIT') || tx.type.includes('WITHDRAWAL') || tx.type.includes('DEPOSIT'))
            .reduce((acc, tx) => acc + tx.amount, 0);

        if (statType === 'credit') return credit;
        if (statType === 'debit') return debit;
        return credit - debit;
    }, [transactions, statType]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-headline">{formatCurrency(value)}</div>
      </CardContent>
    </Card>
  );
}
