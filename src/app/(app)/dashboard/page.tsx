import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import AccountBalances from '@/components/dashboard/account-balances';
import QuickActions from '@/components/dashboard/quick-actions';
import { PageHeader } from '@/components/shared/page-header';

export default function DashboardPage() {

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" description="Your financial overview at a glance.">
        <QuickActions />
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <StatCard
          title="Net Operating Balance"
          statType="net"
          icon={<Scale className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your last 5 transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle>Account Balances</CardTitle>
            <CardDescription>
              Current balance in your vault and UPI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountBalances />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
