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
import apiClient from '@/lib/api';
import { isValidEmail, isValidPassword } from '@/lib/utils';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!isValidPassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Combine firstName and lastName into fullName for backend
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      await apiClient.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: fullName,
        preferredLanguage: formData.preferredLanguage,
      });

      toast.success('Account created successfully! Please login.');
      router.push(ROUTES.LOGIN);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-3xl font-bold text-white">R</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          {t('auth.register')}
        </CardTitle>
        <CardDescription className="text-center">
          Create your account to start learning
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-semibold text-foreground">
                {t('auth.first_name')}
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={isLoading}
                className="h-11 text-base transition-all duration-200"
                aria-invalid={!!errors.firstName}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive font-medium mt-1.5 animate-in fade-in-50 duration-200">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-semibold text-foreground">
                {t('auth.last_name')}
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={isLoading}
                className="h-11 text-base transition-all duration-200"
                aria-invalid={!!errors.lastName}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive font-medium mt-1.5 animate-in fade-in-50 duration-200">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-semibold text-foreground">
              {t('auth.username')}
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isLoading}
              className="h-11 text-base transition-all duration-200"
              aria-invalid={!!errors.username}
            />
            {errors.username && (
              <p className="text-xs text-destructive font-medium mt-1.5 animate-in fade-in-50 duration-200">
                {errors.username}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">
              {t('auth.email')}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
              className="h-11 text-base transition-all duration-200"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium mt-1.5 animate-in fade-in-50 duration-200">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">
              {t('auth.password')}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
              className="h-11 text-base transition-all duration-200"
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-destructive font-medium mt-1.5 animate-in fade-in-50 duration-200">
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
              {t('auth.confirm_password')}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={isLoading}
              className="h-11 text-base transition-all duration-200"
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive font-medium mt-1.5 animate-in fade-in-50 duration-200">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('auth.sign_up')}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            {t('auth.have_account')}{' '}
            <Link
              href={ROUTES.LOGIN}
              className="text-primary font-semibold hover:underline"
            >
              {t('auth.sign_in')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
