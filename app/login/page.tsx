'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileText, Mail, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/utils/zodResolver';
import { z } from 'zod';
import { loginSchema } from '@/lib/constants/schemas';
import { Input, Button } from '@/components/ui';

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid credentials', {
          description: 'Please check your email and password',
        });
      } else {
        toast.success('Welcome back!');
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      toast.error('Something went wrong', {
        description: 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 fade-in">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-hover shadow-lg mb-4">
            <FileText className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">
            DocVault
          </h1>
          <p className="text-muted-foreground">
            Secure document management for your team
          </p>
        </div>

        {/* Login card */}
        <div className="bg-surface border border-border rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to access your documents
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email field */}
            <Input
              {...register('email')}
              id="email"
              type="email"
              label="Email"
              icon={Mail}
              placeholder="name@company.com"
              error={errors.email?.message}
            />

            {/* Password field */}
            <Input
              {...register('password')}
              id="password"
              type="password"
              label="Password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password?.message}
            />

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </form>

          {/* Test credentials */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Test Credentials:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Admin:</strong> admin@example.com / password123</p>
              <p><strong>User:</strong> user@example.com / password123</p>
            </div>
          </div>

          {/* Signup link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-accent hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
