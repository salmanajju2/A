'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction, TransactionType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { ArrowDownLeft, ArrowUpRight, PlusCircle, Hash, FileDown, Pencil, Trash, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { TransactionDialog } from '@/components/transactions/transaction-dialog';
import { TRANSACTION_TYPES, COMPANY_NAMES, LOCATIONS } from '@/lib/constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { numberToWords } from '@/lib/number-to-words';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

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

    const handleOpenDialog = (type: TransactionType) => {
        setEditingTransaction(null);
        setTransactionType(type);
        setDialogOpen(true);
    }

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setDialogOpen(true);
    };

    const handleDelete = (transactionId: string) => {
        deleteTransactions([transactionId]);
        toast({ title: "Transaction deleted." });
    };
    
    const handleDownloadPdf = () => {
        const doc = new jsPDF('landscape') as jsPDFWithAutoTable;
        
        const pageTitle = `REPORT ${company} ${location || ''}`.trim();
        const generatedDate = `DATE AND TIME ${new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '')}`;

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 0, 0); // Red
        doc.text(pageTitle, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Black
        doc.text(generatedDate, doc.internal.pageSize.getWidth() - 20, 25, { align: 'right' });

        const customerCredits: { [key: string]: { cash: (number | string)[], upi: (number | string)[] } } = {};
        const sortedTransactions = [...filteredTransactions].sort((a, b) => (a.customerName || 'zzz').localeCompare(b.customerName || 'zzz'));

        sortedTransactions.forEach(tx => {
            if (tx.type.includes('CREDIT') && tx.customerName) {
                if (!customerCredits[tx.customerName]) {
                    customerCredits[tx.customerName] = { cash: Array(5).fill(''), upi: Array(5).fill('') };
                }
                const customer = customerCredits[tx.customerName];
                const slots = tx.type === 'CASH_CREDIT' ? customer.cash : customer.upi;
                const emptyIndex = slots.findIndex(c => c === '');
                if (emptyIndex !== -1) {
                    slots[emptyIndex] = tx.amount;
                }
            }
        });
        
        let body = Object.entries(customerCredits).map(([name, data]) => {
            const total = [...data.cash, ...data.upi].reduce((sum: number, val) => sum + (Number(val) || 0), 0);
            return [
                name.toUpperCase(),
                ...data.cash,
                ...data.upi,
                total > 0 ? total.toFixed(0) : '0'
            ];
        });
        
        const requiredRows = 10;
        while (body.length < requiredRows) {
            body.push(['', '', '', '', '', '', '', '', '', '', '', '0']);
        }


        const totalCredit = body.reduce((sum, row) => sum + (Number(row[11]) || 0), 0);

        const entryTransactions = filteredTransactions.filter(tx => tx.type === 'COMPANY_ADJUSTMENT_DEBIT');
        const totalDebit = entryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const debitEntries = Array(5).fill('');
        entryTransactions.slice(0, 5).forEach((tx, i) => {
            debitEntries[i] = tx.amount.toFixed(0);
        });
        
        const closingBalance = totalCredit - totalDebit;
        
        const head = [
            [
                { content: 'NAME', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'CASH', colSpan: 5, styles: { halign: 'center' } },
                { content: 'UPI', colSpan: 5, styles: { halign: 'center' } },
                { content: 'TOTAL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
            ],
            [
                '1st', '2st', '3st', '4st', '5st',
                '1st', '2st', '3st', '4st', '5st'
            ]
        ];

        const foot = [
             [
                { content: 'TOTAL', colSpan: 1, styles: { halign: 'left' } },
                { content: '' , colSpan: 10, styles: { halign: 'right' } },
                { content: totalCredit.toFixed(0), styles: { halign: 'right' } }
            ],
            [
                { content: 'ENTRY' },
                ...debitEntries,
                { content: '', colSpan: 5},
                { content: totalDebit.toFixed(0), styles: { halign: 'right' } }
            ],
            [
                { content: 'CLOSING BALANCE', colSpan: 1, styles: { halign: 'left' } },
                { content: '', colSpan: 10, styles: { halign: 'right' } },
                { content: closingBalance.toFixed(0), styles: { halign: 'right' } }
            ]
        ];

        autoTable(doc, {
            startY: 30,
            head: head,
            body: body,
            foot: foot,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontStyle: 'bold',
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                textColor: [0, 0, 0],
            },
            headStyles: {
                fillColor: '#008080',
                textColor: [0, 0, 0],
                halign: 'center',
                valign: 'middle',
                fontStyle: 'bold',
            },
            footStyles: {
                fillColor: '#008080',
                textColor: [0, 0, 0],
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' },
                6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' }, 10: { halign: 'right' },
                11: { halign: 'right' },
            },
             didParseCell: function (data) {
                if (data.section === 'foot') {
                     // TOTAL row
                    if (data.row.index === 0) {
                        if (data.column.index === 0) {
                           data.cell.styles.halign = 'left';
                           data.cell.colSpan = 11;
                        }
                    }
                    // ENTRY row
                    if (data.row.index === 1) {
                         if (data.column.index === 0) {
                           data.cell.styles.halign = 'left';
                        } else if (data.column.index > 0 && data.column.index < 6) {
                            data.cell.styles.halign = 'right';
                        } else if (data.column.index === 11) {
                            data.cell.styles.halign = 'right';
                        } else {
                            data.cell.styles.halign = 'center';
                        }
                    }
                    // CLOSING BALANCE row
                     if (data.row.index === 2) {
                         if (data.column.index === 0) {
                           data.cell.styles.halign = 'left';
                           data.cell.colSpan = 11;
                        }
                    }
                }
            }
        });
    
        doc.save(`${company}_${location ? location + '_' : ''}${new Date().toISOString().split('T')[0]}.pdf`);
    }


    if (!company) {
        return (
            <div className="text-center">
                <p>No company specified.</p>
                <Button onClick={() => router.back()} className='mt-4'>Go Back</Button>
            </div>
        );
    }
    
    const pageTitle = `${company} ${location || ''}`.trim();
    const isSatinCompany = (company as (typeof COMPANY_NAMES)[number]) === 'SATIN';

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title={pageTitle}
                description={`A summary of ${filteredTransactions.length} transactions.`}
            >
                <div className='flex flex-col gap-4 items-end'>
                    <div className="flex gap-8 text-sm pt-2">
                        <div className='flex items-center gap-2'>
                            <span className="text-muted-foreground">Total Credit:</span>
                            <span className="font-semibold">{formatCurrency(summary.credit)}</span>
                        </div>
                         <div className='flex items-center gap-2'>
                            <span className="text-muted-foreground">Total Debit:</span>
                            <span className="font-semibold">{formatCurrency(summary.debit)}</span>
                        </div>
                         <div className='flex items-center gap-2'>
                            <span className="text-muted-foreground">Net Balance:</span>
                            <span className={cn("font-bold", summary.net >= 0 ? 'text-green-500' : 'text-red-500')}>{formatCurrency(summary.net)}</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                         <Button variant="outline" onClick={() => handleOpenDialog(isSatinCompany ? 'CASH_CREDIT' : 'UPI_CREDIT')}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {isSatinCompany ? 'Add Cash' : 'Add UPI'}
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
                </div>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx) => (
                                <Collapsible key={tx.id} className="rounded-lg border">
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", tx.type.includes('CREDIT') ? 'bg-muted' : 'bg-muted')}>
                                                {tx.type.includes('CREDIT') ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{tx.customerName || tx.companyName || 'N/A'}</p>
                                                <p className="text-sm text-muted-foreground">{TRANSACTION_TYPES[tx.type]}</p>
                                            </div>
                                        </div>
                                        <p className={cn("text-lg font-bold", tx.type.includes('CREDIT') ? 'text-green-500' : 'text-red-500')}>
                                            {formatCurrency(tx.amount)}
                                        </p>
                                    </div>
                                    <CollapsibleContent>
                                     <div className='border-t p-4 space-y-2 text-sm'>
                                        <div className="text-xs text-muted-foreground">{formatDate(new Date(tx.timestamp))}</div>
                                         {tx.upiTransactionId && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <Hash className="h-3 w-3 text-muted-foreground" />
                                                <span>{tx.upiTransactionId}</span>
                                            </div>
                                         )}
                                    </div>
                                    </CollapsibleContent>
                                    <div className="border-t bg-muted/50 p-2 flex justify-between items-center">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <ChevronDown className="h-4 w-4 mr-2 transition-transform data-[state=open]:rotate-180" />
                                                Details
                                            </Button>
                                        </CollapsibleTrigger>
                                        <div className='flex justify-end gap-2'>
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
                                </Collapsible>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No transactions found for this company and location.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
            {dialogOpen && (
                <TransactionDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    transactionType={transactionType}
                    transaction={editingTransaction}
                    defaults={{
                        companyName: company || undefined,
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

    