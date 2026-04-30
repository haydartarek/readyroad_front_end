'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { ROUTES } from '@/lib/constants';
import { AuthPageFrame } from '@/components/auth/auth-page-frame';
import { AuthShowcasePanel } from '@/components/auth/auth-showcase-panel';
import { cn } from '@/lib/utils';
import { getSocialAuthErrorMessage } from '@/lib/social-auth-feedback';

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
  const { t, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const socialAuthError = searchParams.get('authError');
  const socialAuthMessage = getSocialAuthErrorMessage(t, socialAuthError);
  const showServiceUnavailable = serviceUnavailable || socialAuthError === 'unavailable';
  const displayedError = error || socialAuthMessage;

  useEffect(() => {
    try {
      if (sessionStorage.getItem('session_expired')) {
        sessionStorage.removeItem('session_expired');
        toast.warning(t('auth.session_expired'), {
          description: t('auth.session_expired_detail'),
          duration: 6000,
        });
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError(t('auth.login_fill_all_fields'));
      return;
    }

    setIsLoading(true);
    const returnUrl = searchParams.get('returnUrl');
    const validatedReturnUrl = validateReturnUrl(returnUrl);
    const result = await login(formData, validatedReturnUrl);
    setIsLoading(false);

    if (!result.success) {
      if (result.status === 503) {
        setServiceUnavailable(true);
      } else {
        setError(result.message ?? t('auth.login_failed'));
      }
    }
  };

  return (
    <AuthPageFrame
      showcase={
        <AuthShowcasePanel
          badge={t('auth.login_panel_badge')}
          title={t('auth.login_panel_heading')}
          titleAccent={t('auth.login_panel_heading2')}
          description={t('auth.login_panel_subtitle')}
          supportingText={t('auth.panel_learners_text')}
          features={[
            { icon: BookOpen, label: t('auth.login_feat_1') },
            { icon: BarChart3, label: t('auth.login_feat_2') },
            { icon: Trophy, label: t('auth.login_feat_3') },
            { icon: ShieldCheck, label: t('auth.login_feat_4') },
          ]}
        />
      }
      title={t('auth.login')}
      subtitle={t('auth.login_form_subtitle')}
      maxWidthClassName="max-w-md"
      footer={
        <p className="text-center text-xs text-muted-foreground/80">
          © {new Date().getFullYear()} {t('app.name')}. {t('auth.copyright')}
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {showServiceUnavailable && (
          <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} />
        )}

        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-semibold">
            {t('auth.username')}
          </Label>
          <div className="relative">
            <User
              className={cn(
                "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                isRTL ? "right-3" : "left-3",
              )}
            />
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isLoading}
              required
              className={cn(
                "h-12 rounded-2xl border-border/60 shadow-sm",
                isRTL ? "pr-10" : "pl-10",
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold">
            {t('auth.password')}
          </Label>
          <div className="relative">
            <Lock
              className={cn(
                "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                isRTL ? "right-3" : "left-3",
              )}
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
              required
              className={cn(
                "h-12 rounded-2xl border-border/60 shadow-sm",
                isRTL ? "pl-11 pr-10" : "pl-10 pr-11",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground",
                isRTL ? "left-3" : "right-3",
              )}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {displayedError && (
          <div className="overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/5 shadow-sm">
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-destructive">{displayedError}</p>
                <p className="text-xs text-muted-foreground">{t('auth.no_account')}</p>
              </div>
            </div>
            <div className="border-t border-destructive/10 bg-background/80 px-4 py-2.5">
              <Link
                href={ROUTES.REGISTER}
                className="text-xs font-semibold text-primary transition-colors hover:text-primary/80"
              >
                {t('auth.sign_up')} →
              </Link>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {t('common.loading')}
            </span>
          ) : (
            t('auth.sign_in')
          )}
        </Button>

        <div className="flex items-center justify-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary hover:underline"
          >
            {t('auth.forgot_password')}
          </Link>
        </div>

        <GoogleAuthButton
          mode="login"
          label={t('auth.continue_with_google')}
        />

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3.5 text-sm font-semibold text-foreground/80">{t('auth.or')}</span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.no_account')}{' '}
          <Link
            href={ROUTES.REGISTER}
            className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            {t('auth.sign_up')}
          </Link>
        </p>
      </form>
    </AuthPageFrame>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
