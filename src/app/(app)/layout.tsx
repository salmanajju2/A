'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isInitialized } = useAppContext();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.replace('/login');
      } else {
        setIsVerified(true);
      }
    }
  }, [user, isInitialized, router]);

  if (!isVerified) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
          {children}
        </main>
        <Toaster />
    </div>
  );
}
