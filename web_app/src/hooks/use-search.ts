'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { apiClient } from '@/lib/api';
import type { SearchResult } from '@/components/layout/search-dropdown';

// ─── Types ───────────────────────────────────────────────

interface SearchResponse {
  query:   string;
  results: SearchResult[];
}

// ─── Constants ───────────────────────────────────────────

const DEBOUNCE_DELAY   = 300;
const MIN_QUERY_LENGTH = 2;
const CACHE_TTL        = 5 * 60 * 1000; // 5 minutes

// ─── Hook ────────────────────────────────────────────────

export function useSearch(language: string) {
  const [query,            setQuery]            = useState('');
  const [results,          setResults]          = useState<SearchResult[]>([]);
  const [isLoading,        setIsLoading]        = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isOpen,           setIsOpen]           = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef    = useRef<Map<string, SearchResult[]>>(new Map());

  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();

    if (!trimmed || trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const cacheKey = `${language}:${trimmed.toLowerCase()}`;
    const cached   = cacheRef.current.get(cacheKey);

    if (cached) {
      setResults(cached);
      setIsOpen(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      const response = await apiClient.get<SearchResponse>('/search', {
        q:    trimmed,
        lang: language,
      });

      const searchResults = response.data?.results ?? [];
      setResults(searchResults);

      // Cache with TTL
      cacheRef.current.set(cacheKey, searchResults);
      setTimeout(() => cacheRef.current.delete(cacheKey), CACHE_TTL);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setHighlightedIndex(0);
    clearDebounce();
    debounceRef.current = setTimeout(() => performSearch(value), DEBOUNCE_DELAY);
  }, [performSearch, clearDebounce]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(0);
    clearDebounce();
  }, [clearDebounce]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(0);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  }, [isOpen, results.length, handleClose]);

  // Cleanup debounce on unmount
  useEffect(() => () => clearDebounce(), [clearDebounce]);

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
