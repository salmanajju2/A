import { ReactNode } from "react";

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">{title}</h1>
                {description && <p className="text-muted-foreground mt-1">{description}</p>}
            </div>
            {children && <div className="flex-shrink-0">{children}</div>}
        </div>
    );
}
