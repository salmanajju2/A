'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { handleImport } from '@/actions/import';
import { useAppContext } from '@/context/app-context';

interface ImportTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportTransactionsDialog({ open, onOpenChange }: ImportTransactionsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { importTransactions } = useAppContext();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const onImport = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No file selected' });
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const result = await handleImport({ fileData: content });

      if (result.success && result.data) {
        importTransactions(result.data);
        toast({ title: 'Import Successful', description: `${result.data.length} transactions imported.` });
        onOpenChange(false);
        setFile(null);
      } else {
        toast({ variant: 'destructive', title: 'Import Failed', description: result.error });
      }
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Transactions with AI</DialogTitle>
          <DialogDescription>
            Upload a file (e.g., CSV, text) and our AI will parse the transactions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input type="file" onChange={handleFileChange} accept=".csv,.txt,.text" />
          {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onImport} disabled={!file || isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
