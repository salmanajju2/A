'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
import { LogOut, LayoutDashboard, History, Landmark } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { ThemeToggle } from '../shared/theme-toggle';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/history', label: 'History', icon: History },
  { href: '/vault', label: 'Vault', icon: Landmark },
];

export function Header() {
  const { logout, user } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <SidebarTrigger className={cn('md:hidden', !isMobile && 'hidden')} />
        <div className="flex-1">
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
                {menuItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "text-muted-foreground transition-colors hover:text-foreground",
                            pathname === item.href && "text-foreground"
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </div>

      <div className="flex items-center gap-4">
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
