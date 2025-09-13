'use client';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/shared/logo';
import { useAppContext } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, isInitialized } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/dashboard');
    }
  }, [user, isInitialized, router]);

  if (isInitialized && user) {
    return null; // Or a loading indicator
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
            <Logo className="mx-auto"/>
            <h1 className="text-2xl font-semibold tracking-tight font-headline">
              Welcome to ALI ENTERPRISES
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in with Google to access your account.
            </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
