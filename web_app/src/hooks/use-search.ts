'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { SearchResult } from '@/components/layout/search-dropdown';

const DEBOUNCE_DELAY = 300;
const MIN_QUERY_LENGTH = 2;

interface SearchResponse {
    query: string;
    results: SearchResult[];
}

export function useSearch(language: string) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const cacheRef = useRef<Map<string, SearchResult[]>>(new Map());

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < MIN_QUERY_LENGTH) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        // Check cache first
        const cacheKey = `${language}:${searchQuery.toLowerCase()}`;
        if (cacheRef.current.has(cacheKey)) {
            setResults(cacheRef.current.get(cacheKey)!);
            setIsOpen(true);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setIsOpen(true);

        try {
            const response = await apiClient.get<SearchResponse>('/search', {
                q: searchQuery,
                lang: language,
            });

            // Backend returns SearchResponse with query and results array
            const searchResults = response.data?.results || [];
            setResults(searchResults);

            // Cache results for 5 minutes
            cacheRef.current.set(cacheKey, searchResults);
            setTimeout(() => cacheRef.current.delete(cacheKey), 5 * 60 * 1000);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [language]);

    const handleQueryChange = useCallback((value: string) => {
        setQuery(value);
        setHighlightedIndex(0);

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Debounce search
        debounceTimerRef.current = setTimeout(() => {
            performSearch(value);
        }, DEBOUNCE_DELAY);
    }, [performSearch]);

    const handleClear = useCallback(() => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
        setHighlightedIndex(0);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setHighlightedIndex(0);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < results.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : results.length - 1
                );
                break;
            case 'Escape':
                e.preventDefault();
                handleClose();
                break;
        }
    }, [isOpen, results.length, handleClose]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        query,
        results,
        isLoading,
        isOpen,
        highlightedIndex,
        handleQueryChange,
        handleClear,
        handleClose,
        handleKeyDown,
    };
}
