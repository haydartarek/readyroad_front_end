'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';
import { ROUTES } from '@/lib/constants';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Mail, Lock, BadgeCheck, CheckCircle2, BookOpen, BarChart3, ShieldCheck } from 'lucide-react';

// ─── Validation regexes ───────────────────────────────────────────────────────
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE     = /^[a-zA-Z\u00C0-\u024F\s'-]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

type FormFields = 'firstName' | 'lastName' | 'username' | 'email' | 'password' | 'confirmPassword';

function validateField(field: FormFields, value: string, password: string | undefined, t: (key: string) => string): string {
  switch (field) {
    case 'firstName':
    case 'lastName': {
      if (!value.trim()) return field === 'firstName' ? t('auth.validation.first_name_required') : t('auth.validation.last_name_required');
      if (value.trim().length < 2 || value.trim().length > 30) return field === 'firstName' ? t('auth.validation.first_name_length') : t('auth.validation.last_name_length');
      if (!NAME_RE.test(value.trim())) return field === 'firstName' ? t('auth.validation.first_name_letters') : t('auth.validation.last_name_letters');
      return '';
    }
    case 'username':
      if (!value.trim()) return t('auth.validation.username_required');
      if (value.length < 4 || value.length > 20) return t('auth.validation.username_length');
      if (value.includes(' ')) return t('auth.validation.username_spaces');
      if (!USERNAME_RE.test(value)) return t('auth.validation.username_chars');
      return '';
    case 'email':
      if (!value.trim()) return t('auth.validation.email_required');
      if (!EMAIL_RE.test(value)) return t('auth.validation.email_invalid');
      return '';
    case 'password':
      if (!value) return t('auth.validation.password_required');
      if (value.length < 8) return t('auth.validation.password_length');
      if (!/[A-Z]/.test(value)) return t('auth.validation.password_upper');
      if (!/[a-z]/.test(value)) return t('auth.validation.password_lower');
      if (!/[0-9]/.test(value)) return t('auth.validation.password_number');
      if (!/[^a-zA-Z0-9]/.test(value)) return t('auth.validation.password_special');
      return '';
    case 'confirmPassword':
      if (!value) return t('auth.validation.confirm_required');
      if (value !== password) return t('auth.validation.passwords_mismatch');
      return '';
    default:
      return '';
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '',
    username: '', email: '',
    password: '', confirmPassword: '',
  });

  // Mark field touched + validate immediately on blur
  const handleBlur = useCallback((field: FormFields) => {
    setTouched(prev => new Set(prev).add(field));
    const err = validateField(field, formData[field], formData.password, t);
    setErrors(prev => ({ ...prev, [field]: err }));
  }, [formData, t]);

  // Live validate only already-touched fields
  const handleChange = useCallback((field: FormFields, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    if (touched.has(field)) {
      const err = validateField(field, value, field === 'confirmPassword' ? next.password : formData.password, t);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
    // Re-validate confirmPassword live when password changes
    if (field === 'password' && touched.has('confirmPassword')) {
      const err = validateField('confirmPassword', next.confirmPassword, value, t);
      setErrors(prev => ({ ...prev, confirmPassword: err }));
    }
  }, [formData, touched, t]);

  const validateAll = (): boolean => {
    const fields: FormFields[] = ['firstName', 'lastName', 'username', 'email', 'password', 'confirmPassword'];
    const newErrors: Record<string, string> = {};
    fields.forEach(f => {
      newErrors[f] = validateField(f, formData[f], formData.password, t);
    });
    setErrors(newErrors);
    setTouched(new Set(fields));
    return Object.values(newErrors).every(e => !e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    try {
      setIsLoading(true);
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      await apiClient.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName,
      });
      await login(
        { username: formData.username, password: formData.password },
        ROUTES.DASHBOARD,
        { isNewUser: true },
      );
    } catch (err) {
      logApiError('[Register] register', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
        return;
      }
      const data = (err as { response?: { data?: { error?: string; message?: string; fields?: Record<string, string> } } })?.response?.data;

      // Backend @Valid field errors → surface per-field
      if (data?.fields) {
        setErrors(prev => ({ ...prev, ...data!.fields }));
        setTouched(new Set(['firstName', 'lastName', 'username', 'email', 'password', 'confirmPassword']));
        return;
      }

      // Map well-known conflict messages to field errors
      const msg = data?.error ?? data?.message ?? '';
      if (/username.*exist|username.*taken/i.test(msg)) {
        setErrors(prev => ({ ...prev, username: t('auth.validation.username_taken') }));
        setTouched(prev => new Set(prev).add('username'));
        return;
      }
      if (/email.*exist|email.*registered/i.test(msg)) {
        setErrors(prev => ({ ...prev, email: t('auth.validation.email_registered') }));
        setTouched(prev => new Set(prev).add('email'));
        return;
      }
      toast.error(msg || t('auth.register_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: is field valid and touched?
  const isValid = (field: FormFields) => touched.has(field) && !errors[field];
  const hasError = (field: FormFields) => touched.has(field) && !!errors[field];

  // Password strength indicators
  const pwRules = [
    { key: 'length',  label: t('auth.pw_rule_length'),  ok: formData.password.length >= 8 },
    { key: 'upper',   label: t('auth.pw_rule_upper'),   ok: /[A-Z]/.test(formData.password) },
    { key: 'lower',   label: t('auth.pw_rule_lower'),   ok: /[a-z]/.test(formData.password) },
    { key: 'number',  label: t('auth.pw_rule_number'),  ok: /[0-9]/.test(formData.password) },
    { key: 'special', label: t('auth.pw_rule_special'), ok: /[^a-zA-Z0-9]/.test(formData.password) },
  ];
  const pwScore = pwRules.filter(r => r.ok).length;

  // Shared input class builder
  const inputCls = (field: FormFields, extraRight = false) =>
    `h-11 pl-10 ${extraRight ? 'pr-10' : ''} transition-colors duration-150 ${
      hasError(field)
        ? 'border-destructive focus-visible:ring-destructive/30'
        : isValid(field)
        ? 'border-green-500 focus-visible:ring-green-500/30'
        : ''
    }`;

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
            <div className="text-sm font-semibold uppercase tracking-widest text-white/60">{t('auth.register_panel_badge')}</div>
            <h1 className="text-4xl font-black leading-tight">
              {t('auth.register_panel_heading')}<br /><span className="text-white/80">{t('auth.register_panel_heading2')}</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-xs">
              {t('auth.register_panel_subtitle')}
            </p>
          </div>
          <div className="space-y-4 pt-2">
            {[
              { icon: BookOpen,    k: 'auth.register_feat_1' },
              { icon: BarChart3,   k: 'auth.register_feat_2' },
              { icon: ShieldCheck, k: 'auth.register_feat_3' },
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
            <h2 className="text-3xl font-black tracking-tight text-foreground">{t('auth.register_title')}</h2>
            <p className="text-muted-foreground text-sm mt-1.5">{t('auth.register_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {serviceUnavailable && (
              <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} />
            )}

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              {(['firstName', 'lastName'] as const).map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={field} className="text-sm font-semibold">
                    {field === 'firstName' ? t('auth.first_name') : t('auth.last_name')}
                  </Label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id={field}
                      value={formData[field]}
                      onChange={e => handleChange(field, e.target.value)}
                      onBlur={() => handleBlur(field)}
                      disabled={isLoading}
                      aria-invalid={hasError(field)}
                      className={inputCls(field, isValid(field))}
                    />
                    {isValid(field) && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {hasError(field) && (
                    <p className="text-xs text-destructive font-medium animate-in fade-in-50 duration-150">⚠️ {errors[field]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-semibold">{t('auth.username')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={e => handleChange('username', e.target.value)}
                  onBlur={() => handleBlur('username')}
                  disabled={isLoading}
                  aria-invalid={hasError('username')}
                  className={inputCls('username', isValid('username'))}
                />
                {isValid('username') && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
              {hasError('username') && (
                <p className="text-xs text-destructive font-medium animate-in fade-in-50 duration-150">⚠️ {errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={isLoading}
                  aria-invalid={hasError('email')}
                  className={inputCls('email', isValid('email'))}
                />
                {isValid('email') && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
              {hasError('email') && (
                <p className="text-xs text-destructive font-medium animate-in fade-in-50 duration-150">⚠️ {errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  disabled={isLoading}
                  aria-invalid={hasError('password')}
                  className={inputCls('password', true)}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar + rule chips — always shown when password is not empty */}
              {formData.password && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-1">
                    {pwRules.map(r => (
                      <div key={r.key} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        r.ok
                          ? pwScore === 5 ? 'bg-green-500' : pwScore >= 3 ? 'bg-yellow-400' : 'bg-orange-400'
                          : 'bg-muted'
                      }`} />
                    ))}
                  </div>
                  <div className="flex gap-x-3 gap-y-1 flex-wrap">
                    {pwRules.map(r => (
                      <span key={r.key} className={`text-xs flex items-center gap-1 transition-colors duration-200 ${r.ok ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className={`w-3 h-3 ${r.ok ? 'opacity-100' : 'opacity-25'}`} />
                        {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hasError('password') && (
                <p className="text-xs text-destructive font-medium animate-in fade-in-50 duration-150">⚠️ {errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">{t('auth.confirm_password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  disabled={isLoading}
                  aria-invalid={hasError('confirmPassword')}
                  className={inputCls('confirmPassword', true)}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {hasError('confirmPassword') && (
                <p className="text-xs text-destructive font-medium animate-in fade-in-50 duration-150">⚠️ {errors.confirmPassword}</p>
              )}
              {isValid('confirmPassword') && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {t('auth.passwords_match')}
                </p>
              )}
            </div>

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
              ) : t('auth.sign_up')}
            </Button>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">{t('auth.or')}</span>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              {t('auth.have_account')}{' '}
              <Link href={ROUTES.LOGIN} className="text-primary font-semibold hover:underline transition-colors">
                {t('auth.sign_in')}
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

