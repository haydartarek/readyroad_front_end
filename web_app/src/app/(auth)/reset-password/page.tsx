'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { apiClient } from '@/lib/api';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const [token, setToken]             = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    setToken(t);
  }, [searchParams]);

  // No token in URL
  if (token === null && typeof window !== 'undefined') {
    // still mounting — render nothing to avoid flash
    return null;
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4">
        <div className="w-full max-w-md">
          <Card className="border border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
            <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="w-7 h-7 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">{t('auth.reset_password_invalid_token')}</h2>
              <Button asChild variant="outline">
                <Link href={ROUTES.FORGOT_PASSWORD}>{t('auth.forgot_password_back')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('auth.reset_password_mismatch'));
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string } } })?.response?.data;
      setError(data?.error ?? t('auth.reset_password_invalid_token'));
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
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-3xl flex items-center justify-center shadow-lg shadow-primary/25 rotate-3 transition-transform hover:rotate-0 duration-300">
                <span className="text-4xl font-black text-white tracking-tight">R</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <CardTitle className="text-3xl font-black tracking-tight">
                {t('auth.reset_password_title')}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t('auth.reset_password_desc')}
              </CardDescription>
            </div>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-5 pb-6">
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <CheckCircle className="w-14 h-14 text-green-500" />
                <h3 className="text-lg font-semibold">
                  {t('auth.reset_password_success_title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('auth.reset_password_success_desc')}
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href={ROUTES.LOGIN}>
                  {t('auth.reset_password_go_login')}
                </Link>
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 duration-300 text-sm">
                    ⚠️ {error}
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold">
                    {t('auth.reset_password_new_label')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                    {t('auth.reset_password_confirm_label')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('auth.reset_password_updating') : t('auth.reset_password_submit')}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background" />
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
