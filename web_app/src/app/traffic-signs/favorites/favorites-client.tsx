"use client";

import { useEffect, useState } from "react";
import Link from "@/components/localized-link";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import type { TrafficSign } from "@/lib/types";
import { TrafficSignsGrid } from "@/components/traffic-signs/traffic-signs-grid";
import { PageHeroSurface, PageHeroTitle, PageHeroDescription } from "@/components/ui/page-surface";
import { Button } from "@/components/ui/button";
import {
  favoriteCopy, favoriteLocale, listRoadSignFavorites, validFavoriteId,
} from "@/lib/road-sign-favorites";

type Loaded = {
  ownerId: number;
  signs: TrafficSign[];
  error: boolean;
};

export default function FavoritesClient() {
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const labels = favoriteCopy[favoriteLocale(language)];
  const ownerId = user?.userId ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (authLoading || !validFavoriteId(ownerId)) return;
    let active = true;
    Promise.all([
      listRoadSignFavorites(ownerId),
      apiClient.get<TrafficSign[] | { signs: TrafficSign[] }>(
        API_ENDPOINTS.TRAFFIC_SIGNS.LIST,
        undefined,
        { skipAuthRedirect: true },
      ),
    ])
      .then(([ids, response]) => {
        const allSigns = Array.isArray(response.data)
          ? response.data
          : response.data.signs ?? [];
        const favorites = new Set(ids);
        // IDs are server-side numeric primary keys, never traffic sign codes.
        const signs = allSigns.filter(
          (sign) => validFavoriteId(sign.id) && favorites.has(sign.id),
        );
        if (ids.length > 0 && signs.length === 0) {
          throw new Error("Favorite road-sign IDs were not found in public catalog");
        }
        if (active) setLoaded({ ownerId, signs, error: false });
      })
      .catch(() => {
        if (active) setLoaded({ ownerId, signs: [], error: true });
      });
    return () => { active = false; };
  }, [authLoading, ownerId, retry]);

  const isCurrent = loaded?.ownerId === ownerId;
  const isPending = !isCurrent;
  const error = isCurrent && loaded?.error === true;
  const signs = isCurrent ? loaded?.signs ?? [] : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35">
      <div className="container mx-auto space-y-5 px-4 py-8">
        <PageHeroSurface contentClassName="space-y-3">
          <PageHeroTitle>{labels.collection}</PageHeroTitle>
          <PageHeroDescription>{labels.collectionDescription}</PageHeroDescription>
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href="/traffic-signs">{labels.back}</Link>
          </Button>
        </PageHeroSurface>
        {authLoading || (isPending && validFavoriteId(ownerId)) ? (
          <p role="status" className="text-sm text-muted-foreground">{labels.checking}</p>
        ) : !validFavoriteId(ownerId) ? (
          <Button asChild><Link href="/login">{labels.login}</Link></Button>
        ) : error ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-destructive">{labels.error}</p>
            <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>{labels.retry}</Button>
          </div>
        ) : signs.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            <Heart aria-hidden="true" className="mx-auto mb-3 h-6 w-6" />
            <p>{labels.empty}</p>
          </div>
        ) : (
          <TrafficSignsGrid signs={signs} />
        )}
      </div>
    </main>
  );
}
