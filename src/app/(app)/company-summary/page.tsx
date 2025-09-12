'use client';
import { useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/helpers';
import type { Transaction } from '@/lib/types';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';

interface CompanySummary {
  credit: number;
  debit: number;
  net: number;
  transactionCount: number;
}

export default function CompanySummaryPage() {
  const { transactions } = useAppContext();

  const companySummaries = useMemo(() => {
    const summaries: Record<string, CompanySummary> = {};

    transactions.forEach((tx) => {
      const companyName = tx.companyName || 'N/A';
      if (!summaries[companyName]) {
        summaries[companyName] = { credit: 0, debit: 0, net: 0, transactionCount: 0 };
      }

      if (tx.type.includes('CREDIT')) {
        summaries[companyName].credit += tx.amount;
      } else {
        summaries[companyName].debit += tx.amount;
      }
      summaries[companyName].net = summaries[companyName].credit - summaries[companyName].debit;
      summaries[companyName].transactionCount++;
    });

    return Object.entries(summaries).sort((a, b) => a[0].localeCompare(b[0]));
  }, [transactions]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Company Summary"
        description="A summary of transactions for each company."
      />
      
      {companySummaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companySummaries.map(([companyName, summary]) => (
            <Card key={companyName}>
              <CardHeader>
                <CardTitle>{companyName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-green-600">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    <span>Total Credit</span>
                  </div>
                  <span className="font-medium">{formatCurrency(summary.credit)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-red-600">
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    <span>Total Debit</span>
                  </div>
                  <span className="font-medium">{formatCurrency(summary.debit)}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <div className="flex items-center text-primary">
                    <Scale className="h-4 w-4 mr-2" />
                    <span className="font-bold">Net Balance</span>
                  </div>
                  <span className="font-bold text-lg">{formatCurrency(summary.net)}</span>
                </div>
                 <p className="text-xs text-muted-foreground text-center pt-2">
                    Based on {summary.transactionCount} transaction(s).
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No company data to summarize.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
