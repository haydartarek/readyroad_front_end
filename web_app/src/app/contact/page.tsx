'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── i18n ────────────────────────────────────────────────

const LABELS = {
  en: {
    title:              'Contact Us',
    subtitle:           'Have a question, problem, or feedback? Fill in the form and we will get back to you within 24 hours.',
    firstName:          'First Name',
    lastName:           'Last Name',
    email:              'Email Address',
    subject:            'Subject',
    message:            'Message',
    send:               'Send Message',
    sending:            'Sending…',
    successTitle:       'Message sent!',
    successMsg:         'Thank you for reaching out. We will reply to your email within 24 hours.',
    errorTitle:         'Failed to send',
    required:           'This field is required.',
    invalidEmail:       'Please enter a valid email address.',
    minMessage:         'Message must be at least 20 characters.',
    placeholderFirst:   'John',
    placeholderLast:    'Doe',
    placeholderEmail:   'john@example.com',
    placeholderSubject: 'e.g. I cannot log in to my account',
    placeholderMsg:     'Describe your issue or question in detail…',
    direct:             'Or reach us directly',
  },
  nl: {
    title:              'Contacteer Ons',
    subtitle:           'Heeft u een vraag, probleem of feedback? Vul het formulier in en we nemen binnen 24 uur contact met u op.',
    firstName:          'Voornaam',
    lastName:           'Achternaam',
    email:              'E-mailadres',
    subject:            'Onderwerp',
    message:            'Bericht',
    send:               'Stuur Bericht',
    sending:            'Versturen…',
    successTitle:       'Bericht verzonden!',
    successMsg:         'Bedankt voor uw bericht. We sturen binnen 24 uur een antwoord naar uw e-mail.',
    errorTitle:         'Verzenden mislukt',
    required:           'Dit veld is verplicht.',
    invalidEmail:       'Voer een geldig e-mailadres in.',
    minMessage:         'Het bericht moet minimaal 20 tekens bevatten.',
    placeholderFirst:   'Jan',
    placeholderLast:    'Janssen',
    placeholderEmail:   'jan@voorbeeld.com',
    placeholderSubject: 'bijv. Ik kan niet inloggen op mijn account',
    placeholderMsg:     'Beschrijf uw probleem of vraag in detail…',
    direct:             'Of neem direct contact op',
  },
  fr: {
    title:              'Contactez-Nous',
    subtitle:           'Vous avez une question, un problème ou un retour ? Remplissez le formulaire et nous vous répondrons dans les 24 heures.',
    firstName:          'Prénom',
    lastName:           'Nom de famille',
    email:              'Adresse e-mail',
    subject:            'Sujet',
    message:            'Message',
    send:               'Envoyer le message',
    sending:            'Envoi en cours…',
    successTitle:       'Message envoyé !',
    successMsg:         "Merci de nous avoir contactés. Nous vous répondrons par e-mail dans les 24 heures.",
    errorTitle:         "Échec de l'envoi",
    required:           'Ce champ est obligatoire.',
    invalidEmail:       'Veuillez saisir une adresse e-mail valide.',
    minMessage:         'Le message doit contenir au moins 20 caractères.',
    placeholderFirst:   'Jean',
    placeholderLast:    'Dupont',
    placeholderEmail:   'jean@exemple.com',
    placeholderSubject: 'ex. Je ne peux pas me connecter à mon compte',
    placeholderMsg:     'Décrivez votre problème ou question en détail…',
    direct:             'Ou contactez-nous directement',
  },
  ar: {
    title:              'تواصل معنا',
    subtitle:           'هل لديك سؤال أو مشكلة أو ملاحظة؟ املأ النموذج وسنرد عليك خلال 24 ساعة.',
    firstName:          'الاسم الأول',
    lastName:           'اسم العائلة',
    email:              'البريد الإلكتروني',
    subject:            'موضوع الرسالة',
    message:            'الرسالة',
    send:               'إرسال الرسالة',
    sending:            'جارٍ الإرسال…',
    successTitle:       'تم إرسال الرسالة!',
    successMsg:         'شكراً لتواصلك معنا. سنرد على بريدك الإلكتروني خلال 24 ساعة.',
    errorTitle:         'فشل الإرسال',
    required:           'هذا الحقل مطلوب.',
    invalidEmail:       'الرجاء إدخال عنوان بريد إلكتروني صالح.',
    minMessage:         'يجب أن تحتوي الرسالة على 20 حرفاً على الأقل.',
    placeholderFirst:   'محمد',
    placeholderLast:    'أحمد',
    placeholderEmail:   'example@mail.com',
    placeholderSubject: 'مثال: لا أستطيع تسجيل الدخول إلى حسابي',
    placeholderMsg:     'صف مشكلتك أو سؤالك بالتفصيل…',
    direct:             'أو تواصل معنا مباشرةً',
  },
} as const;

