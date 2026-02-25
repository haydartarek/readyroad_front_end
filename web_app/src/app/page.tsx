import { HeroSection } from '@/components/home/hero-section';
import { StatsHighlights } from '@/components/home/stats-highlights';
import { FeaturesSection } from '@/components/home/features-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { CategoriesPreview } from '@/components/home/categories-preview';
import { SmartQuizCTA } from '@/components/home/smart-quiz-cta';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { Footer } from '@/components/home/footer';
import { StickyCTA } from '@/components/home/sticky-cta';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Navbar — rendered in layout.tsx */}
      {/* 2. Hero */}
      <HeroSection />
      {/* 3. Stats / Highlights */}
      <StatsHighlights />
      {/* 4. Core Features Grid */}
      <FeaturesSection />
      {/* 5. How It Works */}
      <HowItWorksSection />
      {/* 6. Practice by Category */}
      <CategoriesPreview />
      {/* 7. Full-width CTA / Emphasis Band */}
      <SmartQuizCTA />
      {/* 8. Testimonials */}
      <TestimonialsSection />
      {/* 9. Footer */}
      <Footer />
      {/* Sticky bottom CTA */}
      <StickyCTA />
    </div>
  );
}
