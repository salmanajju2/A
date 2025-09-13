'use client';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import type { DenominationCount } from '@/lib/types';
import { TRANSACTION_TYPES, COMPANY_NAMES, LOCATIONS } from '@/lib/constants';
import { DenominationInput } from './denomination-input';
import { useEffect } from 'react';
import { formatCurrency } from '@/lib/helpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  denominations: z.custom<Partial<DenominationCount>>().optional(),
  customerName: z.string().optional(),
  companyName: z.string().optional(),
  location: z.string().optional(),
  scope: z.enum(['global', 'company']).optional(),
});

type TransactionFormValues = z.infer<typeof formSchema>;

export function NewCashDebitForm() {
  const { addTransaction } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      customerName: '',
      companyName: '',
      location: '',
      scope: 'global',
      denominations: {},
    },
  });
  
  const watchedDenominations = useWatch({
    control: form.control,
    name: "denominations",
  });
  
  useEffect(() => {
    if (watchedDenominations) {
        const total = Object.entries(watchedDenominations).reduce((acc, [key, count]) => {
            const value = parseInt(key.replace('d', ''));
            return acc + (count || 0) * value;
        }, 0);
        if (form.getValues('amount') !== total) {
          form.setValue('amount', total, { shouldValidate: true });
        }
    }
  }, [watchedDenominations, form]);

  const onSubmit = (data: TransactionFormValues) => {
    try {
        addTransaction({
            type: 'CASH_DEBIT',
            ...data,
        });
        toast({
            title: 'Transaction Added',
            description: `Cash Debit of ${formatCurrency(data.amount)} recorded.`,
        });
        form.reset();
        router.push('/history');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };
  
  return (
    <Card>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <DenominationInput form={form} />
                </div>
                <div className="space-y-4">
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
                        <Select onValueChange={field.onChange} value={field.value || ''}>
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
                        <Select onValueChange={field.onChange} value={field.value || ''}>
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

            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Transaction
                </Button>
            </CardFooter>
        </form>
        </Form>
    </Card>
  );
}