type Lang = keyof typeof LABELS;

interface FormData   { firstName: string; lastName: string; email: string; subject: string; message: string; }
interface FormErrors { firstName?: string; lastName?: string; email?: string; subject?: string; message?: string; }

// ─── Page ────────────────────────────────────────────────

export default function ContactPage() {
  const { language, isRTL } = useLanguage();
  const lbl = LABELS[(language as Lang)] ?? LABELS.en;

  const [form, setForm]       = useState<FormData>({ firstName: '', lastName: '', email: '', subject: '', message: '' });
  const [errors, setErrors]   = useState<FormErrors>({});
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiError, setApiError] = useState('');

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = lbl.required;
    if (!form.lastName.trim())  e.lastName  = lbl.required;
    if (!form.email.trim())     e.email     = lbl.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = lbl.invalidEmail;
    if (!form.subject.trim())   e.subject   = lbl.required;
    if (!form.message.trim())   e.message   = lbl.required;
    else if (form.message.trim().length < 20) e.message = lbl.minMessage;
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
          <h1 className="text-3xl font-black tracking-tight text-foreground">{lbl.title}</h1>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground leading-relaxed">{lbl.subtitle}</p>
        </div>

        {/* Form */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* First + Last name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={lbl.firstName} required error={errors.firstName} isRTL={isRTL}>
                  <input type="text" value={form.firstName} onChange={e => handleChange('firstName', e.target.value)}
                    placeholder={lbl.placeholderFirst} className={inputCls(!!errors.firstName)} maxLength={60} />
                </Field>
                <Field label={lbl.lastName} required error={errors.lastName} isRTL={isRTL}>
                  <input type="text" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)}
                    placeholder={lbl.placeholderLast} className={inputCls(!!errors.lastName)} maxLength={60} />
                </Field>
              </div>

              {/* Email */}
              <Field label={lbl.email} required error={errors.email} isRTL={isRTL}>
                <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                  placeholder={lbl.placeholderEmail} className={inputCls(!!errors.email)} maxLength={120} autoComplete="email" />
              </Field>

              {/* Subject */}
              <Field label={lbl.subject} required error={errors.subject} isRTL={isRTL}>
                <input type="text" value={form.subject} onChange={e => handleChange('subject', e.target.value)}
                  placeholder={lbl.placeholderSubject} className={inputCls(!!errors.subject)} maxLength={120} />
              </Field>

              {/* Message */}
              <Field label={lbl.message} required error={errors.message} isRTL={isRTL}>
                <textarea value={form.message} onChange={e => handleChange('message', e.target.value)}
                  placeholder={lbl.placeholderMsg} rows={5}
                  className={cn(inputCls(!!errors.message), 'resize-y min-h-[120px]')} maxLength={2000} />
                <p className="mt-1 text-end text-xs text-muted-foreground">{form.message.length}/2000</p>
              </Field>

              {/* Submit */}
              <Button type="submit" disabled={status === 'loading'} className="w-full h-12 rounded-xl text-base font-bold">
                {status === 'loading'
                  ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{lbl.sending}</>
                  : <><Send    className="me-2 h-4 w-4" />{lbl.send}</>
                }
              </Button>

              {/* Success banner */}
              {status === 'success' && (
                <div style={{ background: '#dcfce7', border: '2px solid #16a34a', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <CheckCircle2 style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px', width: '24px', height: '24px' }} />
                  <div>
                    <p style={{ color: '#14532d', fontWeight: 800, fontSize: '16px', margin: 0 }}>{lbl.successTitle}</p>
                    <p style={{ color: '#166534', fontWeight: 500, fontSize: '14px', margin: '4px 0 0' }}>{lbl.successMsg}</p>
                  </div>
                </div>
              )}

              {/* Error banner */}
              {status === 'error' && (
                <div style={{ background: '#fee2e2', border: '2px solid #dc2626', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertCircle style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px', width: '24px', height: '24px' }} />
                  <div>
                    <p style={{ color: '#7f1d1d', fontWeight: 800, fontSize: '16px', margin: 0 }}>{lbl.errorTitle}</p>
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
