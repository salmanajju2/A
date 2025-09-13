import { NewCashCreditForm } from "@/components/transactions/new-cash-credit-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewCashCreditPage() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="New Cash Credit"
                description="Add a new cash credit transaction by entering the denomination counts."
            />
            <NewCashCreditForm />
        </div>
    );
}
