import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://readyroad.be';

export const metadata: Metadata = {
  title: 'Terms of Service | ReadyRoad',
  description:
    'ReadyRoad Terms of Service. Read our usage terms for the Belgian driving license exam preparation platform.',
  alternates: {
    canonical: `${APP_URL}/terms`,
    languages: {
      'en': `${APP_URL}/terms`,
      'nl': `${APP_URL}/terms`,
      'fr': `${APP_URL}/terms`,
      'ar': `${APP_URL}/terms`,
      'x-default': `${APP_URL}/terms`,
    },
  },
  openGraph: {
    title: 'Terms of Service | ReadyRoad',
    description: 'ReadyRoad terms of service for the Belgian driving license preparation platform.',
    url: `${APP_URL}/terms`,
    siteName: 'ReadyRoad',
    locale: 'en_BE',
    images: [{ url: '/images/og.png', width: 1200, height: 630, alt: 'ReadyRoad Terms' }],
    type: 'website',
  },
  robots: { index: true, follow: false },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
