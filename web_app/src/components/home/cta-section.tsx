import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-12 text-center lg:p-20">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Ready to Get Your Driving License?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 md:text-xl">
            Join thousands of students who have successfully passed their Belgian 
            driving license exam using our platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg">
                Start Learning Now
              </Button>
            </Link>
            <Link href="/traffic-signs">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg">
                Browse Traffic Signs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
