'use client';

import { useEffect, useState } from 'react';
import { apiClient, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

export interface HomeStats {
  examQuestionCount: number;
  trafficSignsCount: number;
  lessonsCount: number;
  categoriesCount: number;
  supportedLanguagesCount: number;
}

let cachedStats: HomeStats | null = null;
let pendingRequest: Promise<HomeStats> | null = null;

function loadHomeStats(): Promise<HomeStats> {
  if (cachedStats) {
    return Promise.resolve(cachedStats);
  }

  if (!pendingRequest) {
    pendingRequest = apiClient
      .get<HomeStats>(API_ENDPOINTS.HOME.STATS)
      .then((response) => {
        cachedStats = response.data;
        return response.data;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }

  return pendingRequest;
}

export function useHomeStats() {
  const [stats, setStats] = useState<HomeStats | null>(cachedStats);
  const [loading, setLoading] = useState(!cachedStats);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadHomeStats()
      .then((response) => {
        if (!cancelled) {
          setStats(response);
          setError(false);
        }
      })
      .catch((err) => {
        logApiError('[HomeStats] load', err);
        if (!cancelled) {
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, error };
}
