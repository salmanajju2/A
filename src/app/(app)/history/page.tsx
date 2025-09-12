'use client';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/history/data-table';
import { columns } from '@/components/history/columns';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent } from '@/components/ui/card';
import StatCard from '@/components/dashboard/stat-card';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function HistoryPage() {
    const { transactions } = useAppContext();

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Transaction History" description="Search and manage all your transactions." />
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <StatCard
                    title="Total Credit"
                    statType="credit"
                    icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Total Debit"
                    statType="debit"
                    icon={<ArrowDownLeft className="h-4 w-4 text-muted-foreground" />}
                />
            </div>
            
            <Card>
                <CardContent className="pt-6">
                    <DataTable columns={columns} data={transactions} />
                </CardContent>
            </Card>
        </div>
    );
}
