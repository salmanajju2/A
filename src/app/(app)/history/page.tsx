'use client';
import { useState, Suspense, useMemo } from 'react';
import { TransactionCard } from '@/components/history/transaction-card';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent } from '@/components/ui/card';
import { HistoryToolbar } from '@/components/history/history-toolbar';
import type { Transaction } from '@/lib/types';
import { PageHeader } from '@/components/shared/page-header';

function HistoryPageContent() {
    const { transactions, deleteTransactions } = useAppContext();

    const globalTransactions = useMemo(() => {
        return transactions.filter(t => !t.scope || t.scope === 'global').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [transactions]);
    
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
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
    
    // When filteredTransactions updates, ensure selected are still valid
    useState(() => {
        const filteredIds = new Set(filteredTransactions.map(t => t.id));
        setSelectedTransactions(prev => prev.filter(id => filteredIds.has(id)));
    }, [filteredTransactions]);

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Global Transaction History"
                description="Review, filter, and manage all non-company-specific transactions."
            />
            <div className="flex flex-col gap-4">
                <HistoryToolbar 
                    transactions={globalTransactions} 
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
        </div>
    );
}

export default function HistoryPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HistoryPageContent />
        </Suspense>
    )
}
