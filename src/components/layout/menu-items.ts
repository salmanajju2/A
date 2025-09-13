import { Building, History, Landmark, MinusCircle, PlusCircle } from "lucide-react";

export const menuItems = [
  { href: '/dashboard', label: 'Add Cash', icon: PlusCircle },
  { href: '/cash-debit', label: 'Cash Debit', icon: MinusCircle },
  { href: '/history', label: 'History', icon: History },
  { href: '/vault', label: 'Vault', icon: Landmark },
  { href: '/company-summary', label: 'Company Summary', icon: Building },
];
