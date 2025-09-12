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
import { LogOut, User as UserIcon, ChevronsLeft, ChevronsRight, Home } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { ThemeToggle } from '../shared/theme-toggle';

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
  
  const breadcrumbs = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <SidebarTrigger className={cn('md:hidden', !isMobile && 'hidden')} />
        <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground"><Home className="h-4 w-4" /></Link>
                {breadcrumbs.map((crumb, index) => {
                    const href = '/' + breadcrumbs.slice(0, index + 1).join('/');
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                        <React.Fragment key={href}>
                            <span className="text-muted-foreground/50">/</span>
                            <Link
                                href={href}
                                className={cn(
                                    "capitalize",
                                    isLast ? "text-foreground font-medium" : "hover:text-foreground"
                                )}
                            >
                                {crumb.replace('-', ' ')}
                            </Link>
                        </React.Fragment>
                    );
                })}
            </div>
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
