'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { DENOMINATIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Save } from 'lucide-react';

const denominationSchema = z.record(z.coerce.number().min(0).int());
const vaultSchema = z.object({
  denominations: denominationSchema,
  upiBalance: z.coerce.number().min(0),
});

type VaultFormValues = z.infer<typeof vaultSchema>;

export function VaultEditor() {
  const { vault, updateVault } = useAppContext();
  const { toast } = useToast();

  const form = useForm<VaultFormValues>({
    resolver: zodResolver(vaultSchema),
    defaultValues: {
      denominations: vault.denominations,
      upiBalance: vault.upiBalance,
    },
  });

  const watchedDenominations = useWatch({
    control: form.control,
    name: 'denominations',
  });

  const cashTotal = DENOMINATIONS.reduce((acc, denom) => {
    const key = `d${denom.value}` as keyof typeof watchedDenominations;
    return acc + (watchedDenominations[key] || 0) * denom.value;
  }, 0);

  const onSubmit = (data: VaultFormValues) => {
    updateVault(data);
    toast({
      title: 'Vault Updated',
      description: 'Your denomination and UPI balances have been saved.',
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Denominations</CardTitle>
            <CardDescription>Adjust the count for each note.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {DENOMINATIONS.map((denom) => (
                <FormField
                  key={denom.value}
                  control={form.control}
                  name={`denominations.d${denom.value}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{denom.label}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <div className="pt-4 text-right">
              <p className="text-muted-foreground">Calculated Cash Total</p>
              <p className="text-2xl font-bold font-headline">{formatCurrency(cashTotal)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>UPI Balance</CardTitle>
            <CardDescription>Adjust your digital balance.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="upiBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UPI Balance (INR)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Manual edits do not create transactions and can cause discrepancies in your accounting.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
