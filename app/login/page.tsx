'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileText, Mail, Lock, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

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
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-lg
                    bg-muted/50 border transition-all
                    focus:bg-surface focus-ring
                    ${errors.email ? 'border-destructive' : 'border-transparent focus:border-border-strong'}
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-lg
                    bg-muted/50 border transition-all
                    focus:bg-surface focus-ring
                    ${errors.password ? 'border-destructive' : 'border-transparent focus:border-border-strong'}
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.password.message}</span>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-2.5 px-4 rounded-lg
                bg-accent hover:bg-accent-hover
                text-accent-foreground font-medium
                transition-all duration-200
                focus-ring
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-accent/25
              "
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground text-center">
              Demo: Use your registered email and password
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>© 2026 DocVault. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
