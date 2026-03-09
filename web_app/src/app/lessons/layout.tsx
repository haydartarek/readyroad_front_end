import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://readyroad.be';

export const metadata: Metadata = {
  title: 'Driving Theory Lessons – Rijtheorie Lessen | Cours Théorie Permis | دروس القيادة',
  description:
    'Comprehensive Belgian driving theory lessons in 4 languages. Master road rules, traffic signs, right-of-way & safety for your exam. Rijbewijs lessen België | Cours permis de conduire belgique | دروس نظرية رخصة القيادة بلجيكا.',
  keywords: [
    'Belgian driving theory lessons', 'driving lessons Belgium',
    'rijbewijs lessen', 'rijtheorie lessen België', 'verkeersregels leren',
    'cours théorie permis conduire belgique', 'leçons code de la route belgique',
    'دروس نظرية رخصة القيادة بلجيكا', 'تعلم قواعد المرور بلجيكا',
  ],
  alternates: {
    canonical: `${APP_URL}/lessons`,
    languages: {
      'en': `${APP_URL}/lessons`,
      'nl': `${APP_URL}/lessons`,
      'fr': `${APP_URL}/lessons`,
      'ar': `${APP_URL}/lessons`,
      'x-default': `${APP_URL}/lessons`,
    },
  },
  openGraph: {
    title: 'Belgian Driving Theory Lessons in 4 Languages | ReadyRoad',
    description: 'Master Belgian driving theory with structured lessons. Available in English, Nederlands, Français & العربية.',
    url: `${APP_URL}/lessons`,
    siteName: 'ReadyRoad',
    locale: 'en_BE',
    alternateLocale: ['nl_BE', 'fr_BE', 'ar'],
    images: [{ url: '/images/og.png', width: 1200, height: 630, alt: 'Driving Theory Lessons – ReadyRoad' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Belgian Driving Theory Lessons | ReadyRoad',
    description: 'Master Belgian road rules with structured theory lessons.',
    images: ['/images/og.png'],
  },
};

export default function LessonsLayout({
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
