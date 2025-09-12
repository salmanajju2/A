'use client';
import { useFormContext, FormField, FormControl, FormItem, FormLabel } from '@/components/ui/form';
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
      <div className="space-y-2">
        {DENOMINATIONS.map((denom) => (
          <FormField
            key={denom.value}
            control={control}
            name={`denominations.d${denom.value}`}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-4">
                  <FormLabel className="w-16 flex-shrink-0 font-medium">{denom.label}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="text-center"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <span className="w-24 text-right text-muted-foreground">
                    = {formatCurrency((field.value || 0) * denom.value)}
                  </span>
                </div>
              </FormItem>
            )}
          />
        ))}
      </div>
      <div className="pt-4 text-right border-t">
        <p className="text-sm font-medium text-muted-foreground">Total from Denominations</p>
        <p className="text-xl font-bold font-headline">{formatCurrency(amount)}</p>
      </div>
    </div>
  );
}
