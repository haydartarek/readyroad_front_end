'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { toast } from 'sonner';

/**
 * Validates and sanitizes returnUrl to prevent open redirects
 * Only allows internal paths starting with /
 */
function validateReturnUrl(returnUrl: string | null): string | undefined {
  if (!returnUrl) return undefined;

  // Security: Only allow paths starting with / and not //
  // This prevents redirects to external domains
  if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
    // Additional security: prevent redirecting to auth pages
    if (returnUrl === '/login' || returnUrl === '/register') {
      return undefined;
    }
    return returnUrl;
  }

  return undefined;
}

function LoginForm() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // Show session-expired toast (translated) if redirected due to expired token
  useEffect(() => {
    try {
      if (sessionStorage.getItem('session_expired')) {
        sessionStorage.removeItem('session_expired');
        toast.warning(t('auth.session_expired'), {
          description: t('auth.session_expired_detail'),
          duration: 6000,
        });
      }
    } catch { /* sessionStorage unavailable — ignore */ }
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);

      // Get and validate returnUrl from query params
      const returnUrl = searchParams.get('returnUrl');
      const validatedReturnUrl = validateReturnUrl(returnUrl);

      await login(formData, validatedReturnUrl);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-3xl font-bold text-white">R</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          {t('auth.login')}
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 duration-300">
              {error}
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-semibold text-foreground">
              {t('auth.username')}
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username or email"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isLoading}
              required
              className="h-11 text-base transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                {t('auth.password')}
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline transition-colors"
              >
                {t('auth.forgot_password')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
              required
              className="h-11 text-base transition-all duration-200"
            />
          </div>
        </CardContent>

        <CardFooter className="flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('auth.sign_in')}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            {t('auth.no_account')}{' '}
            <Link
              href={ROUTES.REGISTER}
              className="text-primary font-semibold hover:underline"
            >
              {t('auth.sign_up')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="border-2">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-bold text-white">R</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Loading...
          </CardTitle>
        </CardHeader>
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}
