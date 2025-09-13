import { NewCashDebitForm } from "@/components/transactions/new-cash-debit-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewCashDebitPage() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="New Cash Debit"
                description="Add a new cash debit transaction by entering the denomination counts."
            />
            <NewCashDebitForm />
        </div>
    );
}
