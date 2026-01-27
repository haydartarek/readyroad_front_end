import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left content */}
          <div className="space-y-6">
            {/* Label */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Belgian Driving License Platform
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-bold leading-tight text-[#2C3E50] md:text-5xl lg:text-6xl">
              Master Your Belgian Driving License Exam
            </h1>

            {/* Supporting text */}
            <p className="text-lg text-gray-600 leading-relaxed">
              Prepare with confidence using our comprehensive platform featuring 50-question
              exams, 200+ traffic signs, 31 theory lessons, and intelligent analytics in 4
              languages.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/register">
                <Button size="lg" className="text-base h-12 px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-base h-12 px-8">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-6 border-t border-gray-100">
              <div>
                <div className="text-3xl font-bold text-[#DF5830]">50</div>
                <div className="text-sm text-gray-600">Questions per Exam</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#DF5830]">200+</div>
                <div className="text-sm text-gray-600">Traffic Signs</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#DF5830]">31</div>
                <div className="text-sm text-gray-600">Theory Lessons</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#DF5830]">4</div>
                <div className="text-sm text-gray-600">Languages</div>
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              {/* Main visual container */}
              <div className="relative aspect-square w-full rounded-3xl bg-gradient-to-br from-[#DF5830]/5 to-[#2C3E50]/5 p-8 lg:p-12">
                <div className="flex h-full flex-col items-center justify-center space-y-8 text-center">
                  {/* Logo */}
                  <div className="relative w-48 h-48">
                    <Image
                      src="/images/logo.png"
                      alt="ReadyRoad"
                      fill
                      sizes="(max-width: 768px) 192px, 192px"
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* Status badge */}
                  <div className="rounded-2xl bg-white px-8 py-4 shadow-sm border border-gray-100">
                    <p className="text-2xl font-bold text-[#2C3E50]">
                      Ready to Drive! 🚗
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative element - subtle */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#DF5830]/10" />
              <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-[#2C3E50]/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
