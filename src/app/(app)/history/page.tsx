'use client';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/history/data-table';
import { columns } from '@/components/history/columns';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent } from '@/components/ui/card';

export default function HistoryPage() {
    const { transactions } = useAppContext();

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Transaction History" description="Search and manage all your transactions." />
            <Card>
                <CardContent className="pt-6">
                    <DataTable columns={columns} data={transactions} />
                </CardContent>
            </Card>
        </div>
    );
}
