import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://readyroad.be';

export const metadata: Metadata = {
  title: 'Contact ReadyRoad – Get in Touch',
  description:
    'Contact the ReadyRoad team for support, feedback or questions about the Belgian driving license exam preparation platform.',,
  keywords: [
    'contact ReadyRoad', 'ReadyRoad support',
    'rijbewijs app contact', 'contact rijbewijs oefenen',
    'contact permis conduire belgique',
    'تواصل ReadyRoad', 'دعم رخصة القيادة بلجيكا',
  ],
  alternates: {
    canonical: `${APP_URL}/contact`,
    languages: {
      'en': `${APP_URL}/contact`,
      'nl': `${APP_URL}/contact`,
      'fr': `${APP_URL}/contact`,
      'ar': `${APP_URL}/contact`,
      'x-default': `${APP_URL}/contact`,
    },
  },
  openGraph: {
    title: 'Contact ReadyRoad | Belgian Driving License Platform',
    description: 'Get in touch with the ReadyRoad team. We are here to help you prepare for the Belgian driving exam.',
    url: `${APP_URL}/contact`,
    siteName: 'ReadyRoad',
    locale: 'en_BE',
    images: [{ url: '/images/og.png', width: 1200, height: 630, alt: 'Contact ReadyRoad' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
