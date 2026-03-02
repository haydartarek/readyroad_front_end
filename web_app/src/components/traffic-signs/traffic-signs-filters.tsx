'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ───────────────────────────────────────────────

interface Category {
  value: string;
  label: string;
  count: number;
}

interface TrafficSignsFiltersProps {
  categories:        Category[];
  selectedCategory:  string;
  searchQuery:       string;
  onCategoryChange:  (category: string) => void;
  onSearchChange:    (query: string) => void;
  onClearFilters:    () => void;
}

// ─── Constants ───────────────────────────────────────────

const DEBOUNCE_MS = 400;

// ─── Component ───────────────────────────────────────────

export function TrafficSignsFilters({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  onClearFilters,
}: TrafficSignsFiltersProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync local state when parent resets
  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleSearchInput = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(value), DEBOUNCE_MS);
  };

  const hasActiveFilters = selectedCategory !== 'all' || search.length > 0;

  return (
    <div className="mb-8 space-y-6">

      {/* Search bar */}
      <div className="flex gap-3">
        <Input
          type="search"
          placeholder={t('traffic_signs.search_placeholder')}
          value={search}
          onChange={e => handleSearchInput(e.target.value)}
          className="max-w-md rounded-xl"
        />
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="gap-1.5 rounded-xl"
          >
            <X className="h-4 w-4" aria-hidden />
            {t('traffic_signs.clear_filters')}
          </Button>
        )}
      </div>

      {/* Category pills - single scrollable row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {categories.map(cat => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            onClick={() => onCategoryChange(cat.value)}
            className="rounded-full flex-shrink-0 text-sm"
            size="sm"
          >
            {cat.label}
            <span className="ml-2 rounded-full bg-background/20 px-1.5 py-0.5 text-xs font-black">
              {cat.count}
            </span>
          </Button>
        ))}
      </div>

    </div>
  );
}
