'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
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
  const { t, isRTL } = useLanguage();
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
    <div className="rounded-[1.75rem] border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isRTL ? 'right-4' : 'left-4'}`}
            />
            <Input
              type="search"
              placeholder={t('traffic_signs.search_placeholder')}
              value={search}
              onChange={e => handleSearchInput(e.target.value)}
              className={`h-12 rounded-full border-border/60 bg-card/80 text-base shadow-none ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="h-12 gap-2 rounded-full border-border/60 px-5"
            >
              <X className="h-4 w-4" aria-hidden />
              {t('traffic_signs.clear_filters')}
            </Button>
          )}
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.value;

            return (
              <Button
                key={cat.value}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onCategoryChange(cat.value)}
                className="h-11 flex-shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap"
                size="sm"
              >
                <span>{cat.label}</span>
                <span
                  className={`ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-black ${isSelected ? 'bg-primary-foreground/18 text-primary-foreground' : 'bg-muted text-foreground'}`}
                >
                  {cat.count}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
