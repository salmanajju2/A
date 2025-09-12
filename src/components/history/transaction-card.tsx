'use client';

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Building,
  MapPin,
  Trash,
  Pencil,
  Hash,
} from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { DENOMINATIONS } from '@/lib/constants';

interface TransactionCardProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (id: string, isSelected: boolean) => void;
}

export function TransactionCard({ transaction, isSelected, onSelect }: TransactionCardProps) {
  const { deleteTransactions } = useAppContext();
  const { toast } = useToast();

  const isCredit = transaction.type.includes('CREDIT');
  const isCash = transaction.type.includes('CASH');

  const handleDelete = () => {
    deleteTransactions([transaction.id]);
    toast({ title: "Transaction deleted." });
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(transaction.id, !!checked)}
          />
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-full ${
              isCredit ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
            }`}
          >
            {isCredit ? (
              <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <ArrowDownLeft className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div>
            <p className="font-semibold text-lg">{transaction.customerName}</p>
            <p className="text-sm text-muted-foreground">{formatDate(new Date(transaction.timestamp))}</p>
          </div>
        </div>
        <p
          className={`text-xl font-bold ${
            isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {formatCurrency(transaction.amount)}
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2 text-sm">
            <InfoLine icon={Hash} label="ID" value={transaction.id} />
            <InfoLine icon={User} label="Customer" value={transaction.customerName} />
            <InfoLine icon={Building} label="Company" value={transaction.companyName} />
            <InfoLine icon={MapPin} label="Location" value={transaction.location} />
        </div>

        {isCash && transaction.denominations && (
            <div>
                <h4 className="font-semibold mb-2">Cash Denomination Breakdown:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    {DENOMINATIONS.map(denom => {
                        const count = transaction.denominations?.[`d${denom.value}` as keyof typeof transaction.denominations] || 0;
                        if (count > 0) {
                            return (
                                <li key={denom.value}>
                                    {denom.label}: {count} notes ({formatCurrency(count * denom.value)})
                                </li>
                            )
                        }
                        return null;
                    })}
                </ul>
                 <p className="font-semibold mt-2 text-sm">Total Cash Value: {formatCurrency(transaction.amount)}</p>
            </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}


function InfoLine({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) {
    if (!value) return null;
    return (
        <div className="flex items-start">
            <Icon className="h-4 w-4 mt-0.5 mr-3 text-muted-foreground" />
            <span className="font-semibold w-24">{label}:</span>
            <span className="flex-1 break-words">{value}</span>
        </div>
    )
}
