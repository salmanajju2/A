'use client';
import { DENOMINATIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/helpers';
import type { DenominationCount } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface DenominationBreakdownProps {
  denominations?: Partial<DenominationCount>;
}

export function DenominationBreakdown({
  denominations,
}: DenominationBreakdownProps) {
  if (!denominations) {
    return null;
  }

  const usedDenominations = DENOMINATIONS.filter(
    (d) => (denominations[`d${d.value}` as keyof typeof denominations] || 0) > 0
  );

  if (usedDenominations.length === 0) {
    return (
      <div className="p-4 text-sm text-center text-muted-foreground">
        No denomination data recorded for this transaction.
      </div>
    );
  }

  return (
    <Card className="bg-muted/50">
        <CardHeader className='p-4'>
            <CardTitle className="text-base">Denomination Breakdown</CardTitle>
        </CardHeader>
      <CardContent className='p-4 pt-0'>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {usedDenominations.map((denom) => {
            const count = denominations[`d${denom.value}` as keyof typeof denominations] || 0;
            return (
              <div
                key={denom.value}
                className="flex items-center justify-between rounded-md border bg-background p-2 text-sm"
              >
                <div className="font-medium">{denom.label}</div>
                <div className="text-muted-foreground">{count}x</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
