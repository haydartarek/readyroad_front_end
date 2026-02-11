'use client';

import { TrafficSignsGrid } from '@/components/traffic-signs/traffic-signs-grid';
import { TrafficSignsFilters } from '@/components/traffic-signs/traffic-signs-filters';
import { TrafficSign } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useEffect, useState } from 'react';

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
    'H': 'TEMPORARY',
    'M': 'DELINEATION',
    'Z': 'ZONE',
  };
  return categoryMap[code] || code;
}

async function getAllTrafficSigns(): Promise<TrafficSign[]> {
  try {
    const response = await apiClient.get<TrafficSign[] | { signs: TrafficSign[] }>(API_ENDPOINTS.TRAFFIC_SIGNS.LIST);
    const data = response.data;
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

export default function TrafficSignsPage() {
  const [allSigns, setAllSigns] = useState<TrafficSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadSigns() {
      try {
        const signs = await getAllTrafficSigns();
        setAllSigns(signs);
      } catch (error) {
        console.error('Failed to load signs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSigns();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading traffic signs...</p>
      </div>
    );
  }

  // Filter by category if specified
  let filteredSigns = allSigns;
  if (category && category !== 'all') {
    filteredSigns = allSigns.filter(
      sign => sign.category.toLowerCase() === category?.toLowerCase()
    );
  }

  // Filter by search query
  if (search) {
    const searchLower = search.toLowerCase();
    filteredSigns = filteredSigns.filter(sign =>
      sign.nameEn.toLowerCase().includes(searchLower) ||
      sign.nameAr.includes(search!) ||
      sign.descriptionEn.toLowerCase().includes(searchLower)
    );
  }

  // Build categories dynamically from actual data
  const categoryCounts = allSigns.reduce((acc, sign) => {
    acc[sign.category] = (acc[sign.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryLabels: Record<string, string> = {
    'DANGER': 'Danger Signs',
    'PRIORITY': 'Priority Signs',
    'PROHIBITION': 'Prohibition Signs',
    'MANDATORY': 'Mandatory Signs',
    'PARKING': 'Parking Signs',
    'INFORMATION': 'Information Signs',
    'ADDITIONAL': 'Supplementary Signs',
    'TEMPORARY': 'Temporary Signs',
    'ZONE': 'Zone Signs',
    'DELINEATION': 'Delineation Signs',
  };

  const categories = [
    { value: 'all', label: 'All Signs', count: allSigns.length },
    ...Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({
        value: cat,
        label: categoryLabels[cat] || cat,
        count,
      })),
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
          selectedCategory={category}
          searchQuery={search}
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
