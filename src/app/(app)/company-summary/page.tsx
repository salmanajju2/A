'use client';
import { useMemo, useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/helpers';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LOCATIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';

interface CompanySummary {
  credit: number;
  debit: number;
  net: number;
  transactionCount: number;
  companyName: string;
  location?: string;
}

export default function CompanySummaryPage() {
  const { transactions } = useAppContext();
  const [locationFilter, setLocationFilter] = useState('all');
  const router = useRouter();

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => 
      locationFilter === 'all' || tx.location === locationFilter
    );
  }, [transactions, locationFilter]);

  const overallSummary = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      if (tx.type === 'CASH_CREDIT') {
        acc.cashCredit += tx.amount;
      } else if (tx.type === 'UPI_CREDIT') {
        acc.upiCredit += tx.amount;
      } else if (tx.type.includes('DEBIT')) {
        acc.debit += tx.amount;
      }
      return acc;
    }, { cashCredit: 0, upiCredit: 0, debit: 0 });
  }, [filteredTransactions]);

  const totalCredit = overallSummary.cashCredit + overallSummary.upiCredit;
  const netBalance = totalCredit - overallSummary.debit;

  const companySummaries = useMemo(() => {
    const summaries: Record<string, CompanySummary> = {};

    filteredTransactions.forEach((tx) => {
      const companyKey = `${tx.companyName || 'NA'}|${tx.location || 'all'}`;

      if (!summaries[companyKey]) {
        summaries[companyKey] = { 
          credit: 0, 
          debit: 0, 
          net: 0, 
          transactionCount: 0,
          companyName: tx.companyName || 'NA',
          location: tx.location
        };
      }

      if (tx.type.includes('CREDIT')) {
        summaries[companyKey].credit += tx.amount;
      } else {
        summaries[companyKey].debit += tx.amount;
      }
      summaries[companyKey].net = summaries[companyKey].credit - summaries[companyKey].debit;
      summaries[companyKey].transactionCount++;
    });

    return Object.entries(summaries).sort((a, b) => {
        const nameA = `${a[1].companyName} ${a[1].location || ''}`.trim();
        const nameB = `${b[1].companyName} ${b[1].location || ''}`.trim();
        return nameA.localeCompare(nameB);
    });
  }, [filteredTransactions]);

  const handleRowClick = (summary: CompanySummary) => {
    const params = new URLSearchParams();
    params.set('company', summary.companyName);
    if(summary.location) {
        params.set('location', summary.location);
    }
    router.push(`/company-transactions?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Global Company Balances"
        description="A combined summary of all transactions. Click a row to view details."
      />

      <Card>
        <CardContent className="pt-6">
            <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
                <div className='flex items-center gap-2'>
                    <span className="text-muted-foreground">Total Cash Credit:</span>
                    <span className="font-semibold text-green-500">{formatCurrency(overallSummary.cashCredit)}</span>
                </div>
                <div className='flex items-center gap-2'>
                    <span className="text-muted-foreground">Total UPI Credit:</span>
                    <span className="font-semibold text-green-500">{formatCurrency(overallSummary.upiCredit)}</span>
                </div>
                <div className='flex items-center gap-2'>
                    <span className="text-muted-foreground">Total Debit:</span>
                    <span className="font-semibold text-red-500">{formatCurrency(overallSummary.debit)}</span>
                </div>
                <div className='flex items-center gap-2'>
                    <span className="text-muted-foreground">Net Balance:</span>
                    <span className={cn("font-bold", netBalance >= 0 ? 'text-green-500' : 'text-red-500')}>{formatCurrency(netBalance)}</span>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <Tabs value={locationFilter} onValueChange={setLocationFilter}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Locations</TabsTrigger>
              {LOCATIONS.map(loc => (
                  <TabsTrigger key={loc} value={loc}>{loc}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Debits</TableHead>
                  <TableHead className="text-right">Net Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companySummaries.length > 0 ? (
                  companySummaries.map(([companyKey, summary]) => (
                    <TableRow key={companyKey} onClick={() => handleRowClick(summary)} className="cursor-pointer">
                      <TableCell>
                        <div className="font-medium">{`${summary.companyName} ${summary.location || ''}`.trim()}</div>
                        <div className="text-sm text-muted-foreground">({summary.transactionCount} transactions)</div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.credit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.debit)}</TableCell>
                      <TableCell className={cn(
                        "text-right font-bold"
                      )}>
                        {formatCurrency(summary.net)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No results found for this location.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
