'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { TransactionDialog } from '../transactions/transaction-dialog';
import type { TransactionType } from '@/lib/types';

export default function QuickActions() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<TransactionType | null>(null);

    const handleOpenDialog = (type: TransactionType) => {
        setTransactionType(type);
        setDialogOpen(true);
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleOpenDialog('CASH_CREDIT')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Cash
            </Button>
            <Button variant="secondary" onClick={() => handleOpenDialog('UPI_CREDIT')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add UPI
            </Button>

            {transactionType && (
                <TransactionDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    transactionType={transactionType}
                />
            )}
        </div>
    )
}
