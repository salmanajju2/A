'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TRANSACTION_TYPES, COMPANY_NAMES, LOCATIONS } from '@/lib/constants';
import type { Transaction } from '@/lib/types';
import { Button } from '../ui/button';
import { Trash } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';

interface HistoryToolbarProps {
  transactions: Transaction[];
  onFilter: (filtered: Transaction[]) => void;
  selectedCount: number;
  totalCount: number;
  onToggleAll: (checked: boolean) => void;
  selectedIds: string[];
}

export function HistoryToolbar({ transactions, onFilter, selectedCount, totalCount, onToggleAll, selectedIds }: HistoryToolbarProps) {
  const searchParams = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>(searchParams.get('company') || 'all');
  const [locationFilter, setLocationFilter] = useState<string>(search_params.get('location') || 'all');
  const { deleteTransactions } = useAppContext();
  const { toast } = useToast();

  useEffect(() => {
    // Apply filters to the transactions passed in props
    const filtered = transactions.filter(t => {
      // On the main history page, only show global transactions.
      if (t.scope === 'company' && !searchParams.has('company')) return false;

      const typeMatch = typeFilter === 'all' || t.type === typeFilter;
      const companyMatch = companyFilter === 'all' || t.companyName === companyFilter;
      const locationMatch = locationFilter === 'all' || t.location === locationFilter;
      
      return typeMatch && companyMatch && locationMatch;
    });
    onFilter(filtered);
  }, [typeFilter, companyFilter, locationFilter, transactions, onFilter, searchParams]);

  const handleDelete = () => {
    deleteTransactions(selectedIds);
    toast({ title: `${selectedIds.length} transaction(s) deleted.` });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TRANSACTION_TYPES).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Companies" />
            </Trigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {COMPANY_NAMES.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Locations" />
            </Trigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {LOCATIONS.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Checkbox 
                    id="select-all" 
                    onCheckedChange={(checked) => onToggleAll(!!checked)}
                    checked={selectedCount > 0 && selectedCount === totalCount}
                />
                <Label htmlFor="select-all">Select/Deselect All ({selectedCount} of {totalCount} selected)</Label>
            </div>
            <div className="flex items-center space-x-2">
                {selectedCount > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete ({selectedCount})
                    </Button>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
