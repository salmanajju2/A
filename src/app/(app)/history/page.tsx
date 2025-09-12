'use client';
import { useState } from 'react';
import { TransactionCard } from '@/components/history/transaction-card';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent } from '@/components/ui/card';
import { HistoryToolbar } from '@/components/history/history-toolbar';
import type { Transaction } from '@/lib/types';

export default function HistoryPage() {
    const { transactions } = useAppContext();
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

    const handleToggleAll = (isChecked: boolean) => {
        if (isChecked) {
            setSelectedTransactions(filteredTransactions.map(t => t.id));
        } else {
            setSelectedTransactions([]);
        }
    };

    const handleSelectTransaction = (id: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedTransactions(prev => [...prev, id]);
        } else {
            setSelectedTransactions(prev => prev.filter(tId => tId !== id));
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <HistoryToolbar 
                transactions={transactions} 
                onFilter={setFilteredTransactions}
                selectedCount={selectedTransactions.length}
                totalCount={filteredTransactions.length}
                onToggleAll={handleToggleAll}
                selectedIds={selectedTransactions}
            />
            
            {filteredTransactions.length > 0 ? (
                <div className="space-y-4">
                    {filteredTransactions.map((transaction) => (
                        <TransactionCard 
                            key={transaction.id}
                            transaction={transaction}
                            isSelected={selectedTransactions.includes(transaction.id)}
                            onSelect={handleSelectTransaction}
                        />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">No transactions match your filters.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
