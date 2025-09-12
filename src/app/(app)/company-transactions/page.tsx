'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction, TransactionType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { ArrowDownLeft, ArrowUpRight, PlusCircle, User, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { TransactionDialog } from '@/components/transactions/transaction-dialog';
import { TRANSACTION_TYPES } from '@/lib/constants';

function CompanyTransactionsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { transactions } = useAppContext();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<TransactionType | null>(null);
    
    const company = searchParams.get('company');
    const location = searchParams.get('location');

    const handleOpenDialog = (type: TransactionType) => {
        setTransactionType(type);
        setDialogOpen(true);
    }

    const filteredTransactions = useMemo(() => {
        if (!company) return [];
        return transactions.filter(t => {
            const companyMatch = t.companyName === company;
            const locationMatch = !location || t.location === location;
            return companyMatch && locationMatch;
        });
    }, [transactions, company, location]);

    const summary = useMemo(() => {
        return filteredTransactions.reduce((acc, tx) => {
            if (tx.type.includes('CREDIT')) {
                acc.credit += tx.amount;
            } else {
                acc.debit += tx.amount;
            }
            acc.net = acc.credit - acc.debit;
            return acc;
        }, { credit: 0, debit: 0, net: 0 });
    }, [filteredTransactions]);

    if (!company) {
        return (
            <div className="text-center">
                <p>No company specified.</p>
                <Button onClick={() => router.back()} className='mt-4'>Go Back</Button>
            </div>
        );
    }
    
    const pageTitle = `${company} ${location || ''}`.trim();

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title={pageTitle}
                description={`A summary of ${filteredTransactions.length} transactions.`}
            >
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleOpenDialog('UPI_CREDIT')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        add upi kro
                    </Button>
                    <Button variant="outline" onClick={() => handleOpenDialog('COMPANY_ADJUSTMENT_DEBIT')}>
                         <PlusCircle className="mr-2 h-4 w-4" />
                        Add Entry
                    </Button>
                    <Button onClick={() => router.back()}>Go Back</Button>
                 </div>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>Balance Summary</CardTitle>
                    <div className="flex gap-8 text-sm pt-2">
                        <div className='flex items-center gap-2'>
                            <span className="text-muted-foreground">Total Credit:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(summary.credit)}</span>
                        </div>
                         <div className='flex items-center gap-2'>
                            <span className="text-muted-foreground">Total Debit:</span>
                            <span className="font-semibold text-red-600">{formatCurrency(summary.debit)}</span>
                        </div>
                         <div className='flex items-center gap-2'>
                            <span className="text-muted-foreground">Net Balance:</span>
                            <span className={cn("font-bold", summary.net < 0 ? "text-red-600" : "text-primary")}>{formatCurrency(summary.net)}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx) => (
                                <div key={tx.id} className="rounded-lg border">
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", tx.type.includes('CREDIT') ? 'bg-green-100' : 'bg-red-100')}>
                                                {tx.type.includes('CREDIT') ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownLeft className="h-4 w-4 text-red-600" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{tx.customerName || 'N/A'}</p>
                                                <p className="text-sm text-muted-foreground">{TRANSACTION_TYPES[tx.type]}</p>
                                            </div>
                                        </div>
                                        <p className={cn("text-lg font-bold", tx.type.includes('CREDIT') ? 'text-green-600' : 'text-red-600')}>
                                            {formatCurrency(tx.amount)}
                                        </p>
                                    </div>
                                    <div className='border-t p-4 space-y-2 text-sm'>
                                        {tx.upiTransactionId && <div className='flex items-center gap-2'><Hash className="h-4 w-4 text-muted-foreground" /> <span>{tx.upiTransactionId}</span></div>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No transactions found for this company and location.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {transactionType && (
                <TransactionDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    transactionType={transactionType}
                    defaults={{
                        companyName: company,
                        location: location || undefined,
                        scope: 'company'
                    }}
                />
            )}
        </div>
    );
}


export default function CompanyTransactionsPage() {
    return (
        <Suspense fallback={<div>Loading company transactions...</div>}>
            <CompanyTransactionsContent />
        </Suspense>
    )
}
