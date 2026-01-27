import { HeroSection } from '@/components/home/hero-section';
import { FeaturesSection } from '@/components/home/features-section';
import { StatsSection } from '@/components/home/stats-section';
import { CTASection } from '@/components/home/cta-section';

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
    </div>
  );
}
