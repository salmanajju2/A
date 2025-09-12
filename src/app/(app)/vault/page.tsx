import { VaultEditor } from "@/components/vault/vault-editor";
import { PageHeader } from "@/components/shared/page-header";

export default function VaultPage() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Denomination Vault"
                description="Manually adjust your cash and UPI balances. Use with caution."
            />
            <VaultEditor />
        </div>
    );
}
