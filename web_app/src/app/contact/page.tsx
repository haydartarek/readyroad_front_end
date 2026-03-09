'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData   { firstName: string; lastName: string; email: string; subject: string; message: string; }
interface FormErrors { firstName?: string; lastName?: string; email?: string; subject?: string; message?: string; }

// ─── Page ────────────────────────────────────────────────

export default function ContactPage() {
  const { t, isRTL } = useLanguage();

  const [form, setForm]         = useState<FormData>({ firstName: '', lastName: '', email: '', subject: '', message: '' });
  const [errors, setErrors]     = useState<FormErrors>({});
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiError, setApiError] = useState('');

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = t('contact.required');
    if (!form.lastName.trim())  e.lastName  = t('contact.required');
    if (!form.email.trim())     e.email     = t('contact.required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('contact.invalidEmail');
    if (!form.subject.trim())   e.subject   = t('contact.required');
    if (!form.message.trim())   e.message   = t('contact.required');
    else if (form.message.trim().length < 20) e.message = t('contact.minMessage');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    setApiError('');
    try {
      const res  = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setStatus('success');
      setForm({ firstName: '', lastName: '', email: '', subject: '', message: '' });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to send message.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-12 max-w-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{t('contact.title')}</h1>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground leading-relaxed">{t('contact.subtitle')}</p>
        </div>

        {/* Form */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* First + Last name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('contact.firstName')} required error={errors.firstName} isRTL={isRTL}>
                  <input type="text" value={form.firstName} onChange={e => handleChange('firstName', e.target.value)}
                    placeholder={t('contact.placeholderFirst')} className={inputCls(!!errors.firstName)} maxLength={60} />
                </Field>
                <Field label={t('contact.lastName')} required error={errors.lastName} isRTL={isRTL}>
                  <input type="text" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)}
                    placeholder={t('contact.placeholderLast')} className={inputCls(!!errors.lastName)} maxLength={60} />
                </Field>
              </div>

              {/* Email */}
              <Field label={t('contact.email')} required error={errors.email} isRTL={isRTL}>
                <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                  placeholder={t('contact.placeholderEmail')} className={inputCls(!!errors.email)} maxLength={120} autoComplete="email" />
              </Field>

              {/* Subject */}
              <Field label={t('contact.subject')} required error={errors.subject} isRTL={isRTL}>
                <input type="text" value={form.subject} onChange={e => handleChange('subject', e.target.value)}
                  placeholder={t('contact.placeholderSubject')} className={inputCls(!!errors.subject)} maxLength={120} />
              </Field>

              {/* Message */}
              <Field label={t('contact.message')} required error={errors.message} isRTL={isRTL}>
                <textarea value={form.message} onChange={e => handleChange('message', e.target.value)}
                  placeholder={t('contact.placeholderMsg')} rows={5}
                  className={cn(inputCls(!!errors.message), 'resize-y min-h-[120px]')} maxLength={2000} />
                <p className="mt-1 text-end text-xs text-muted-foreground">{form.message.length}/2000</p>
              </Field>

              {/* Submit */}
              <Button type="submit" disabled={status === 'loading'} className="w-full h-12 rounded-xl text-base font-bold">
                {status === 'loading'
                  ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t('contact.sending')}</>
                  : <><Send    className="me-2 h-4 w-4" />{t('contact.send')}</>
                }
              </Button>

              {/* Success banner */}
              {status === 'success' && (
                <div style={{ background: '#dcfce7', border: '2px solid #16a34a', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <CheckCircle2 style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px', width: '24px', height: '24px' }} />
                  <div>
                    <p style={{ color: '#14532d', fontWeight: 800, fontSize: '16px', margin: 0 }}>{t('contact.successTitle')}</p>
                    <p style={{ color: '#166534', fontWeight: 500, fontSize: '14px', margin: '4px 0 0' }}>{t('contact.successMsg')}</p>
                  </div>
                </div>
              )}

              {/* Error banner */}
              {status === 'error' && (
                <div style={{ background: '#fee2e2', border: '2px solid #dc2626', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertCircle style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px', width: '24px', height: '24px' }} />
                  <div>
                    <p style={{ color: '#7f1d1d', fontWeight: 800, fontSize: '16px', margin: 0 }}>{t('contact.errorTitle')}</p>
                    <p style={{ color: '#991b1b', fontWeight: 500, fontSize: '14px', margin: '4px 0 0' }}>{apiError}</p>
                  </div>
                </div>
              )}

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────

function Field({ label, required, error, isRTL, children }: {
  label: string; required?: boolean; error?: string; isRTL: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className={cn('block text-sm font-semibold text-foreground', isRTL && 'text-right')}>
        {label}{required && <span className="ms-1 text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <p className={cn('flex items-center gap-1 text-xs text-destructive', isRTL && 'flex-row-reverse')}>
          <AlertCircle className="h-3 w-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-xl border px-4 py-2.5 text-sm bg-background text-foreground',
    'placeholder:text-muted-foreground/60 transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring',
    hasError ? 'border-destructive focus:ring-destructive/30' : 'border-border hover:border-muted-foreground/40',
  );
}
