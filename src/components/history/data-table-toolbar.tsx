'use client';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash, Download, FileDown } from 'lucide-react';
import { DataTableViewOptions } from './data-table-view-options';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { TRANSACTION_TYPES } from '@/lib/constants';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

const transactionTypeOptions = Object.entries(TRANSACTION_TYPES).map(([value, label]) => ({
  value,
  label,
}));


export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
    const { deleteTransactions } = useAppContext();
    const { toast } = useToast();

    const handleDelete = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const idsToDelete = selectedRows.map(row => (row.original as Transaction).id);
        deleteTransactions(idsToDelete);
        table.toggleAllPageRowsSelected(false);
        toast({ title: `${idsToDelete.length} transaction(s) deleted.` });
    };

    const exportToCSV = () => {
        const rows = table.getFilteredRowModel().rows.map(row => row.original as Transaction);
        if (rows.length === 0) {
            toast({ variant: "destructive", title: "No data to export" });
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
        toast({ title: "Exported to CSV" });
    }

    const exportToPDF = () => {
      const rows = table.getFilteredRowModel().rows.map(row => row.original as Transaction);
      if (rows.length === 0) {
        toast({ variant: "destructive", title: "No data to export" });
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
      doc.text("Transaction History", 14, 15);
      doc.save("transactions.pdf");
      toast({ title: "Exported to PDF" });
    };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by customer..."
          value={(table.getColumn('customerName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('customerName')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('type') && (
          <DataTableFacetedFilter
            column={table.getColumn('type')}
            title="Type"
            options={transactionTypeOptions}
          />
        )}
      </div>
      <div className="flex items-center space-x-2">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button variant="destructive" size="sm" className="h-8" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
        )}
        <Button variant="outline" size="sm" className="h-8" onClick={exportToPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF
        </Button>
        <Button variant="outline" size="sm" className="h-8" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
        </Button>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
