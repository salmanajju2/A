'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/login');
    }
  }, [user, isInitialized, router]);

  if (!isInitialized || !user) {
    // You can show a loading spinner here
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <div>Loading...</div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col p-4 pb-20 md:p-6 lg:p-8">
          {children}
        </main>
        <MobileBottomNav />
        <Toaster />
    </div>
  );
}
