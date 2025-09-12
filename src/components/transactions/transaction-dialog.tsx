'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import type { TransactionType, DenominationCount } from '@/lib/types';
import { TRANSACTION_TYPES } from '@/lib/constants';
import { DenominationInput } from './denomination-input';
import { useEffect } from 'react';
import { formatCurrency } from '@/lib/helpers';
import { ScrollArea } from '../ui/scroll-area';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionType: TransactionType;
}

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  description: z.string().optional(),
  denominations: z.custom<Partial<DenominationCount>>().optional(),
  accountId: z.string().optional(),
  atmId: z.string().optional(),
  partnerBankUTR: z.string().optional(),
  customerName: z.string().optional(),
  companyName: z.string().optional(),
  location: z.string().optional(),
  upiTransactionId: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof formSchema>;

export function TransactionDialog({ open, onOpenChange, transactionType }: TransactionDialogProps) {
  const { addTransaction, user } = useAppContext();
  const { toast } = useToast();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: '',
      accountId: '',
      atmId: '',
      partnerBankUTR: '',
      customerName: '',
      companyName: '',
      location: '',
      upiTransactionId: '',
    },
  });

  const isCashTransaction = transactionType.includes('CASH');

  const watchedDenominations = useWatch({
    control: form.control,
    name: "denominations",
  });

  useEffect(() => {
    if (isCashTransaction && watchedDenominations) {
        const total = Object.entries(watchedDenominations).reduce((acc, [key, count]) => {
            const value = parseInt(key.replace('d', ''));
            return acc + (count || 0) * value;
        }, 0);
        form.setValue('amount', total, { shouldValidate: true });
    }
  }, [watchedDenominations, isCashTransaction, form]);


  const onSubmit = (data: TransactionFormValues) => {
    try {
        if(isCashTransaction && data.amount !== form.getValues('amount')) {
            toast({ variant: 'destructive', title: 'Mismatch', description: 'Denomination total does not match amount.'});
            return;
        }

        addTransaction({
            type: transactionType,
            ...data,
        });
        toast({
            title: 'Transaction Added',
            description: `${TRANSACTION_TYPES[transactionType]} of ${formatCurrency(data.amount)} recorded.`,
        });
        form.reset();
        onOpenChange(false);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Transaction: {TRANSACTION_TYPES[transactionType]}</DialogTitle>
          <DialogDescription>
            Fill in the details for your new transaction.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4">
                {isCashTransaction ? (
                    <DenominationInput form={form} />
                ) : (
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                
                {!isCashTransaction && <FormField control={form.control} name="upiTransactionId" render={({ field }) => (
                    <FormItem><FormLabel>UPI ID</FormLabel><FormControl><Input placeholder="Enter UPI Transaction ID" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>}

                <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="Enter customer's name" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                 <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="Enter company name" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                 <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Enter location" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description / Notes</FormLabel><FormControl><Textarea placeholder="Add a description or any notes..." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                
                <FormItem>
                    <FormLabel>Recorded By</FormLabel>
                    <FormControl>
                        <Input disabled value={user?.name} />
                    </FormControl>
                </FormItem>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Add Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
