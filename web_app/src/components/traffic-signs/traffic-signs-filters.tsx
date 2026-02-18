'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';

interface Category {
  value: string;
  label: string;
  count: number;
}

interface TrafficSignsFiltersProps {
  categories: Category[];
  selectedCategory: string;
  searchQuery: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function TrafficSignsFilters({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  onClearFilters,
}: TrafficSignsFiltersProps) {
  const [search, setSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Keep local input in sync when parent clears
  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchInput = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(value), 400);
  };

  return (
    <div className="mb-8 space-y-6">
      {/* Search bar */}
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Search traffic signs..."
          value={search}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="max-w-md"
        />
        {(selectedCategory !== 'all' || search) && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Category filter buttons */}
      <div className="flex flex-wrap gap-3">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            onClick={() => onCategoryChange(cat.value)}
            className="rounded-full"
          >
            {cat.label}
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {cat.count}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
