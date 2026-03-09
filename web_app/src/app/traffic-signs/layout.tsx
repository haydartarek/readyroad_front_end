import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://readyroad.be';

export const metadata: Metadata = {
  title: 'Belgian Traffic Signs – Verkeerstekens | Panneaux Belgique | إشارات المرور',
  description:
    'Study all 250+ official Belgian traffic signs with explanations in 4 languages. Danger, prohibition, mandatory, information, parking & zone signs. Verkeerstekens België | Panneaux signalisation Belgique | إشارات المرور بلجيكا.',
  keywords: [
    'Belgian traffic signs', 'traffic signs Belgium', 'road signs Belgium',
    'verkeerstekens België', 'verkeersborden leren', 'gevaarsborden België',
    'panneaux signalisation belgique', 'panneaux routiers belgique',
    'إشارات المرور بلجيكا', 'علامات الطريق البلجيكية',
  ],
  alternates: {
    canonical: `${APP_URL}/traffic-signs`,
    languages: {
      'en': `${APP_URL}/traffic-signs`,
      'nl': `${APP_URL}/traffic-signs`,
      'fr': `${APP_URL}/traffic-signs`,
      'ar': `${APP_URL}/traffic-signs`,
      'x-default': `${APP_URL}/traffic-signs`,
    },
  },
  openGraph: {
    title: '250+ Belgian Traffic Signs – Study in 4 Languages | ReadyRoad',
    description: 'All official Belgian road signs with explanations in English, Nederlands, Français & العربية. Essential for passing your driving license exam.',
    url: `${APP_URL}/traffic-signs`,
    siteName: 'ReadyRoad',
    locale: 'en_BE',
    alternateLocale: ['nl_BE', 'fr_BE', 'ar'],
    images: [{ url: '/images/og.png', width: 1200, height: 630, alt: 'Belgian Traffic Signs – ReadyRoad' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '250+ Belgian Traffic Signs | ReadyRoad',
    description: 'Study all official Belgian road signs. Essential for passing your driving exam.',
    images: ['/images/og.png'],
  },
};

export default function TrafficSignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumb />
        </div>
        {children}
      </main>
    </div>
  );
}
