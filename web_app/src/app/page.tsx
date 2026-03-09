import type { Metadata } from 'next';
import { HeroSection } from '@/components/home/hero-section';
import { StatsHighlights } from '@/components/home/stats-highlights';
import { FeaturesSection } from '@/components/home/features-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { CategoriesPreview } from '@/components/home/categories-preview';
import { SmartQuizCTA } from '@/components/home/smart-quiz-cta';
import { TestimonialsSection } from '@/components/home/testimonials-section';
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
        text:    "Use ReadyRoad to study 250+ official Belgian traffic signs, complete theory lessons, and take unlimited practice exams. Track your weak areas with our analytics dashboard.",
      },
    },
    {
      "@type":          "Question",
      name:             "Hoe kan ik mijn rijbewijs theorie examen oefenen?",
      acceptedAnswer: {
        "@type": "Answer",
        text:    "Met ReadyRoad kun je alle 250+ verkeerstekens bestuderen, theorie lessen volgen en onbeperkt oefenexamens maken. Volg je voortgang met onze uitgebreide analytics.",
      },
    },
    {
      "@type":          "Question",
      name:             "Comment préparer l'examen théorique du permis de conduire belge?",
      acceptedAnswer: {
        "@type": "Answer",
        text:    "ReadyRoad vous propose 250+ panneaux de signalisation belges, des cours de théorie et des examens pratiques illimités. Identifiez vos points faibles grâce aux analyses détaillées.",
      },
    },
    {
      "@type":          "Question",
      name:             "كيف أستعد لامتحان رخصة القيادة في بلجيكا؟",
      acceptedAnswer: {
        "@type": "Answer",
        text:    "استخدم ReadyRoad لدراسة أكثر من 250 إشارة مرور رسمية بلجيكية، وأكمل دروس النظرية، وأجري اختبارات تدريبية غير محدودة. تتبع نقاط ضعفك من خلال لوحة التحليلات.",
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
        text:    "ReadyRoad is available in 4 languages: English, Nederlands (Dutch), Français (French), and العربية (Arabic) – covering all major language communities in Belgium.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: 'ReadyRoad – Belgian Driving License Exam Prep | Rijbewijs Theorie | Permis de Conduire Belgique',
  description:
    'Prepare for the Belgian driving license exam with 250+ traffic signs, theory lessons & practice tests. Trusted by thousands of learners. Rijbewijs theorie oefenen | Examen théorique permis conduire belgique | رخصة القيادة بلجيكا.',
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
    title: 'ReadyRoad – #1 Belgian Driving License Exam Prep Platform',
    description: '250+ traffic signs, theory lessons and unlimited practice exams. Start preparing for your Belgian driving license for free.',
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
        <SmartQuizCTA />
        <TestimonialsSection />
      </main>


      <StickyCTA />
    </div>
  );
}