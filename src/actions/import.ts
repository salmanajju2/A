'use server';

import { importTransactionsWithAI, type ImportTransactionsWithAIInput, type ImportTransactionsWithAIOutput } from '@/ai/flows/import-transactions';

interface ImportResult {
    success: boolean;
    data?: ImportTransactionsWithAIOutput;
    error?: string;
}

export async function handleImport(input: ImportTransactionsWithAIInput): Promise<ImportResult> {
  try {
    const result = await importTransactionsWithAI(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI Import Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during import.";
    return { success: false, error: errorMessage };
  }
}
