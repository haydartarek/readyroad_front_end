export function StatsSection() {
  const stats = [
    { value: '10,000+', label: 'Students Enrolled' },
    { value: '85%', label: 'Pass Rate' },
    { value: '50,000+', label: 'Practice Questions Completed' },
    { value: '4.9/5', label: 'Average Rating' },
  ];

  return (
    <section className="bg-primary py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-2 text-4xl font-bold text-white md:text-5xl">
                {stat.value}
              </div>
              <div className="text-lg text-white/90">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
