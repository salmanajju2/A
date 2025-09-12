'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from './data-table-column-header';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Badge } from '../ui/badge';
import { TRANSACTION_TYPES } from '@/lib/constants';
import { DenominationBreakdown } from './denomination-breakdown';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

export const columns: ColumnDef<Transaction>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      const isCash = row.original.type.includes('CASH');
      return (
        isCash && row.getCanExpand() && (
          <Button
            variant="ghost"
            size="icon"
            onClick={row.getToggleExpandedHandler()}
            className="h-8 w-8"
          >
            {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
          </Button>
        )
      );
    },
  },
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'timestamp',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => <div>{formatDate(new Date(row.getValue('timestamp')))}</div>,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
        const type = row.getValue('type') as string;
        const variant = type.includes('CREDIT') ? 'default' : (type.includes('DEBIT') ? 'destructive' : 'secondary');

        return <Badge variant={variant as any}>{TRANSACTION_TYPES[type as keyof typeof TRANSACTION_TYPES]}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => <div className="font-medium">{formatCurrency(row.getValue('amount'))}</div>,
  },
  {
    accessorKey: 'customerName',
    header: 'Customer',
  },
  {
    accessorKey: 'companyName',
    header: 'Company',
  },
  {
    accessorKey: 'location',
    header: 'Location',
  },
];
