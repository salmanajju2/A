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
import { TRANSACTION_TYPES } from '@/lib/constants';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { numberToWords } from '@/lib/number-to-words';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
        const doc = new jsPDF({ orientation: 'landscape' });
        const generationDate = new Date();
        const pageTitle = `Report for ${company} ${location || ''}`.trim();
        const formattedDate = generationDate.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).replace(/,/g, '');

        doc.setFontSize(22);
        doc.text(`Report for ${company}`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generated on: ${formattedDate}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
    
        const customerCredits: Record<string, { cash: number[], upi: number[], total: number }> = {};
        const debitEntries: { cash: number[], upi: number[] } = { cash: [], upi: [] };

        const sortedTransactions = [...filteredTransactions].sort((a, b) => {
            const nameA = a.customerName || 'z';
            const nameB = b.customerName || 'z';
            return nameA.localeCompare(nameB);
        });
    
        sortedTransactions.forEach(tx => {
            if (tx.type.includes('CREDIT')) {
                const customer = tx.customerName || 'N/A';
                if (!customerCredits[customer]) {
                    customerCredits[customer] = { cash: [], upi: [], total: 0 };
                }
                if (tx.type === 'CASH_CREDIT' && customerCredits[customer].cash.length < 3) {
                    customerCredits[customer].cash.push(tx.amount);
                } else if (tx.type === 'UPI_CREDIT' && customerCredits[customer].upi.length < 3) {
                    customerCredits[customer].upi.push(tx.amount);
                }
                customerCredits[customer].total += tx.amount;
            } else if (tx.type.includes('DEBIT')) {
                if (tx.type.includes('CASH') && debitEntries.cash.length < 3) {
                    debitEntries.cash.push(tx.amount);
                } else if (tx.type.includes('UPI') && debitEntries.upi.length < 3) {
                    debitEntries.upi.push(tx.amount);
                }
            }
        });
    
        const head = [
            [{ content: 'NAME', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }, { content: 'CASH', colSpan: 3, styles: { halign: 'center' } }, { content: 'UPI', colSpan: 3, styles: { halign: 'center' } }, { content: 'TOTAL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }],
            ['CASH 1ST', 'CASH 2ND', 'CASH 3RD', 'UPI 1ST', 'UPI 2ND', 'UPI 3RD']
        ];
    
        const body = Object.entries(customerCredits).map(([name, data]) => {
            const row: (string | number)[] = [name];
            for (let i = 0; i < 3; i++) row.push(data.cash[i] || '');
            for (let i = 0; i < 3; i++) row.push(data.upi[i] || '');
            row.push(data.total);
            return row;
        });

        const totalCredit = Object.values(customerCredits).reduce((sum, current) => sum + current.total, 0);
        const totalDebit = [...debitEntries.cash, ...debitEntries.upi].reduce((s, a) => s + a, 0);
        const closingBalance = totalCredit - totalDebit;
        
        const debitRow = ['ENTRY'];
        for (let i = 0; i < 3; i++) debitRow.push(debitEntries.cash[i] || '');
        for (let i = 0; i < 3; i++) debitRow.push(debitEntries.upi[i] || '');
        debitRow.push(totalDebit);
        
        const footer = [
            [{ content: 'TOTAL', colSpan: 7, styles: { fontStyle: 'bold', halign: 'center' } }, { content: totalCredit, styles: { fillColor: [76, 175, 80], textColor: [255,255,255], fontStyle: 'bold' } }],
            debitRow.map((content, index) => ({
                 content,
                 styles: { 
                     fontStyle: 'bold',
                     halign: index === 0 ? 'center' : 'right',
                     fillColor: index === 7 ? [255, 235, 59] : undefined
                }
            })),
            [{ content: 'BALANCE', colSpan: 7, styles: { fontStyle: 'bold', halign: 'center' } }, { content: closingBalance, styles: { fillColor: closingBalance < 0 ? [244, 67, 54] : [76, 175, 80], textColor: [255,255,255], fontStyle: 'bold' } }]
        ];

        (doc as any).autoTable({
            head: head,
            body: body,
            foot: footer,
            startY: 45,
            theme: 'grid',
            headStyles: {
                fillColor: [255, 192, 203], // Light pink
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40, fillColor: [211,211,211] }, // Name column with grey background
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right', fontStyle: 'bold', fillColor: [76, 175, 80], textColor: [255,255,255] } // Total column with green background
            },
            didParseCell: function(data: any) {
                 if (data.cell.raw !== '' && !isNaN(Number(data.cell.raw))) {
                    data.cell.text = [Number(data.cell.raw).toLocaleString('en-IN')];
                 }
                 if(data.section === 'foot' && data.row.index === 1 && data.column.index > 0 && data.column.index < 7) {
                    data.cell.styles.fillColor = undefined;
                 }
                 if(data.section === 'foot' && data.row.index === 1) {
                     data.cell.styles.halign = data.column.index === 0 ? 'center' : 'right';
                 }
                  if(data.section === 'foot' && (data.row.index === 0 || data.row.index === 2)) {
                     data.cell.styles.halign = 'right';
                 }
            },
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        doc.setFontSize(10);
        doc.text(`Amount in Words: ${numberToWords(closingBalance)}`, 14, finalY + 10);
    
        doc.save(`${pageTitle.replace(/ /g, "_")}_${generationDate.toISOString().split('T')[0]}.pdf`);
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
                                            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", tx.type.includes('CREDIT') ? 'bg-green-100' : 'bg-red-100')}>
                                                {tx.type.includes('CREDIT') ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownLeft className="h-4 w-4 text-red-600" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{tx.customerName || tx.companyName || 'N/A'}</p>
                                                <p className="text-sm text-muted-foreground">{TRANSACTION_TYPES[tx.type]}</p>
                                            </div>
                                        </div>
                                        <p className={cn("text-lg font-bold", tx.type.includes('CREDIT') ? 'text-green-600' : 'text-red-600')}>
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
            {transactionType && (
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

    