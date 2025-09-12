'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect runs only on the client
    const user = localStorage.getItem('denomination-depot-user');
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
    // A small timeout to prevent flash of loading screen on fast redirects
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Denomination Depot...</p>
    </div>
  );
}
