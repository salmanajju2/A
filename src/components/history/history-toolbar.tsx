'use client';

import type { Transaction } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, FileDown, Trash } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { TRANSACTION_TYPES } from '@/lib/constants';
import { formatCurrency } from '@/lib/helpers';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface HistoryToolbarProps {
  transactions: Transaction[];
  onFilter: (filtered: Transaction[]) => void;
  selectedCount: number;
  totalCount: number;
  onToggleAll: (checked: boolean) => void;
  selectedIds: string[];
}

export function HistoryToolbar({
  transactions,
  onFilter,
  selectedCount,
  totalCount,
  onToggleAll,
  selectedIds,
}: HistoryToolbarProps) {
  const { deleteTransactions } = useAppContext();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date(),
  });
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.type.includes('CREDIT')) {
          acc.credit += tx.amount;
        } else {
          acc.debit += tx.amount;
        }
        acc.net = acc.credit - acc.debit;
        return acc;
      },
      { credit: 0, debit: 0, net: 0 }
    );
  }, [transactions]);

  useEffect(() => {
    const filtered = transactions.filter((tx) => {
      const searchTermMatch =
        !searchTerm ||
        tx.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

      const dateMatch =
        !date ||
        (new Date(tx.timestamp) >= (date.from || 0) &&
          new Date(tx.timestamp) <= (date.to || new Date()));

      const typeMatch =
        selectedTypes.size === 0 || selectedTypes.has(tx.type);

      return searchTermMatch && dateMatch && typeMatch;
    });
    onFilter(filtered);
  }, [searchTerm, date, selectedTypes, transactions, onFilter]);

  const handleDeleteSelected = () => {
    deleteTransactions(selectedIds);
    toast({ title: `${selectedIds.length} transaction(s) deleted.` });
    onToggleAll(false); // Deselect all after deletion
  };
  
  const handleExport = () => {
    const doc = new jsPDF();
    const tableData = transactions
        .filter(tx => selectedIds.includes(tx.id))
        .map(tx => [
            formatDate(new Date(tx.timestamp)),
            TRANSACTION_TYPES[tx.type],
            tx.customerName || '',
            formatCurrency(tx.amount),
        ]);

    autoTable(doc, {
        head: [['Date', 'Type', 'Customer', 'Amount']],
        body: tableData,
    });
    doc.save(`transactions-export-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const transactionTypeOptions = Object.entries(TRANSACTION_TYPES).map(
    ([value, label]) => ({ value, label })
  );

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Input
          placeholder="Filter by customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  'w-[300px] justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd, y')} -{' '}
                      {format(date.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Type ({selectedTypes.size})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {transactionTypeOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selectedTypes.has(option.value)}
                  onCheckedChange={(checked) => {
                    setSelectedTypes((prev) => {
                      const newSet = new Set(prev);
                      if (checked) newSet.add(option.value);
                      else newSet.delete(option.value);
                      return newSet;
                    });
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={selectedCount > 0 && selectedCount === totalCount}
            onCheckedChange={(checked) => onToggleAll(!!checked)}
            aria-label="Select all"
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Select All ({selectedCount} of {totalCount})
          </label>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
             <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

       <div className="flex flex-wrap gap-x-8 gap-y-2 border-t pt-4 text-sm">
            <div className='flex items-center gap-2'>
                <span className="text-muted-foreground">Total Credit:</span>
                <span className="font-semibold text-green-500">{formatCurrency(summary.credit)}</span>
            </div>
            <div className='flex items-center gap-2'>
                <span className="text-muted-foreground">Total Debit:</span>
                <span className="font-semibold text-red-500">{formatCurrency(summary.debit)}</span>
            </div>
            <div className='flex items-center gap-2'>
                <span className="text-muted-foreground">Net Balance:</span>
                <span className={cn("font-bold", summary.net >= 0 ? 'text-green-500' : 'text-red-500')}>{formatCurrency(summary.net)}</span>
            </div>
        </div>
    </div>
  );
}
