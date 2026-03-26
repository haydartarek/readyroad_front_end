import type { Metadata } from 'next';
import { HeroSection } from '@/components/home/hero-section';
import { StatsHighlights } from '@/components/home/stats-highlights';
import { FeaturesSection } from '@/components/home/features-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { CategoriesPreview } from '@/components/home/categories-preview';
import { ExamCta } from '@/components/home/exam-cta';
import { StickyCTA } from '@/components/home/sticky-cta';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://readyroad.be';

const faqSchema = {
  "@context": "https://schema.org",
  "@type":    "FAQPage",
  mainEntity: [
    {
      "@type":          "Question",
      name:             "How do I prepare for the Belgian driving theory exam?",
      acceptedAnswer: {
        "@type": "Answer",
        text:    "Use ReadyRoad to study Belgian traffic signs, review theory lessons, practise by category, and track weak areas from your dashboard.",
      },
    },
    {
      "@type":          "Question",
      name:             "Hoe kan ik mijn rijbewijs theorie examen oefenen?",
      acceptedAnswer: {
        "@type": "Answer",
        text:    "Met ReadyRoad kun je verkeerstekens bestuderen, theorielessen volgen, per categorie oefenen en je voortgang volgen via je dashboard.",
      },
    },
    {
      "@type":          "Question",
      name:             "Comment préparer l'examen théorique du permis de conduire belge?",
      acceptedAnswer: {
        "@type": "Answer",
        text:    "ReadyRoad vous aide à étudier les panneaux belges, suivre les cours de théorie, pratiquer par catégorie et repérer vos points faibles depuis le tableau de bord.",
      },
    },
    {
      "@type":          "Question",
      name:             "كيف أستعد لامتحان رخصة القيادة في بلجيكا؟",
      acceptedAnswer: {
        "@type": "Answer",
        text:    "استخدم ReadyRoad لدراسة إشارات المرور البلجيكية، ومراجعة الدروس النظرية، والتدرب حسب الفئة، ومتابعة نقاط ضعفك من لوحة التحكم.",
      },
    },
    {
      "@type":          "Question",
      name:             "Is ReadyRoad free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text:    "Yes! ReadyRoad offers a free account with access to traffic signs, theory lessons, and practice exams. Sign up at readyroad.be.",
      },
    },
    {
      "@type":          "Question",
      name:             "In which languages is ReadyRoad available?",
      acceptedAnswer: {
        "@type": "Answer",
        text:    "ReadyRoad is available in English, Dutch, French, and Arabic so learners can study in the language that suits them best.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: 'ReadyRoad – Belgian Driving License Exam Prep | Rijbewijs Theorie | Permis de Conduire Belgique',
  description:
    'Prepare for the Belgian driving theory exam with traffic signs, structured lessons, focused practice, and a progress dashboard. Rijbewijs theorie oefenen | Examen théorique permis conduire belgique | رخصة القيادة بلجيكا.',
  keywords: [
    'Belgian driving license exam', 'rijbewijs theorie examen',
    'permis de conduire belgique', 'رخصة القيادة بلجيكا',
    'Belgian driving theory test', 'rijexamen oefenen online',
    'examen théorique permis B belgique', 'امتحان القيادة بلجيكا',
  ],
  alternates: {
    canonical: APP_URL,
    languages: {
      'en': APP_URL, 'nl': APP_URL, 'fr': APP_URL, 'ar': APP_URL,
      'x-default': APP_URL,
    },
  },
  openGraph: {
    title: 'ReadyRoad – Belgian Driving License Exam Prep Platform',
    description: 'Study traffic signs, review theory lessons, practise by category, and track your progress in one place.',
    url: APP_URL,
    siteName: 'ReadyRoad',
    locale: 'en_BE',
    alternateLocale: ['nl_BE', 'fr_BE', 'ar'],
    images: [{ url: '/images/og.png', width: 1200, height: 630, alt: 'ReadyRoad – Belgian Driving License Exam Prep' }],
    type: 'website',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main>
        <HeroSection />
        <StatsHighlights />
        <FeaturesSection />
        <HowItWorksSection />
        <CategoriesPreview />
        <ExamCta />
      </main>


      <StickyCTA />
    </div>
  );
}
