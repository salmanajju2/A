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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';

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
    const [searchTerm, setSearchTerm] = useState('');
    
    const company = searchParams.get('company');
    const location = searchParams.get('location');

    const filteredTransactions = useMemo(() => {
        if (!company) return [];
        let filtered = transactions.filter(t => {
            const companyMatch = t.companyName === company;
            const locationMatch = !location || t.location === location;
            return companyMatch && locationMatch;
        });

        if (searchTerm) {
            filtered = filtered.filter(t => 
                t.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [transactions, company, location, searchTerm]);
    
    const summary = useMemo(() => {
        // If there's a search term, summarize based on filtered transactions.
        // Otherwise, summarize all transactions for the company/location.
        const txnsToSummarize = searchTerm ? filteredTransactions : transactions.filter(t => {
            const companyMatch = t.companyName === company;
            const locationMatch = !location || t.location === location;
            return companyMatch && locationMatch;
        });

        return txnsToSummarize.reduce((acc, tx) => {
            if (tx.type.includes('CREDIT')) {
                acc.credit += tx.amount;
                if (tx.type.includes('CASH')) {
                    acc.cashCredit += tx.amount;
                } else if (tx.type.includes('UPI')) {
                    acc.upiCredit += tx.amount;
                }
            } else {
                acc.debit += tx.amount;
            }
            acc.net = acc.credit - acc.debit;
            return acc;
        }, { credit: 0, debit: 0, net: 0, cashCredit: 0, upiCredit: 0 });
    }, [transactions, company, location, searchTerm, filteredTransactions]);

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
        
        const mainTitle = `Report for ${company} ${location || ''}`.trim();
        const generatedDate = `Generated on: ${new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).replace(',', '')}`;
        
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(mainTitle, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(generatedDate, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

        const customerCredits: { [key: string]: { cash: (string | number)[], upi: (string | number)[] } } = {};
        const allTransactions = transactions.filter(t => t.companyName === company && (!location || t.location === location));
        const sortedTransactions = [...allTransactions].sort((a, b) => (a.customerName || 'zzz').localeCompare(b.customerName || 'zzz'));

        sortedTransactions.forEach(tx => {
            if (tx.type.includes('CREDIT') && tx.customerName) {
                if (!customerCredits[tx.customerName]) {
                    customerCredits[tx.customerName] = { cash: Array(4).fill(''), upi: Array(4).fill('') };
                }
                const customer = customerCredits[tx.customerName];
                const slots = tx.type === 'CASH_CREDIT' ? customer.cash : customer.upi;
                const emptyIndex = slots.findIndex(c => c === '');
                if (emptyIndex !== -1) {
                    slots[emptyIndex] = formatCurrency(tx.amount, { symbol: '' });
                }
            }
        });
        
        let body = Object.entries(customerCredits).map(([name, data]) => {
            const total = [...data.cash, ...data.upi].reduce((sum: number, val) => {
                const num = parseFloat(String(val).replace(/[,]/g, ''));
                return sum + (isNaN(num) ? 0 : num);
            }, 0);
            return [
                name.toUpperCase(),
                ...data.cash,
                ...data.upi,
                total > 0 ? formatCurrency(total, { symbol: '' }) : ''
            ];
        });

        const requiredRows = 12;
        while (body.length < requiredRows) {
            body.push(['', '', '', '', '', '', '', '', '', '']);
        }

        const totalCredit = body.reduce((sum, row) => {
            const num = parseFloat(String(row[9]).replace(/[,]/g, ''));
            return sum + (isNaN(num) ? 0 : num);
        }, 0);

        const entryTransactions = allTransactions.filter(tx => tx.type === 'COMPANY_ADJUSTMENT_DEBIT');
        const totalDebit = entryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        
        const debitEntries: (string | number)[] = Array(8).fill('');
        entryTransactions.slice(0, 8).forEach((tx, i) => {
             // Place entries in cash columns
            debitEntries[i] = formatCurrency(tx.amount, { symbol: '' });
        });

        const closingBalance = totalCredit - totalDebit;
        
        const head = [
            [
                { content: 'Customer Name', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Cash', colSpan: 4, styles: { halign: 'center' } },
                { content: 'UPI', colSpan: 4, styles: { halign: 'center' } },
                { content: 'Total Credit', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
            ],
            ['1st', '2nd', '3rd', '4th', '1st', '2nd', '3rd', '4th']
        ];

        const foot = [
            [
                { content: 'Total Credit', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: formatCurrency(totalCredit, { symbol: '' }), styles: { fillColor: '#e9fce9', fontStyle: 'bold' } }
            ],
            [
                { content: 'Entry', styles: { fontStyle: 'bold' } },
                ...debitEntries,
                { content: formatCurrency(totalDebit, { symbol: '' }), styles: { fillColor: '#ffebee', fontStyle: 'bold' } }
            ],
            [
                { content: 'Closing Balance', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold' } },
                { 
                    content: formatCurrency(closingBalance, { symbol: '' }), 
                    styles: { 
                        fillColor: closingBalance >= 0 ? '#e9fce9' : '#ffebee', 
                        textColor: closingBalance >= 0 ? [0, 128, 0] : [255, 0, 0],
                        fontStyle: 'bold' 
                    } 
                }
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
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                textColor: [0, 0, 0],
                fontSize: 10,
            },
            headStyles: {
                fillColor: '#FFFFFF',
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
            },
            footStyles: {
                fillColor: '#FFFFFF',
                textColor: [0, 0, 0],
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
                5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' },
                9: { halign: 'right' },
            },
            didParseCell: (data) => {
                 if (data.section === 'foot') {
                    data.cell.styles.fontStyle = 'bold';
                    if (data.row.index === 1 && data.column.index > 0 && data.column.index < 9) {
                         data.cell.styles.halign = 'right';
                    }
                }
                 if (data.section === 'body') {
                     data.cell.styles.fontStyle = 'bold';
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
    const totalTransactions = transactions.filter(t => t.companyName === company && (!location || t.location === location)).length;

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title={pageTitle}
                description={searchTerm ? `Showing results for "${searchTerm}"` :`A summary of ${totalTransactions} transactions.`}
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleOpenDialog('UPI_CREDIT')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add UPI
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
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
                        <div className='flex items-center gap-2'>
                            <span className="text-muted-foreground">Total Cash Credit:</span>
                            <span className="font-semibold">{formatCurrency(summary.cashCredit)}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <span className="text-muted-foreground">Total UPI Credit:</span>
                            <span className="font-semibold">{formatCurrency(summary.upiCredit)}</span>
                        </div>
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Input 
                            placeholder="Search by customer name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
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
                                        <div className='flex items-center gap-4'>
                                            <p className={cn("text-lg font-bold", tx.type.includes('CREDIT') ? 'text-green-500' : 'text-red-500')}>
                                                {formatCurrency(tx.amount)}
                                            </p>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="sm" className="p-1 h-auto">
                                                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                                                </Button>
                                            </CollapsibleTrigger>
                                        </div>
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
                                    <div className="border-t bg-muted/50 p-2 flex justify-end items-center">
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
                                    </CollapsibleContent>
                                </Collapsible>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No transactions found matching your search.</p>
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
