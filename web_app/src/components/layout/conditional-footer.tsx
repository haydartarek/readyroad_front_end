'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/home/footer';

const EXCLUDED_PREFIXES = ['/admin', '/dashboard', '/login', '/register'];

export function ConditionalFooter() {
  const pathname = usePathname();
  const hidden = EXCLUDED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'));
  if (hidden) return null;
  return <Footer />;
}
