'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { signInWithGoogle } from '@/lib/firebase';
import { useAppContext } from '@/context/app-context';

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAppContext();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        toast({
          title: 'Login Successful',
          description: "Welcome! Redirecting to your dashboard.",
        });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
      setIsLoading(false);
    }
  };
  
  // If in demo mode, show a different message
  if (user && user.uid === 'demouser01') {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">
              You are currently logged in as a Demo User.
            </p>
          </CardContent>
           <CardFooter>
                <Button onClick={() => router.push('/dashboard')} className="w-full">
                    Go to Dashboard
                </Button>
           </CardFooter>
        </Card>
      )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-center text-sm text-muted-foreground">
          Sign in to continue to your account.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C322 113.2 287.3 96 248 96c-88.8 0-160.1 71.1-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
              </svg>
              Sign in with Google
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

    