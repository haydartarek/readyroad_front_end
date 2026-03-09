'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import Link from 'next/link';
import Image from 'next/image';
import { ROUTES } from '@/lib/constants';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Lock, KeyRound, BookOpen, BarChart3, ShieldCheck, Trophy, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen flex">

      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-orange-600 p-12 text-white">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-black/10" />

        <div className="relative z-10 flex items-center gap-3">
          <Image src="/images/logo.png" alt="ReadyRoad Logo" width={64} height={64} className="rounded-2xl" priority />
          <span className="text-2xl font-black tracking-tight text-white">ReadyRoad</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-widest text-white/60">{t('auth.login_panel_badge')}</div>
            <h1 className="text-4xl font-black leading-tight">
              {t('auth.login_panel_heading')}<br /><span className="text-white/80">{t('auth.login_panel_heading2')}</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-xs">
              {t('auth.login_panel_subtitle')}
            </p>
          </div>
          <div className="space-y-4 pt-2">
            {[
              { icon: BookOpen,    k: 'auth.login_feat_1' },
              { icon: BarChart3,   k: 'auth.login_feat_2' },
              { icon: Trophy,      k: 'auth.login_feat_3' },
              { icon: ShieldCheck, k: 'auth.login_feat_4' },
            ].map(({ icon: Icon, k }) => (
              <div key={k} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white/85 font-medium">{t(k)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {['H','A','M','L'].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs font-bold">{l}</div>
              ))}
            </div>
            <p className="text-sm text-white/70"><span className="font-semibold text-white">4,200+</span> {t('auth.panel_learners_text')}</p>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-6">
          <p className="text-sm text-white/60 italic">&ldquo;{t('auth.panel_quote_text')}&rdquo;</p>
          <p className="text-xs text-white/40 mt-1">{t('auth.panel_quote_author')}</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10 overflow-y-auto">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <Image src="/images/logo.png" alt="ReadyRoad Logo" width={48} height={48} className="rounded-xl" priority />
          <span className="text-xl font-black tracking-tight">ReadyRoad</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              {t('auth.login')}
            </h2>
            <p className="text-muted-foreground text-sm mt-2 flex items-center gap-1.5">
              <span className="inline-block w-6 h-0.5 rounded-full bg-primary/60" />
              {t('auth.login_form_subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {serviceUnavailable && (
              <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} />
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-semibold">{t('auth.username')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={isLoading}
                  required
                  className="h-11 pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">{t('auth.password')}</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  required
                  className="h-11 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error card — shown below password, above submit */}
            {error && (
              <div className="animate-in fade-in-50 slide-in-from-top-2 duration-300 rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden">
                {/* Error message row */}
                <div className="flex items-start gap-3 px-4 py-3">
                  <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive font-medium leading-snug">{error}</p>
                </div>
                {/* Sign-up suggestion row */}
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-destructive/15 bg-background/60">
                  <p className="text-xs text-muted-foreground">{t('auth.no_account')}</p>
                  <Link
                    href="/register"
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    {t('auth.sign_up')} &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.01] transition-all duration-200 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t('common.loading')}
                </span>
              ) : t('auth.sign_in')}
            </Button>

            <div className="flex items-center justify-center gap-1.5 py-0.5">
              <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors hover:underline underline-offset-4"
              >
                {t('auth.forgot_password')}
              </Link>
            </div>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">{t('auth.or')}</span>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              {t('auth.no_account')}{' '}
              <Link href={ROUTES.REGISTER} className="text-primary font-semibold hover:underline transition-colors">
                {t('auth.sign_up')}
              </Link>
            </p>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8 opacity-50">
            © {new Date().getFullYear()} ReadyRoad. {t('auth.copyright')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="ReadyRoad Logo" width={48} height={48} className="rounded-xl animate-pulse" />
          <span className="text-xl font-black tracking-tight">ReadyRoad</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

