'use client';

import { MapPin, BookOpen, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

export interface SearchResult {
  type:        string;
  id:          string;
  title:       string;
  description: string;
  href:        string;
}

type ResultType = 'traffic_sign' | 'lesson' | 'question';

// ─── Constants ───────────────────────────────────────────

const TYPE_ICON: Record<ResultType, React.ElementType> = {
  traffic_sign: MapPin,
  lesson:       BookOpen,
  question:     FileText,
};

const TYPE_BADGE_COLOR: Record<ResultType, string> = {
  traffic_sign: 'bg-green-100  text-green-700',
  lesson:       'bg-purple-100 text-purple-700',
  question:     'bg-blue-100   text-blue-700',
};

const TYPE_I18N_KEY: Record<ResultType, string> = {
  traffic_sign: 'search.sign',
  lesson:       'search.lesson',
  question:     'search.question',
};

// ─── Helpers ─────────────────────────────────────────────

function isKnownType(type: string): type is ResultType {
  return type in TYPE_ICON;
}

// ─── Component ───────────────────────────────────────────

export function SearchDropdown({
  results,
  isLoading,
  query,
  highlightedIndex,
  onSelect,
}: {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  highlightedIndex: number;
  onSelect: (result: SearchResult) => void;
}) {
  const { t, isRTL } = useLanguage();

  if (!query) return null;

  return (
    <div className="absolute top-full z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm">{t('search.loading')}</p>
        </div>
      ) : results.length === 0 ? (
        /* Empty */
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">{t('search.noResults')}</p>
        </div>
      ) : (
        /* Results */
        <div className="py-2">
          {results.map((result, index) => {
            const knownType = isKnownType(result.type) ? result.type : null;

            const Icon     = knownType ? TYPE_ICON[knownType]        : FileText;
            const badgeClr = knownType ? TYPE_BADGE_COLOR[knownType] : 'bg-muted text-muted-foreground';
            const badgeLbl = knownType ? t(TYPE_I18N_KEY[knownType]) : result.type;

            return (
              <button
                key={result.id}
                onClick={() => onSelect(result)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted',
                  highlightedIndex === index && 'bg-primary/10',
                )}
              >
                {/* Type icon */}
                <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', badgeClr)}>
                      {badgeLbl}
                    </span>
                    {result.type === 'traffic_sign' && (
                      <span className="font-mono text-xs text-muted-foreground">{result.id}</span>
                    )}
                  </div>
                  <p className="truncate font-semibold text-foreground">{result.title}</p>
                  {result.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{result.description}</p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight
                  className={cn('h-4 w-4 flex-shrink-0 text-muted-foreground', isRTL && 'rotate-180')}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
