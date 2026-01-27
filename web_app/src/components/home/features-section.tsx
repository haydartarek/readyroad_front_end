import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const features = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DF5830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    badge: 'View exam',
    title: 'Realistic Exam Simulation',
    description: 'All questions in 45 minutes, following Belgian driving exam standards with 82% passing score.',
    isPrimary: false,
    href: '/exam',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DF5830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    badge: 'View practice',
    title: 'Practice Mode',
    description: 'Practice by category with instant feedback. Build confidence before taking the full exam.',
    isPrimary: true,
    href: '/practice',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DF5830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    badge: 'View analytics',
    title: 'Advanced Analytics',
    description: 'Identify weak areas and track progress over time with AI-powered recommendations for targeted improvement.',
    isPrimary: false,
    href: '/dashboard',
  },
];

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 lg:py-24">
      {/* Background gradient accents */}
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 -translate-x-32 -translate-y-32 rounded-full bg-gradient-to-br from-purple-100/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-32 translate-y-32 rounded-full bg-gradient-to-tl from-blue-100/30 to-transparent blur-3xl" />

      <div className="container relative mx-auto px-4">
        {/* Section header */}
        <div className="mb-12 text-center lg:mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#2C3E50] md:text-4xl lg:text-5xl">
            Everything You Need to Pass
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
            Our comprehensive platform provides all the tools and resources you need to ace
            your Belgian driving license exam.
          </p>
        </div>

        {/* Feature cards - 3 column grid matching reference */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-xl ${feature.isPrimary
                  ? 'border-[#DF5830]/20 bg-gradient-to-br from-[#DF5830]/5 to-white ring-2 ring-[#DF5830]/10'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              {/* Top badge button - matching "View video" style from reference */}
              <div className="absolute right-4 top-4">
                <Link href={feature.href}>
                  <Button
                    size="sm"
                    variant={feature.isPrimary ? 'default' : 'outline'}
                    className={`h-8 rounded-full text-xs font-medium shadow-sm transition-all ${feature.isPrimary
                        ? 'bg-[#DF5830] hover:bg-[#DF5830]/90'
                        : 'border-gray-300 hover:border-[#DF5830]/30 hover:bg-[#DF5830]/5'
                      }`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {feature.badge}
                  </Button>
                </Link>
              </div>

              <CardHeader className="pb-4">
                {/* Icon container with enhanced depth */}
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${feature.isPrimary
                      ? 'bg-gradient-to-br from-[#DF5830]/20 to-[#DF5830]/10 ring-2 ring-[#DF5830]/20'
                      : 'bg-[#DF5830]/10'
                    }`}
                >
                  {feature.icon}
                </div>

                <CardTitle className="text-xl font-bold text-[#2C3E50]">
                  {feature.title}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="leading-relaxed text-gray-600">{feature.description}</p>
              </CardContent>

              {/* Decorative corner accent for primary card */}
              {feature.isPrimary && (
                <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-tl from-[#DF5830]/10 to-transparent blur-2xl" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
