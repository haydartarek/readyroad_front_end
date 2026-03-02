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
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

function validateReturnUrl(returnUrl: string | null): string | undefined {
  if (!returnUrl) return undefined;
  if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
    if (returnUrl === '/login' || returnUrl === '/register') return undefined;
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
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  useEffect(() => {
    try {
      if (sessionStorage.getItem('session_expired')) {
        sessionStorage.removeItem('session_expired');
        toast.warning(t('auth.session_expired'), {
          description: t('auth.session_expired_detail'),
          duration: 6000,
        });
      }
    } catch { /* sessionStorage unavailable */ }
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      const returnUrl = searchParams.get('returnUrl');
      const validatedReturnUrl = validateReturnUrl(returnUrl);
      await login(formData, validatedReturnUrl);
    } catch (err) {
      logApiError('[Login] login', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4">
      <div className="w-full max-w-md">
        <Card className="border border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-3xl flex items-center justify-center shadow-lg shadow-primary/25 rotate-3 transition-transform hover:rotate-0 duration-300">
                  <span className="text-4xl font-black text-white tracking-tight">R</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <CardTitle className="text-3xl font-black tracking-tight">
                {t('auth.login')}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Welcome back to{' '}
                <span className="text-primary font-semibold">ReadyRoad</span> 🚗
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {serviceUnavailable && (
                <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} />
              )}
              {error && (
                <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 duration-300 text-sm">
                  ⚠️ {error}
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold">
                  {t('auth.username')}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username or email"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={isLoading}
                    required
                    className="h-11 pl-10 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    {t('auth.password')}
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline transition-colors"
                  >
                    {t('auth.forgot_password')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isLoading}
                    required
                    className="h-11 pl-10 pr-10 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.01]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.sign_in')
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                {t('auth.no_account')}{' '}
                <Link
                  href={ROUTES.REGISTER}
                  className="text-primary font-semibold hover:underline transition-colors"
                >
                  {t('auth.sign_up')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">
          © {new Date().getFullYear()} ReadyRoad. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-3xl flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-4xl font-black text-white">R</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
