'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/home/footer';

const EXCLUDED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export function ConditionalFooter() {
  const pathname = usePathname();
  const allowAdminDashboard = pathname === '/admin/dashboard';
  const hidden = EXCLUDED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'));
  if (hidden && !allowAdminDashboard) return null;
  return <Footer />;
}
