'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TRANSACTION_TYPES, COMPANY_NAMES, LOCATIONS } from '@/lib/constants';
import type { Transaction, TransactionType } from '@/lib/types';
import { Button } from '../ui/button';
import { Trash, FileDown, Download } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


interface HistoryToolbarProps {
  transactions: Transaction[];
  onFilter: (filtered: Transaction[]) => void;
  selectedCount: number;
  totalCount: number;
  onToggleAll: (checked: boolean) => void;
  selectedIds: string[];
}

export function HistoryToolbar({ transactions, onFilter, selectedCount, totalCount, onToggleAll, selectedIds }: HistoryToolbarProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const { deleteTransactions } = useAppContext();
  const { toast } = useToast();

  useEffect(() => {
    const filtered = transactions.filter(t => {
      const typeMatch = typeFilter === 'all' || t.type === typeFilter;
      const companyMatch = companyFilter === 'all' || t.companyName === companyFilter;
      const locationMatch = locationFilter === 'all' || t.location === locationFilter;
      return typeMatch && companyMatch && locationMatch;
    });
    onFilter(filtered);
  }, [typeFilter, companyFilter, locationFilter, transactions, onFilter]);

  const handleDelete = () => {
    deleteTransactions(selectedIds);
    toast({ title: `${selectedIds.length} transaction(s) deleted.` });
  };

  const exportToCSV = () => {
        const rows = transactions.filter(tx => selectedIds.includes(tx.id));
        if (rows.length === 0) {
            toast({ variant: "destructive", title: "No transactions selected to export" });
            return;
        }

        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => headers.map(header => JSON.stringify((row as any)[header])).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "transactions.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        toast({ title: `Exported ${rows.length} transactions to CSV` });
    }

    const exportToPDF = () => {
      const rows = transactions.filter(tx => selectedIds.includes(tx.id));
      if (rows.length === 0) {
        toast({ variant: "destructive", title: "No transactions selected to export" });
        return;
      }
  
      const doc = new jsPDF();
      
      const tableColumn = ["Date", "Type", "Amount", "Customer", "Company", "Location"];
      const tableRows: any[] = [];
  
      rows.forEach(transaction => {
        const transactionData = [
          new Date(transaction.timestamp).toLocaleString(),
          transaction.type,
          transaction.amount.toString(),
          transaction.customerName,
          transaction.companyName,
          transaction.location,
        ];
        tableRows.push(transactionData);
      });
  
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      doc.text(`Transaction History (${rows.length} items)`, 14, 15);
      doc.save("transactions.pdf");
      toast({ title: `Exported ${rows.length} transactions to PDF` });
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
            </SelectTrigger>
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
            </SelectTrigger>
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
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                    <FileDown className="mr-2 h-4 w-4" />
                    PDF
                </Button>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
