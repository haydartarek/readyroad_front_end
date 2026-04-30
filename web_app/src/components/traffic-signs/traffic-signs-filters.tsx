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
    <div className="rounded-[1.2rem] border border-border/60 bg-background/80 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70 md:p-2.5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className={`pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground ${isRTL ? 'right-3.5' : 'left-3.5'}`}
            />
            <Input
              id="traffic-signs-search"
              name="traffic-signs-search"
              type="search"
              autoComplete="off"
              aria-label={t('traffic_signs.search_placeholder')}
              placeholder={t('traffic_signs.search_placeholder')}
              value={search}
              onChange={e => handleSearchInput(e.target.value)}
              className={`h-8 rounded-full border-border/60 bg-card/80 text-[11px] shadow-none md:h-9 md:text-xs ${isRTL ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'}`}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="h-8 gap-1 rounded-full border-border/60 px-3 text-[11px] md:h-9 md:text-xs"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              {t('traffic_signs.clear_filters')}
            </Button>
          )}
        </div>

        <div
          className="flex gap-1 overflow-x-auto md:flex-wrap md:overflow-visible"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.value;

            return (
              <Button
                key={cat.value}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onCategoryChange(cat.value)}
                className="h-7 flex-shrink-0 rounded-full px-2.5 text-[10px] font-semibold whitespace-nowrap md:h-8 md:px-3 md:text-[11px]"
                size="sm"
              >
                <span>{cat.label}</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[8px] font-black md:px-1.5 md:text-[9px] ${isSelected ? 'bg-primary-foreground/18 text-primary-foreground' : 'bg-muted text-foreground'}`}
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
