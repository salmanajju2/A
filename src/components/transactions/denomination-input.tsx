'use client';
import { useFormContext, FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DENOMINATIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/helpers';

interface DenominationInputProps {
  form: any;
}

export function DenominationInput({ form }: DenominationInputProps) {
  const { control, watch } = form;
  
  const denominations = watch('denominations');
  const amount = watch('amount');

  return (
    <div className="space-y-4 rounded-lg border p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {DENOMINATIONS.map((denom) => (
            <FormField
            key={denom.value}
            control={control}
            name={`denominations.d${denom.value}`}
            render={({ field }) => (
                <FormItem>
                <FormLabel>{denom.label}</FormLabel>
                <FormControl>
                    <Input
                     type="number"
                     {...field}
                     onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                     value={field.value || ''}
                    />
                </FormControl>
                </FormItem>
            )}
            />
        ))}
        </div>
        <div className="pt-2 text-right">
            <p className="text-sm font-medium text-muted-foreground">Total from Denominations</p>
            <p className="text-xl font-bold font-headline">{formatCurrency(amount)}</p>
        </div>
    </div>
  );
}
