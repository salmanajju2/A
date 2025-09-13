'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { menuItems } from './menu-items';

export function MobileBottomNav() {
  const pathname = usePathname();
  
  // Hide on company-transactions page
  if (pathname === '/company-transactions') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background md:hidden">
      <div className="grid h-full grid-cols-5 mx-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-2 text-muted-foreground hover:bg-muted hover:text-foreground',
                isActive && 'text-primary'
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] text-center leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
