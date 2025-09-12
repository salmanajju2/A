'use server';

/**
 * @fileOverview This file defines a Genkit flow for importing transaction data using AI.
 *
 * - importTransactionsWithAI - A function that handles the transaction data import process.
 * - ImportTransactionsWithAIInput - The input type for the importTransactionsWithAI function.
 * - ImportTransactionsWithAIOutput - The return type for the importTransactionsWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImportTransactionsWithAIInputSchema = z.object({
  fileData: z
    .string()
    .describe(
      "Transaction data in various formats (e.g., CSV, bank statements) as a string."
    ),
});
export type ImportTransactionsWithAIInput = z.infer<typeof ImportTransactionsWithAIInputSchema>;

const TransactionSchema = z.object({
  type: z.string().describe('The type of transaction (e.g., CASH_CREDIT, UPI_DEBIT).'),
  amount: z.number().describe('The transaction amount.'),
  accountId: z.string().optional().describe('The associated account ID.'),
  atmId: z.string().optional().describe('The ATM ID, if applicable.'),
  partnerBankUTR: z.string().optional().describe('The Partner Bank UTR, if applicable.'),
  customerName: z.string().optional().describe('The customer name, if applicable.'),
  timestamp: z.string().describe('The timestamp of the transaction (ISO format).'),
  recordedBy: z.string().describe('The user who recorded the transaction.'),
  id: z.string().describe('The unique transaction ID.'),
  denominations: z.record(z.number()).optional().describe('Denomination breakdown (if cash transaction).'),
  upiTransactionId: z.string().optional().describe('The UPI transaction ID, if applicable.'),
});

const ImportTransactionsWithAIOutputSchema = z.array(TransactionSchema).describe("Parsed transaction data.");
export type ImportTransactionsWithAIOutput = z.infer<typeof ImportTransactionsWithAIOutputSchema>;

export async function importTransactionsWithAI(input: ImportTransactionsWithAIInput): Promise<ImportTransactionsWithAIOutput> {
  return importTransactionsWithAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'importTransactionsWithAIPrompt',
  input: {schema: ImportTransactionsWithAIInputSchema},
  output: {schema: ImportTransactionsWithAIOutputSchema},
  prompt: `You are an expert financial data parser.

You will receive transaction data in various formats such as CSV or unstructured bank statements.
Your goal is to intelligently parse this data and convert it into a standardized JSON format.

Here's the format you must output:

${JSON.stringify(TransactionSchema.describe, null, 2)}

Ensure that all fields are correctly identified and mapped to the appropriate fields in the JSON schema.
If a field cannot be determined, use a null value.

Transaction Data:\n{{{fileData}}}`,
});

const importTransactionsWithAIFlow = ai.defineFlow(
  {
    name: 'importTransactionsWithAIFlow',
    inputSchema: ImportTransactionsWithAIInputSchema,
    outputSchema: ImportTransactionsWithAIOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
