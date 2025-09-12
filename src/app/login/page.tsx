import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/shared/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
            <Logo className="mx-auto"/>
            <h1 className="text-2xl font-semibold tracking-tight font-headline">
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your depot.
            </p>
        </div>
        <LoginForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          Use <code className="bg-muted px-1.5 py-0.5 rounded">user@example.com</code> and any password to continue.
        </p>
      </div>
    </main>
  );
}
