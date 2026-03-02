'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { isValidEmail, isValidPassword } from '@/lib/utils';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Mail, Lock, BadgeCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    preferredLanguage: 'en' as 'en' | 'ar' | 'nl' | 'fr',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username || formData.username.length < 3)
      newErrors.username = 'Username must be at least 3 characters';

    if (!isValidEmail(formData.email))
      newErrors.email = 'Please enter a valid email address';

    if (!isValidPassword(formData.password))
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (!formData.firstName)
      newErrors.firstName = 'First name is required';

    if (!formData.lastName)
      newErrors.lastName = 'Last name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      await apiClient.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName,
        preferredLanguage: formData.preferredLanguage,
      });
      toast.success('Account created successfully! Please login.');
      router.push(ROUTES.LOGIN);
    } catch (err) {
      logApiError('[Register] register', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const Field = ({
    id,
    label,
    type = 'text',
    icon: Icon,
    value,
    error,
    onChange,
    rightElement,
  }: {
    id: string;
    label: string;
    type?: string;
    icon: React.ElementType;
    value: string;
    error?: string;
    onChange: (v: string) => void;
    rightElement?: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!error}
          className={`h-11 pl-10 ${rightElement ? 'pr-10' : ''} text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
            error ? 'border-destructive focus:ring-destructive/20' : ''
          }`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive font-medium animate-in fade-in-50 slide-in-from-top-1 duration-200">
          ⚠️ {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="border border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-4 pb-4">
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
                {t('auth.register')}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Join <span className="text-primary font-semibold">ReadyRoad</span> and start your journey 🚗
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {serviceUnavailable && (
                <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} />
              )}

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold">
                    {t('auth.first_name')}
                  </Label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={isLoading}
                      aria-invalid={!!errors.firstName}
                      className={`h-11 pl-10 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${errors.firstName ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-destructive font-medium animate-in fade-in-50 duration-200">
                      ⚠️ {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold">
                    {t('auth.last_name')}
                  </Label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={isLoading}
                      aria-invalid={!!errors.lastName}
                      className={`h-11 pl-10 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${errors.lastName ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-xs text-destructive font-medium animate-in fade-in-50 duration-200">
                      ⚠️ {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Username */}
              <Field
                id="username"
                label={t('auth.username')}
                icon={User}
                value={formData.username}
                error={errors.username}
                onChange={(v) => setFormData({ ...formData, username: v })}
              />

              {/* Email */}
              <Field
                id="email"
                label={t('auth.email')}
                type="email"
                icon={Mail}
                value={formData.email}
                error={errors.email}
                onChange={(v) => setFormData({ ...formData, email: v })}
              />

              {/* Password */}
              <Field
                id="password"
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                value={formData.password}
                error={errors.password}
                onChange={(v) => setFormData({ ...formData, password: v })}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Confirm Password */}
              <Field
                id="confirmPassword"
                label={t('auth.confirm_password')}
                type={showConfirm ? 'text' : 'password'}
                icon={Lock}
                value={formData.confirmPassword}
                error={errors.confirmPassword}
                onChange={(v) => setFormData({ ...formData, confirmPassword: v })}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Password strength hint */}
              {formData.password && (
                <div className="flex gap-1 mt-1">
                  {['length', 'upper', 'lower', 'number'].map((rule, i) => {
                    const passed =
                      rule === 'length' ? formData.password.length >= 8 :
                      rule === 'upper' ? /[A-Z]/.test(formData.password) :
                      rule === 'lower' ? /[a-z]/.test(formData.password) :
                      /[0-9]/.test(formData.password);
                    return (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          passed ? 'bg-green-500' : 'bg-muted'
                        }`}
                      />
                    );
                  })}
                </div>
              )}
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.sign_up')
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
                {t('auth.have_account')}{' '}
                <Link href={ROUTES.LOGIN} className="text-primary font-semibold hover:underline transition-colors">
                  {t('auth.sign_in')}
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
