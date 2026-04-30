'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { ROUTES } from '@/lib/constants';
import { AuthPageFrame } from '@/components/auth/auth-page-frame';
import { AuthShowcasePanel } from '@/components/auth/auth-showcase-panel';
import { cn } from '@/lib/utils';
import { getSocialAuthErrorMessage } from '@/lib/social-auth-feedback';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[a-zA-Z\u00C0-\u024F\s'-]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

type FormFields =
  | 'firstName'
  | 'lastName'
  | 'username'
  | 'email'
  | 'password'
  | 'confirmPassword';

function validateField(
  field: FormFields,
  value: string,
  password: string | undefined,
  t: (key: string) => string,
): string {
  switch (field) {
    case 'firstName':
    case 'lastName':
      if (!value.trim()) {
        return field === 'firstName'
          ? t('auth.validation.first_name_required')
          : t('auth.validation.last_name_required');
      }
      if (value.trim().length < 2 || value.trim().length > 30) {
        return field === 'firstName'
          ? t('auth.validation.first_name_length')
          : t('auth.validation.last_name_length');
      }
      if (!NAME_RE.test(value.trim())) {
        return field === 'firstName'
          ? t('auth.validation.first_name_letters')
          : t('auth.validation.last_name_letters');
      }
      return '';
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

export default function RegisterPage() {
  const { register } = useAuth();
  const { t, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const authError = searchParams.get('authError');
    if (!authError) return;

    const message = getSocialAuthErrorMessage(t, authError);
    if (message) {
      toast.error(message);
    }

    if (authError === 'unavailable') {
      setServiceUnavailable(true);
    }
  }, [searchParams, t]);

  const handleBlur = useCallback(
    (field: FormFields) => {
      setTouched((prev) => new Set(prev).add(field));
      const err = validateField(field, formData[field], formData.password, t);
      setErrors((prev) => ({ ...prev, [field]: err }));
    },
    [formData, t],
  );

  const handleChange = useCallback(
    (field: FormFields, value: string) => {
      const next = { ...formData, [field]: value };
      setFormData(next);
      if (touched.has(field)) {
        const err = validateField(
          field,
          value,
          field === 'confirmPassword' ? next.password : formData.password,
          t,
        );
        setErrors((prev) => ({ ...prev, [field]: err }));
      }
      if (field === 'password' && touched.has('confirmPassword')) {
        const err = validateField('confirmPassword', next.confirmPassword, value, t);
        setErrors((prev) => ({ ...prev, confirmPassword: err }));
      }
    },
    [formData, touched, t],
  );

  const validateAll = () => {
    const fields: FormFields[] = [
      'firstName',
      'lastName',
      'username',
      'email',
      'password',
      'confirmPassword',
    ];
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      newErrors[field] = validateField(field, formData[field], formData.password, t);
    });
    setErrors(newErrors);
    setTouched(new Set(fields));
    return Object.values(newErrors).every((value) => !value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    try {
      setIsLoading(true);
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const result = await register(
        {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName,
        },
        ROUTES.DASHBOARD,
      );
      if (!result.success) {
        if (result.status === 503) {
          setServiceUnavailable(true);
          return;
        }

        const message = result.message ?? '';
        if (/username.*exist|username.*taken/i.test(message)) {
          setErrors((prev) => ({ ...prev, username: t('auth.validation.username_taken') }));
          setTouched((prev) => new Set(prev).add('username'));
          return;
        }
        if (/email.*exist|email.*registered/i.test(message)) {
          setErrors((prev) => ({ ...prev, email: t('auth.validation.email_registered') }));
          setTouched((prev) => new Set(prev).add('email'));
          return;
        }

        toast.error(message || t('auth.register_failed'));
      }
    } catch (err) {
      logApiError('[Register] register', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
        return;
      }

      const data = (err as {
        response?: { data?: { error?: string; message?: string; fields?: Record<string, string> } };
      })?.response?.data;

      if (data?.fields) {
        setErrors((prev) => ({ ...prev, ...data.fields }));
        setTouched(
          new Set([
            'firstName',
            'lastName',
            'username',
            'email',
            'password',
            'confirmPassword',
          ]),
        );
        return;
      }

      toast.error(data?.error ?? data?.message ?? t('auth.register_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = (field: FormFields) => touched.has(field) && !errors[field];
  const hasError = (field: FormFields) => touched.has(field) && !!errors[field];

  const pwRules = [
    { key: 'length', label: t('auth.pw_rule_length'), ok: formData.password.length >= 8 },
    { key: 'upper', label: t('auth.pw_rule_upper'), ok: /[A-Z]/.test(formData.password) },
    { key: 'lower', label: t('auth.pw_rule_lower'), ok: /[a-z]/.test(formData.password) },
    { key: 'number', label: t('auth.pw_rule_number'), ok: /[0-9]/.test(formData.password) },
    { key: 'special', label: t('auth.pw_rule_special'), ok: /[^a-zA-Z0-9]/.test(formData.password) },
  ];

  const inputClassName = (field: FormFields, withAction = false) =>
    `${cn(
      'h-12 rounded-2xl border-border/60 shadow-sm transition-colors duration-150',
      isRTL
        ? withAction
          ? 'pl-11 pr-10'
          : 'pr-10'
        : withAction
          ? 'pl-10 pr-11'
          : 'pl-10',
    )} ${
      hasError(field)
        ? 'border-destructive focus-visible:ring-destructive/30'
        : isValid(field)
          ? 'border-green-500 focus-visible:ring-green-500/30'
          : ''
    }`;

  return (
    <AuthPageFrame
      showcase={
        <AuthShowcasePanel
          badge={t('auth.register_panel_badge')}
          title={t('auth.register_panel_heading')}
          titleAccent={t('auth.register_panel_heading2')}
          description={t('auth.register_panel_subtitle')}
          supportingText={t('auth.panel_learners_text')}
          verticalAlign="start"
          features={[
            { icon: BookOpen, label: t('auth.register_feat_1') },
            { icon: BarChart3, label: t('auth.register_feat_2') },
            { icon: ShieldCheck, label: t('auth.register_feat_3') },
          ]}
        />
      }
      title={t('auth.register_title')}
      subtitle={t('auth.register_subtitle')}
      maxWidthClassName="max-w-xl"
      cardClassName="p-5 sm:p-6"
      headerClassName="mb-6 space-y-1.5"
      footer={
        <p className="text-center text-xs text-muted-foreground/80">
          © {new Date().getFullYear()} {t('app.name')}. {t('auth.copyright')}
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        {serviceUnavailable && (
          <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} />
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {(['firstName', 'lastName'] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={field} className="text-sm font-semibold">
                {field === 'firstName' ? t('auth.first_name') : t('auth.last_name')}
              </Label>
              <div className="relative">
                <BadgeCheck
                  className={cn(
                    "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                    isRTL ? "right-3" : "left-3",
                  )}
                />
                <Input
                  id={field}
                  name={field}
                  autoComplete={field === 'firstName' ? 'given-name' : 'family-name'}
                  value={formData[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  disabled={isLoading}
                  aria-invalid={hasError(field)}
                  className={inputClassName(field, isValid(field))}
                />
                {isValid(field) && (
                  <CheckCircle2
                    className={cn(
                      "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-green-500",
                      isRTL ? "left-3" : "right-3",
                    )}
                  />
                )}
              </div>
              {hasError(field) ? (
                <p className="text-xs font-medium text-destructive">{errors[field]}</p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
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
              autoComplete="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              onBlur={() => handleBlur('username')}
              disabled={isLoading}
              aria-invalid={hasError('username')}
              className={inputClassName('username', isValid('username'))}
            />
            {isValid('username') && (
              <CheckCircle2
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-green-500",
                  isRTL ? "left-3" : "right-3",
                )}
              />
            )}
          </div>
          {hasError('username') ? (
            <p className="text-xs font-medium text-destructive">{errors.username}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold">
            {t('auth.email')}
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
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              disabled={isLoading}
              aria-invalid={hasError('email')}
              className={inputClassName('email', isValid('email'))}
            />
            {isValid('email') && (
              <CheckCircle2
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-green-500",
                  isRTL ? "left-3" : "right-3",
                )}
              />
            )}
          </div>
          {hasError('email') ? (
            <p className="text-xs font-medium text-destructive">{errors.email}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
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
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              disabled={isLoading}
              aria-invalid={hasError('password')}
              className={inputClassName('password', true)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
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

          {formData.password ? (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex gap-1">
                {pwRules.map((rule) => (
                  <div
                    key={rule.key}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      rule.ok ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {pwRules.map((rule) => (
                  <span
                    key={rule.key}
                    className={`text-xs ${
                      rule.ok ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                    }`}
                  >
                    {rule.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {hasError('password') ? (
            <p className="text-xs font-medium text-destructive">{errors.password}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold">
            {t('auth.confirm_password')}
          </Label>
          <div className="relative">
            <Lock
              className={cn(
                "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                isRTL ? "right-3" : "left-3",
              )}
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              disabled={isLoading}
              aria-invalid={hasError('confirmPassword')}
              className={inputClassName('confirmPassword', true)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              aria-label={showConfirm ? t('auth.hide_password') : t('auth.show_password')}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground",
                isRTL ? "left-3" : "right-3",
              )}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {hasError('confirmPassword') ? (
            <p className="text-xs font-medium text-destructive">{errors.confirmPassword}</p>
          ) : null}
          {isValid('confirmPassword') ? (
            <p className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              {t('auth.passwords_match')}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="mt-1.5 h-11 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
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
            t('auth.sign_up')
          )}
        </Button>

        <GoogleAuthButton
          mode="register"
          label={t('auth.continue_with_google')}
        />

        <div className="relative py-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3.5 text-sm font-semibold text-foreground/80">{t('auth.or')}</span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.have_account')}{' '}
          <Link
            href={ROUTES.LOGIN}
            className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            {t('auth.sign_in')}
          </Link>
        </p>
      </form>
    </AuthPageFrame>
  );
}
