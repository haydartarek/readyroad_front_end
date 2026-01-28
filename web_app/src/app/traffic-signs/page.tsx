import { Metadata } from 'next';
import { TrafficSignsGrid } from '@/components/traffic-signs/traffic-signs-grid';
import { TrafficSignsFilters } from '@/components/traffic-signs/traffic-signs-filters';
import { TrafficSign } from '@/lib/types';
import { API_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Belgian Traffic Signs Library | ReadyRoad',
  description: 'Complete library of 194 Belgian traffic signs with detailed explanations in 4 languages. Learn all road signs for your driving license exam.',
  openGraph: {
    title: 'Belgian Traffic Signs Library',
    description: 'Complete library of 194 Belgian traffic signs with real images',
    images: ['/images/og-traffic-signs.png'],
  },
};

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every 1 hour

// Map category codes to display names
function getCategoryName(code: string): string {
  const categoryMap: Record<string, string> = {
    'A': 'DANGER',
    'B': 'PRIORITY',
    'C': 'PROHIBITION',
    'D': 'MANDATORY',
    'E': 'PARKING',
    'F': 'INFORMATION',
    'G': 'ADDITIONAL',
    'M': 'BICYCLE',
    'Z': 'ZONE',
  };
  return categoryMap[code] || code;
}

async function getAllTrafficSigns(): Promise<TrafficSign[]> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/traffic-signs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error('Failed to fetch traffic signs:', response.status);
      return [];
    }

    const data = await response.json();
    const signs = Array.isArray(data) ? data : (data.signs || []);

    // Map backend response to frontend format (categoryCode → category name)
    return signs.map((sign: { categoryCode: string; category?: string;[key: string]: unknown }) => ({
      ...sign,
      category: getCategoryName(sign.categoryCode) || sign.category || 'UNKNOWN',
    }));
  } catch (error) {
    console.error('Error fetching traffic signs:', error);
    return [];
  }
}

export default async function TrafficSignsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const allSigns = await getAllTrafficSigns();
  const params = await searchParams;

  // Filter by category if specified
  let filteredSigns = allSigns;
  if (params.category && params.category !== 'all') {
    filteredSigns = allSigns.filter(
      sign => sign.category.toLowerCase() === params.category?.toLowerCase()
    );
  }

  // Filter by search query
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredSigns = filteredSigns.filter(sign =>
      sign.nameEn.toLowerCase().includes(searchLower) ||
      sign.nameAr.includes(params.search!) ||
      sign.descriptionEn.toLowerCase().includes(searchLower)
    );
  }

  const categories = [
    { value: 'all', label: 'All Signs', count: allSigns.length },
    { value: 'DANGER', label: 'Danger Signs', count: allSigns.filter(s => s.category === 'DANGER').length },
    { value: 'PROHIBITION', label: 'Prohibition Signs', count: allSigns.filter(s => s.category === 'PROHIBITION').length },
    { value: 'MANDATORY', label: 'Mandatory Signs', count: allSigns.filter(s => s.category === 'MANDATORY').length },
    { value: 'PRIORITY', label: 'Priority Signs', count: allSigns.filter(s => s.category === 'PRIORITY').length },
    { value: 'INFORMATION', label: 'Information Signs', count: allSigns.filter(s => s.category === 'INFORMATION').length },
    { value: 'PARKING', label: 'Parking Signs', count: allSigns.filter(s => s.category === 'PARKING').length },
    { value: 'BICYCLE', label: 'Bicycle Signs', count: allSigns.filter(s => s.category === 'BICYCLE').length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Belgian Traffic Signs
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Learn all Belgian traffic signs with detailed explanations in 4 languages.
            Essential for passing your driving license exam.
          </p>
        </div>

        {/* Filters */}
        <TrafficSignsFilters
          categories={categories}
          selectedCategory={params.category || 'all'}
          searchQuery={params.search || ''}
        />

        {/* Results count */}
        <div className="mb-6 text-sm text-gray-600">
          Showing {filteredSigns.length} of {allSigns.length} signs
        </div>

        {/* Signs Grid */}
        <TrafficSignsGrid signs={filteredSigns} />

        {/* Empty state */}
        {filteredSigns.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-gray-500">No signs found matching your criteria.</p>
            <p className="mt-2 text-sm text-gray-400">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
