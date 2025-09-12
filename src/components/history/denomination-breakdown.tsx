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
    return <div className="p-4 text-center">No denomination data.</div>;
  }

  const usedDenominations = DENOMINATIONS.filter(
    (d) => (denominations[`d${d.value}` as keyof typeof denominations] || 0) > 0
  );

  if (usedDenominations.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No specific denominations were recorded for this transaction.
      </div>
    );
  }

  return (
    <Card className="m-4 bg-muted/50">
        <CardHeader>
            <CardTitle className="text-base">Denomination Breakdown</CardTitle>
        </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {usedDenominations.map((denom) => {
            const count = denominations[`d${denom.value}` as keyof typeof denominations] || 0;
            const total = count * denom.value;
            return (
              <div
                key={denom.value}
                className="flex items-center justify-between rounded-md border bg-background p-3"
              >
                <div className="font-medium">{denom.label}</div>
                <div className="text-sm">
                  <span className="text-muted-foreground">{count}x = </span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
