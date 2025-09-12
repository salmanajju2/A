'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction, TransactionType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { ArrowDownLeft, ArrowUpRight, PlusCircle, User, Hash, FileDown, Pencil, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { TransactionDialog } from '@/components/transactions/transaction-dialog';
import { TRANSACTION_TYPES } from '@/lib/constants';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { numberToWords } from '@/lib/number-to-words';

function CompanyTransactionsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { transactions, deleteTransactions } = useAppContext();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [transactionType, setTransactionType] = useState<TransactionType | null>(null);
    
    const company = searchParams.get('company');
    const location = searchParams.get('location');

    const handleOpenDialog = (type: TransactionType) => {
        setEditingTransaction(null);
        setTransactionType(type);
        setDialogOpen(true);
    }

    const handleEdit = (transaction: Transaction) => {
        setTransactionType(transaction.type);
        setEditingTransaction(transaction);
        setDialogOpen(true);
    };

    const handleDelete = (transactionId: string) => {
        // A confirmation dialog would be good here in a real app
        deleteTransactions([transactionId]);
        toast({ title: "Transaction deleted." });
    };
    
    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        const pageTitle = `${company} ${location || ''}`.trim();
        const total = summary.net;

        // Header
        doc.setFontSize(20);
        doc.text(pageTitle, 14, 22);
        doc.setFontSize(10);
        doc.text(`Statement as of ${new Date().toLocaleDateString()}`, 14, 30);

        // Summary
        let summaryY = 40;
        doc.setFontSize(12);
        doc.text("Balance Summary", 14, summaryY);
        summaryY += 7;
        doc.setFontSize(10);
        doc.text(`Total Credit: ${formatCurrency(summary.credit)}`, 14, summaryY);
        doc.text(`Total Debit: ${formatCurrency(summary.debit)}`, 80, summaryY);
        doc.text(`Net Balance: ${formatCurrency(summary.net)}`, 140, summaryY);
        summaryY += 10;
        
        // Table
        const tableColumn = ["Date", "Type", "Customer", "Credit", "Debit"];
        const tableRows: (string | number)[][] = [];

        filteredTransactions.forEach(tx => {
            const transactionData = [
                formatDate(new Date(tx.timestamp)),
                TRANSACTION_TYPES[tx.type],
                tx.customerName || 'N/A',
                tx.type.includes('CREDIT') ? formatCurrency(tx.amount) : '',
                tx.type.includes('DEBIT') ? formatCurrency(tx.amount) : ''
            ];
            tableRows.push(transactionData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: summaryY,
        });

        // Footer
        let finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.text("Total in words:", 14, finalY);
        doc.setFontSize(10);
        doc.text(numberToWords(total), 14, finalY + 5, { maxWidth: 180 });

        doc.save(`${pageTitle}_statement.pdf`);
    }

    const filteredTransactions = useMemo(() => {
        if (!company) return [];
        return transactions.filter(t => {
            const companyMatch = t.companyName === company;
            const locationMatch = !location || t.location === location;
            return companyMatch && locationMatch;
        }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
                    <Button variant="secondary" onClick={handleDownloadPdf}>
                        <FileDown className="mr-2 h-4 w-4" />
                        PDF
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
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
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
                                         <div className='border-t pt-4 mt-4 space-y-2 text-sm'>
                                            {tx.upiTransactionId && <div className='flex items-center gap-2'><Hash className="h-4 w-4 text-muted-foreground" /> <span>{tx.upiTransactionId}</span></div>}
                                            <div className="text-xs text-muted-foreground">{formatDate(new Date(tx.timestamp))}</div>
                                        </div>
                                    </div>
                                    <div className="border-t bg-muted/50 p-2 flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tx)}>
                                            <Pencil className="mr-2 h-3 w-3" />
                                            Edit
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(tx.id)}>
                                            <Trash className="mr-2 h-3 w-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No transactions found for this company and location.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <TransactionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                transactionType={transactionType}
                transaction={editingTransaction}
                defaults={{
                    companyName: company,
                    location: location || undefined,
                    scope: 'company'
                }}
            />
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
