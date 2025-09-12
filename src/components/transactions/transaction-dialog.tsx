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
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import type { TransactionType, DenominationCount, Transaction } from '@/lib/types';
import { TRANSACTION_TYPES, COMPANY_NAMES, LOCATIONS } from '@/lib/constants';
import { DenominationInput } from './denomination-input';
import { useEffect } from 'react';
import { formatCurrency } from '@/lib/helpers';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionType?: TransactionType | null;
  transaction?: Transaction | null;
  defaults?: Partial<Transaction>;
}

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  customerName: z.string().optional(),
  denominations: z.custom<Partial<DenominationCount>>().optional(),
  companyName: z.string().optional(),
  location: z.string().optional(),
  scope: z.enum(['global', 'company']).optional(),
  upiTransactionId: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof formSchema>;

export function TransactionDialog({ open, onOpenChange, transactionType, transaction, defaults }: TransactionDialogProps) {
  const { addTransaction, updateTransaction } = useAppContext();
  const { toast } = useToast();
  
  const isEditMode = !!transaction;
  const currentTransactionType = transaction?.type || transactionType;
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      customerName: '',
      companyName: '',
      location: '',
      scope: 'global',
      upiTransactionId: '',
      ...defaults
    },
  });

  const isCashTransaction = currentTransactionType?.includes('CASH');
  
  const watchedDenominations = useWatch({
    control: form.control,
    name: "denominations",
  });
  
  useEffect(() => {
    if (open) {
      const initialValues = {
        amount: 0,
        customerName: '',
        companyName: defaults?.companyName || '',
        location: defaults?.location || '',
        denominations: {},
        scope: defaults?.scope || 'global',
        upiTransactionId: '',
        ...transaction
      };
      form.reset(initialValues as any);
    }
  }, [open, transaction, form, defaults]);
  
  useEffect(() => {
    if (isCashTransaction && watchedDenominations) {
        const total = Object.entries(watchedDenominations).reduce((acc, [key, count]) => {
            const value = parseInt(key.replace('d', ''));
            return acc + (count || 0) * value;
        }, 0);
        if (form.getValues('amount') !== total) {
          form.setValue('amount', total, { shouldValidate: true });
        }
    }
  }, [watchedDenominations, isCashTransaction, form]);


  const onSubmit = (data: TransactionFormValues) => {
    try {
        if(!currentTransactionType) {
            throw new Error("Cannot submit without a transaction type.");
        }

        if (isEditMode && transaction) {
            updateTransaction(transaction.id, data );
            toast({
                title: 'Transaction Updated',
                description: `Transaction ${transaction.id} has been updated.`,
            });
        } else {
            addTransaction({
                type: currentTransactionType,
                ...data,
            });
            toast({
                title: 'Transaction Added',
                description: `${TRANSACTION_TYPES[currentTransactionType]} of ${formatCurrency(data.amount)} recorded.`,
            });
        }
        
        onOpenChange(false);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };
  
  if (!open || !currentTransactionType) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Transaction' : `New: ${TRANSACTION_TYPES[currentTransactionType]}`}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modify the details of your existing transaction.' : 'Fill in the details for your new transaction.'}
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
                              <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                
                 <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!!defaults?.companyName}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPANY_NAMES.map((company) => (
                            <SelectItem key={company} value={company}>
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!!defaults?.location}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOCATIONS.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Transaction'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
