import { Metadata } from 'next';
import { LessonsGrid } from '@/components/lessons/lessons-grid';
import { Lesson } from '@/lib/types';
import { API_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Driving Theory Lessons | ReadyRoad',
  description: 'Comprehensive driving theory lessons in 4 languages. Master all 31 topics for the Belgian driving license exam.',
  openGraph: {
    title: 'Belgian Driving Theory Lessons',
    description: 'Complete theory course with 31 lessons',
    images: ['/images/og-lessons.png'],
  },
};

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every hour

async function getAllLessons(): Promise<Lesson[]> {
  try {
    // Call real backend API
    const response = await fetch(`${API_CONFIG.BASE_URL}/lessons`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch lessons:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data as Lesson[];
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
}

export default async function LessonsPage() {
  const lessons = await getAllLessons();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Driving Theory Lessons
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Master all 31 theory topics with comprehensive lessons in 4 languages.
            Each lesson includes detailed content and downloadable PDFs for offline study.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 text-center">
            <div className="text-3xl font-bold text-primary">{lessons.length}</div>
            <div className="mt-1 text-sm text-gray-600">Total Lessons</div>
          </div>
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
            <div className="text-3xl font-bold text-green-600">4</div>
            <div className="mt-1 text-sm text-gray-600">Languages</div>
          </div>
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">PDF</div>
            <div className="mt-1 text-sm text-gray-600">Download Available</div>
          </div>
        </div>

        {/* Lessons Grid */}
        <LessonsGrid lessons={lessons} />
      </div>
    </div>
  );
}
