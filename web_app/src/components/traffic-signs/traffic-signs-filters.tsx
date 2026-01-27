'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface Category {
  value: string;
  label: string;
  count: number;
}

interface TrafficSignsFiltersProps {
  categories: Category[];
  selectedCategory: string;
  searchQuery: string;
}

export function TrafficSignsFilters({
  categories,
  selectedCategory,
  searchQuery,
}: TrafficSignsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery);

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    router.push(`/traffic-signs?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    
    // Debounce search
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    
    setTimeout(() => {
      router.push(`/traffic-signs?${params.toString()}`);
    }, 500);
  };

  const handleClearFilters = () => {
    setSearch('');
    router.push('/traffic-signs');
  };

  return (
    <div className="mb-8 space-y-6">
      {/* Search bar */}
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Search traffic signs..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-md"
        />
        {(selectedCategory !== 'all' || search) && (
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            onClick={() => handleCategoryChange(category.value)}
            className="rounded-full"
          >
            {category.label}
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {category.count}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
