import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-lg font-bold font-headline', className)}>
      <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
        <Wallet className="h-5 w-5" />
      </div>
      <span>Denomination Depot</span>
    </div>
  );
}
