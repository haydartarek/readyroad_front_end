import { HeroSection } from '@/components/home/hero-section';
import { StatsHighlights } from '@/components/home/stats-highlights';
import { FeaturesSection } from '@/components/home/features-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { CategoriesPreview } from '@/components/home/categories-preview';
import { SmartQuizCTA } from '@/components/home/smart-quiz-cta';
import { TestimonialsSection } from '@/components/home/testimonials-section';

import { StickyCTA } from '@/components/home/sticky-cta';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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