'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  KeyRound,
  Mail,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { ROUTES } from '@/lib/constants';
import { apiClient } from '@/lib/api';
import { AuthPageFrame } from '@/components/auth/auth-page-frame';
import { AuthShowcasePanel } from '@/components/auth/auth-showcase-panel';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('auth.validation.email_required'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('auth.forgot_email_invalid'));
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        setServiceUnavailable(true);
      } else {
        setSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageFrame
      showcase={
        <AuthShowcasePanel
          badge={t('auth.forgot_panel_badge')}
          title={t('auth.forgot_panel_heading')}
          titleAccent={t('auth.forgot_panel_heading2')}
          description={t('auth.forgot_panel_subtitle')}
          supportingText={t('auth.panel_learners_text')}
          features={[
            { icon: Mail, label: t('auth.forgot_feat_1') },
            { icon: KeyRound, label: t('auth.forgot_feat_2') },
            { icon: ShieldCheck, label: t('auth.forgot_feat_3') },
            { icon: Smartphone, label: t('auth.forgot_feat_4') },
          ]}
        />
      }
      title={
        submitted ? t('auth.forgot_password_success_title') : t('auth.forgot_password_title')
      }
      subtitle={
        submitted ? t('auth.forgot_password_success_desc') : t('auth.forgot_password_desc')
      }
      maxWidthClassName="max-w-md"
      footer={
        <p className="text-center text-xs text-muted-foreground/80">
          © {new Date().getFullYear()} {t('app.name')}. {t('auth.copyright')}
        </p>
      }
    >
      {submitted ? (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-green-200/60 bg-green-50/60 px-4 py-3 text-left text-sm text-muted-foreground">
            {t('auth.forgot_password_success_desc')}
          </div>

          <Button asChild variant="outline" className="h-12 w-full rounded-2xl font-semibold">
            <Link href={ROUTES.LOGIN}>
              <ArrowLeft
                className={cn(
                  "h-4 w-4",
                  isRTL ? "ml-2 rotate-180" : "mr-2",
                )}
              />
              {t('auth.forgot_password_back')}
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {serviceUnavailable && (
            <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} />
          )}

          {error && (
            <Alert
              variant="destructive"
              className="rounded-2xl border-destructive/20 bg-destructive/5 text-sm"
            >
              {error}
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">
              {t('auth.forgot_password_email_label')}
            </Label>
            <div className="relative">
              <Mail
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                  isRTL ? "right-3" : "left-3",
                )}
              />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "h-12 rounded-2xl border-border/60 shadow-sm",
                  isRTL ? "pr-10" : "pl-10",
                )}
                disabled={isLoading}
                required
              />
            </div>
          </div>

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
                {t('auth.forgot_password_sending')}
              </span>
            ) : (
              t('auth.forgot_password_submit')
            )}
          </Button>

          <Button asChild variant="ghost" className="h-11 w-full rounded-2xl text-muted-foreground">
            <Link href={ROUTES.LOGIN}>
              <ArrowLeft
                className={cn(
                  "h-4 w-4",
                  isRTL ? "ml-2 rotate-180" : "mr-2",
                )}
              />
              {t('auth.forgot_password_back')}
            </Link>
          </Button>
        </form>
      )}
    </AuthPageFrame>
  );
}
