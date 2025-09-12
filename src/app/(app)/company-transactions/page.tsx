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

    const filteredTransactions = useMemo(() => {
        if (!company) return [];
        return transactions.filter(t => {
            const companyMatch = t.companyName === company;
            const locationMatch = !location || t.location === location;
            // Show both company-scoped and global transactions that match company/location
            return companyMatch && locationMatch;
        }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [transactions, company, location]);

    const handleOpenDialog = (type: TransactionType) => {
        setEditingTransaction(null);
        setTransactionType(type);
        setDialogOpen(true);
    }

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setTransactionType(transaction.type);
        setDialogOpen(true);
    };

    const handleDelete = (transactionId: string) => {
        // A confirmation dialog would be good here in a real app
        deleteTransactions([transactionId]);
        toast({ title: "Transaction deleted." });
    };
    
    const handleDownloadPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const pageTitle = `Report for ${company} ${location || ''}`.trim();
        const generationDate = new Date();
    
        // 1. Set up headers
        doc.setFontSize(10);
        doc.text(`${generationDate.toLocaleDateString()}, ${generationDate.toLocaleTimeString()}`, 14, 15);
        doc.text(`${pageTitle} - ${generationDate.toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
        doc.setFontSize(22);
        doc.text(pageTitle, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
    
        doc.setFontSize(10);
        doc.text(`Generated on: ${generationDate.toLocaleString()}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
    
    
        // 2. Process data
        const customerCredits: Record<string, { cash: number[], upi: number[], total: number }> = {};
        const debitEntries: { cash: number[], upi: number[] } = { cash: [], upi: [] };
    
        filteredTransactions.forEach(tx => {
            const customer = tx.customerName || 'N/A';
            if (tx.type.includes('CREDIT')) {
                if (!customerCredits[customer]) {
                    customerCredits[customer] = { cash: [], upi: [], total: 0 };
                }
                if (tx.type.includes('CASH')) {
                    customerCredits[customer].cash.push(tx.amount);
                } else if (tx.type.includes('UPI')) {
                    customerCredits[customer].upi.push(tx.amount);
                }
                customerCredits[customer].total += tx.amount;
            } else if (tx.type.includes('DEBIT')) {
                if (tx.type.includes('CASH')) {
                    debitEntries.cash.push(tx.amount);
                } else if (tx.type.includes('UPI')) {
                    debitEntries.upi.push(tx.amount);
                }
            }
        });
    
        // 3. Prepare table data
        const head = [
            [{ content: 'Customer Name', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }, { content: 'Cash', colSpan: 4, styles: { halign: 'center' } }, { content: 'UPI', colSpan: 4, styles: { halign: 'center' } }, { content: 'Total Credit', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }],
            ['1st', '2nd', '3rd', '4th', '1st', '2nd', '3rd', '4th']
        ];
    
        const body = Object.entries(customerCredits).map(([name, data]) => {
            return [
                name,
                ...Array.from({ length: 4 }, (_, i) => data.cash[i] ? formatCurrency(data.cash[i]).replace('₹','').trim() : ''),
                ...Array.from({ length: 4 }, (_, i) => data.upi[i] ? formatCurrency(data.upi[i]).replace('₹','').trim() : ''),
                { content: formatCurrency(data.total).replace('₹','').trim(), styles: { halign: 'right' } }
            ];
        });
    
        const totalCredit = Object.values(customerCredits).reduce((sum, current) => sum + current.total, 0);
        const totalDebit = debitEntries.cash.reduce((s, a) => s + a, 0) + debitEntries.upi.reduce((s, a) => s + a, 0);
        const closingBalance = totalCredit - totalDebit;
    
        const footer = [
            ['', '', '', '', '', '', '', '', '', { content: 'Total Credit', styles: { fontStyle: 'bold' } }, { content: formatCurrency(totalCredit).replace('₹','').trim(), styles: { fontStyle: 'bold', fillColor: '#dff0d8', halign: 'right' } }],
            [{ content: 'ENTRY', styles: { fontStyle: 'bold' } }, 
                ...Array.from({ length: 4 }, (_, i) => debitEntries.cash[i] ? formatCurrency(debitEntries.cash[i]).replace('₹','').trim() : ''),
                ...Array.from({ length: 4 }, (_, i) => debitEntries.upi[i] ? formatCurrency(debitEntries.upi[i]).replace('₹','').trim() : ''),
                { content: 'Total Debit', styles: { fontStyle: 'bold', halign: 'right' } },
                { content: formatCurrency(totalDebit).replace('₹','').trim(), styles: { fontStyle: 'bold', fillColor: '#f2dede', halign: 'right' } }
            ],
            ['', '', '', '', '', '', '', '', '', { content: 'Closing Balance', styles: { fontStyle: 'bold' } }, { content: formatCurrency(closingBalance).replace('₹','').trim(), styles: { fontStyle: 'bold', fillColor: closingBalance < 0 ? '#f2dede' : '#dff0d8', halign: 'right' } }],
        ];
    
        body.push(...footer as any);
    
        // 4. Generate table
        (doc as any).autoTable({
            head: head,
            body: body,
            startY: 45,
            theme: 'grid',
            headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                cellPadding: 2,
                fontSize: 8
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35 },
                10: { halign: 'right' }
            },
            didParseCell: function(data: any) {
                if (data.section === 'body' && data.column.index >= 1 && data.column.index < 9) {
                    data.cell.styles.halign = 'right';
                }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY;

        doc.setFontSize(10);
        doc.text(`Amount in Words: ${numberToWords(closingBalance)}`, 14, finalY + 10);
    
        // 5. Save PDF
        doc.save(`${pageTitle.replace(/ /g, "_")}_${generationDate.toISOString().split('T')[0]}.pdf`);
    }

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
                                            <div className="text-xs text-muted-foreground">{formatDate(new Date(tx.timestamp))}</div>
                                             {tx.upiTransactionId && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Hash className="h-3 w-3 text-muted-foreground" />
                                                    <span>{tx.upiTransactionId}</span>
                                                </div>
                                             )}
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

            {dialogOpen && (
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
