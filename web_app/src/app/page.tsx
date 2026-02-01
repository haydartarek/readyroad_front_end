import { HeroSection } from '@/components/home/hero-section';
import { SocialProofSection } from '@/components/home/social-proof-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { FeaturesSection } from '@/components/home/features-section';
import { ProductPreviewSection } from '@/components/home/product-preview-section';
import { ComparisonSection } from '@/components/home/comparison-section';
import { PricingSection } from '@/components/home/pricing-section';
import { FAQSection } from '@/components/home/faq-section';
import { StatsSection } from '@/components/home/stats-section';
import { CTASection } from '@/components/home/cta-section';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 1. Hero Section - Outcome-oriented headline with 2 CTAs */}
      <HeroSection />

      {/* 2. Social Proof - Minimal, credible indicators */}
      <SocialProofSection />

      {/* 3. How It Works - 3 clear steps */}
      <HowItWorksSection />

      {/* 4. Features - 6 features grouped logically */}
      <FeaturesSection />

      {/* 5. Product Preview - Real UI screenshots */}
      <ProductPreviewSection />

      {/* 6. Stats Section - Existing component */}
      <StatsSection />

      {/* 7. Comparison - ReadyRoad vs traditional methods */}
      <ComparisonSection />

      {/* 8. Pricing - Transparent explanation (currently free) */}
      <PricingSection />

      {/* 9. FAQ - Common questions with short answers */}
      <FAQSection />

      {/* 10. Final CTA - Motivating sentence + action button */}
      <CTASection />
    </div>
  );
}
