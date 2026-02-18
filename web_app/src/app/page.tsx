import { HeroSection } from '@/components/home/hero-section';
import { SocialProofSection } from '@/components/home/social-proof-section';
import { WhatsNewSection } from '@/components/home/whats-new-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { ModesComparisonSection } from '@/components/home/modes-comparison-section';
import { FeaturesSection } from '@/components/home/features-section';
import { QuizPreviewSection } from '@/components/home/quiz-preview-section';
import { StatsSection } from '@/components/home/stats-section';
import { ComparisonSection } from '@/components/home/comparison-section';
import { PricingSection } from '@/components/home/pricing-section';
import { FAQSection } from '@/components/home/faq-section';
import { CTASection } from '@/components/home/cta-section';
import { Footer } from '@/components/home/footer';
import { StickyCTA } from '@/components/home/sticky-cta';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 1. Hero — auth-aware CTAs + trust microcopy */}
      <HeroSection />

      {/* 2. Exam format stats (social proof) */}
      <SocialProofSection />

      {/* 3. Testimonials / beta-feedback */}
      <TestimonialsSection />

      {/* 4. How it works */}
      <HowItWorksSection />

      {/* 5. Practice vs Full Exam comparison */}
      <ModesComparisonSection />

      {/* 6. Features grid */}
      <FeaturesSection />

      {/* 7. Interactive quiz preview — no auth required */}
      <QuizPreviewSection />

      {/* 8. Stats bar */}
      <StatsSection />

      {/* 9. Why ReadyRoad — evidence-based + disclaimer */}
      <ComparisonSection />

      {/* 10. What's new / recently improved */}
      <WhatsNewSection />

      {/* 11. Pricing (free) */}
      <PricingSection />

      {/* 12. FAQ with schema.org markup */}
      <FAQSection />

      {/* 13. Final CTA — auth-aware */}
      <CTASection />

      {/* 14. Footer — legal links + language switch */}
      <Footer />

      {/* 15. Sticky bottom CTA — visible after scrolling past hero */}
      <StickyCTA />
    </div>
  );
}
