'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import Link from 'next/link';
import Image from 'next/image';
import { ROUTES } from '@/lib/constants';
import { apiClient } from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle, KeyRound, ShieldCheck, Smartphone } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail]                     = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [submitted, setSubmitted]             = useState(false);
  const [error, setError]                     = useState('');
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('validation.required'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
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
        // Still show success to avoid email enumeration
        setSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
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
            <div className="text-sm font-semibold uppercase tracking-widest text-white/60">Account recovery</div>
            <h1 className="text-4xl font-black leading-tight">
              Back on track<br /><span className="text-white/80">in seconds.</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-xs">
              No worries — it happens to everyone. We'll send you a secure link to reset your password right away.
            </p>
          </div>
          <div className="space-y-4 pt-2">
            {[
              { icon: Mail,       text: 'Enter your email to receive a reset link' },
              { icon: KeyRound,   text: 'Secure, one-time link — valid for 15 minutes' },
              { icon: ShieldCheck, text: 'Your account stays fully protected' },
              { icon: Smartphone, text: 'Check your inbox or spam folder' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white/85 font-medium">{text}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {['H','A','M','L'].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs font-bold">{l}</div>
              ))}
            </div>
            <p className="text-sm text-white/70"><span className="font-semibold text-white">4,200+</span> learners already on board</p>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-6">
          <p className="text-sm text-white/60 italic">"I passed with 92% — the mock exams felt exactly like the real thing."</p>
          <p className="text-xs text-white/40 mt-1">— Ahmed K., Brussels</p>
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

          {submitted ? (
            /* ── Success state ── */
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {t('auth.forgot_password_success_title')}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                  {t('auth.forgot_password_success_desc')}
                </p>
              </div>
              <Button asChild variant="outline" className="w-full h-11 font-semibold">
                <Link href={ROUTES.LOGIN}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('auth.forgot_password_back')}
                </Link>
              </Button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {t('auth.forgot_password_title')}
                </h2>
                <p className="text-muted-foreground text-sm mt-1.5">
                  {t('auth.forgot_password_desc')}
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {serviceUnavailable && (
                  <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} />
                )}
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 duration-300 text-sm">
                    ⚠️ {error}
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    {t('auth.forgot_password_email_label')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-11 pl-10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.01] transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {t('auth.forgot_password_sending')}
                    </span>
                  ) : t('auth.forgot_password_submit')}
                </Button>

                <Button asChild variant="ghost" className="w-full text-muted-foreground" size="sm">
                  <Link href={ROUTES.LOGIN}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('auth.forgot_password_back')}
                  </Link>
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground mt-8 opacity-50">
            © {new Date().getFullYear()} ReadyRoad. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

