'use client';

import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { FileText, MapPin, BookOpen, ChevronRight } from 'lucide-react';

export interface SearchResult {
    type: string;           // "traffic_sign", "lesson", "question"
    id: string;             // Entity ID
    title: string;          // Main title in requested language
    description: string;    // Brief description
    href: string;           // Frontend route
}

interface SearchDropdownProps {
    results: SearchResult[];
    isLoading: boolean;
    query: string;
    highlightedIndex: number;
    onSelect: (result: SearchResult) => void;
}

export function SearchDropdown({
    results,
    isLoading,
    query,
    highlightedIndex,
    onSelect,
}: SearchDropdownProps) {
    const { t, isRTL } = useLanguage();

    const getIcon = (type: string) => {
        switch (type) {
            case 'traffic_sign':
                return <MapPin className="h-4 w-4" />;
            case 'lesson':
                return <BookOpen className="h-4 w-4" />;
            case 'question':
                return <FileText className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            traffic_sign: 'bg-green-100 text-green-700',
            lesson: 'bg-purple-100 text-purple-700',
            question: 'bg-blue-100 text-blue-700',
        };

        const labels: Record<string, string> = {
            traffic_sign: t('search.sign'),
            lesson: t('search.lesson'),
            question: t('search.question'),
        };

        const color = colors[type] || 'bg-muted text-muted-foreground';
        const label = labels[type] || type;

        return (
            <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium', color)}>
                {label}
            </span>
        );
    };

    if (!query) return null;

    return (
        <div className="absolute top-full mt-2 w-full bg-popover rounded-lg shadow-lg border border-border max-h-96 overflow-y-auto z-50">
            {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-sm">{t('search.loading')}</p>
                </div>
            ) : results.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">{t('search.noResults')}</p>
                </div>
            ) : (
                <div className="py-2">
                    {results.map((result, index) => (
                        <button
                            key={result.id}
                            onClick={() => onSelect(result)}
                            className={cn(
                                'w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left',
                                highlightedIndex === index && 'bg-primary/10'
                            )}
                        >
                            <div className="flex-shrink-0 text-muted-foreground">
                                {getIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    {getTypeBadge(result.type)}
                                    {result.id && result.type === 'traffic_sign' && (
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {result.id}
                                        </span>
                                    )}
                                </div>
                                <p className="font-medium text-foreground truncate">
                                    {result.title}
                                </p>
                                {result.description && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {result.description}
                                    </p>
                                )}
                            </div>
                            <ChevronRight className={cn(
                                'h-4 w-4 text-muted-foreground flex-shrink-0',
                                isRTL && 'rotate-180'
                            )} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
