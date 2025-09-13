'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutDashboard, History, Landmark, Menu, Building, PlusCircle, MinusCircle } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { ThemeToggle } from '../shared/theme-toggle';
import { Logo } from '../shared/logo';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

const menuItems = [
  { href: '/dashboard', label: 'Add Cash', icon: PlusCircle },
  { href: '/cash-debit', label: 'Cash Debit', icon: MinusCircle },
  { href: '/history', label: 'History', icon: History },
  { href: '/vault', label: 'Vault', icon: Landmark },
  { href: '/company-summary', label: 'Company Summary', icon: Building },
];

export function Header() {
  const { user } = useAppContext();
  const pathname = usePathname();
  
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

  // We want to hide the header on the company-transactions page
  if (pathname === '/company-transactions') {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Logo />
            <span className="sr-only">Denomination Depot</span>
          </Link>
          {menuItems.map(item => (
              <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                      "transition-colors hover:text-foreground",
                      pathname === item.href ? "text-foreground" : "text-muted-foreground"
                  )}
              >
                  {item.label}
              </Link>
          ))}
        </nav>
        
        <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Logo />
                  <span className="sr-only">Denomination Depot</span>
                </Link>
                {menuItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "hover:text-foreground",
                      pathname === item.href ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
        </Sheet>


      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userAvatar?.imageUrl} alt={user?.name} data-ai-hint={userAvatar?.imageHint} />
                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
