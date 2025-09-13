'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
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
  ChevronDown,
} from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { DenominationBreakdown } from './denomination-breakdown';
import { TransactionDialog } from '../transactions/transaction-dialog';
import { cn } from '@/lib/utils';

interface TransactionCardProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (id: string, isSelected: boolean) => void;
}

export function TransactionCard({ transaction, isSelected, onSelect }: TransactionCardProps) {
  const { deleteTransactions } = useAppContext();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isCredit = transaction.type.includes('CREDIT');

  const handleDelete = () => {
    deleteTransactions([transaction.id]);
    toast({ title: "Transaction deleted." });
  }

  return (
    <Collapsible>
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2 md:gap-4">
                <Checkbox 
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(transaction.id, !!checked)}
                    aria-label={`Select transaction ${transaction.id}`}
                />
                <div
                    className={`hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-muted`}
                >
                    {isCredit ? (
                    <ArrowUpRight className="h-5 w-5" />
                    ) : (
                    <ArrowDownLeft className="h-5 w-5" />
                    )}
                </div>
                <div>
                    <p className="font-semibold text-base md:text-lg">{transaction.customerName || 'N/A'}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{formatDate(new Date(transaction.timestamp))}</p>
                </div>
                </div>
                <p
                className={cn(
                    'text-lg md:text-xl font-bold',
                    isCredit ? 'text-green-500' : 'text-red-500'
                )}
                >
                {formatCurrency(transaction.amount)}
                </p>
            </CardHeader>
            <CollapsibleContent>
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <InfoLine icon={Hash} label="ID" value={transaction.id} />
                        <InfoLine icon={User} label="Customer" value={transaction.customerName} />
                        <InfoLine icon={Building} label="Company" value={transaction.companyName} />
                        <InfoLine icon={MapPin} label="Location" value={transaction.location} />
                        {transaction.upiTransactionId && <InfoLine icon={Hash} label="UPI ID" value={transaction.upiTransactionId} />}
                    </div>

                    <DenominationBreakdown denominations={transaction.denominations} />
                </CardContent>
                <CardFooter className="p-2 flex justify-end gap-2 bg-muted/50 border-t">
                    <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </CardFooter>
            </CollapsibleContent>
            <CardFooter className="p-2 flex justify-start">
                <CollapsibleTrigger asChild>
                     <Button variant="ghost" size="sm">
                        <ChevronDown className="h-4 w-4 mr-2 transition-transform data-[state=open]:rotate-180" />
                        Details
                    </Button>
                </CollapsibleTrigger>
            </CardFooter>
        </Card>
        
        <TransactionDialog 
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          transaction={transaction}
        />
    </Collapsible>
  );
}


function InfoLine({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) {
    if (!value) return null;
    return (
        <div className="flex items-start">
            <Icon className="h-4 w-4 mt-0.5 mr-3 text-muted-foreground flex-shrink-0" />
            <div className='flex flex-col'>
              <span className="font-semibold">{label}</span>
              <span className="break-words">{value}</span>
            </div>
        </div>
    )
}
