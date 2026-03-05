'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { FileText, Mail, Lock, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button } from '@/components/ui';
import { signIn } from 'next-auth/react';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);

    try {
      // Create account
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (!signupRes.ok) {
        const error = await signupRes.json();
        throw new Error(error.error || 'Signup failed');
      }

      const { data: responseData } = await signupRes.json();

      toast.success('Account created!', {
        description: 'You can now log in with your credentials',
      });

      // Auto-login
      const loginResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (loginResult?.error) {
        router.push('/login');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      toast.error('Signup failed', {
        description: error.message || 'Please try again',
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
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">DocVault</h1>
          <p className="text-muted-foreground">Create your secure account</p>
        </div>

        {/* Signup card */}
        <div className="bg-surface border border-border rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold mb-1">Sign up</h2>
            <p className="text-sm text-muted-foreground">Join to start managing your documents securely</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name field */}
            <Input
              {...register('name')}
              id="name"
              type="text"
              label="Full Name"
              icon={User}
              placeholder="John Doe"
              error={errors.name?.message}
            />

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

            {/* Confirm Password field */}
            <Input
              {...register('confirmPassword')}
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
            />

            {/* Submit button */}
            <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
              Create Account
            </Button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-accent hover:underline">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
