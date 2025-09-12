'use client';
import { useMemo, useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/helpers';
import type { Transaction } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LOCATIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CompanySummary {
  credit: number;
  debit: number;
  net: number;
  transactionCount: number;
}

export default function CompanySummaryPage() {
  const { transactions } = useAppContext();
  const [locationFilter, setLocationFilter] = useState('all');

  const companySummaries = useMemo(() => {
    const summaries: Record<string, CompanySummary> = {};

    const filteredTransactions = transactions.filter(tx => 
      locationFilter === 'all' || tx.location === locationFilter
    );

    filteredTransactions.forEach((tx) => {
      const companyKey = `${tx.companyName || 'NA'} ${tx.location || ''}`.trim();

      if (!summaries[companyKey]) {
        summaries[companyKey] = { credit: 0, debit: 0, net: 0, transactionCount: 0 };
      }

      if (tx.type.includes('CREDIT')) {
        summaries[companyKey].credit += tx.amount;
      } else {
        summaries[companyKey].debit += tx.amount;
      }
      summaries[companyKey].net = summaries[companyKey].credit - summaries[companyKey].debit;
      summaries[companyKey].transactionCount++;
    });

    return Object.entries(summaries).sort((a, b) => a[0].localeCompare(b[0]));
  }, [transactions, locationFilter]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Global Company Balances"
        description="A combined summary of all transactions."
      />
      
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
                    <TableRow key={companyKey}>
                      <TableCell>
                        <div className="font-medium">{companyKey}</div>
                        <div className="text-sm text-muted-foreground">({summary.transactionCount} transactions)</div>
                      </TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(summary.credit)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(summary.debit)}</TableCell>
                      <TableCell className={cn(
                        "text-right font-bold",
                        summary.net < 0 ? "text-red-600" : "text-primary"
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