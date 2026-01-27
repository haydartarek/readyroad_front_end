import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    title: 'Realistic Exam Simulation',
    description: 'All questions in 45 minutes, following Belgian driving exam standards with 82% passing score.',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DF5830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Practice Mode',
    description: 'Practice by category with instant feedback. Build confidence before taking the full exam.',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DF5830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Advanced Analytics',
    description: 'Identify weak areas and track progress over time with AI-powered recommendations for targeted improvement.',
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-gray-50/50 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#2C3E50] md:text-4xl">
            Everything You Need to Pass
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Our comprehensive platform provides all the tools and resources you need to ace
            your Belgian driving license exam.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-gray-200 bg-white transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DF5830]/10">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl text-[#2C3E50]">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
