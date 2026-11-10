"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import Link from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import {
  addRoadSignFavorite,
  favoriteCopy,
  favoriteLocale,
  listRoadSignFavorites,
  removeRoadSignFavorite,
  validFavoriteId,
} from "@/lib/road-sign-favorites";

interface FavoriteSnapshot {
  ownerId: number;
  ids: number[];
  error: boolean;
}

/** No optimistic writes: state is confirmed by a subsequent backend GET. */
export function RoadSignFavoriteButton({ signId }: { signId?: number | null }) {
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const copy = favoriteCopy[favoriteLocale(language)];
  const ownerId = user?.userId ?? null;
  const ownerRef = useRef(ownerId);

  useEffect(() => {
    ownerRef.current = ownerId;
  }, [ownerId]);

  const [snapshot, setSnapshot] = useState<FavoriteSnapshot | null>(null);
  const [busyOwnerId, setBusyOwnerId] = useState<number | null>(null);
  const [actionErrorOwnerId, setActionErrorOwnerId] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (authLoading || !validFavoriteId(ownerId)) return;
    let active = true;
    listRoadSignFavorites(ownerId)
      .then((ids) => {
        if (active && ownerRef.current === ownerId) {
          setSnapshot({ ownerId, ids, error: false });
        }
      })
      .catch(() => {
        if (active && ownerRef.current === ownerId) {
          setSnapshot({ ownerId, ids: [], error: true });
        }
      });
    return () => { active = false; };
  }, [authLoading, ownerId, retry]);

  if (authLoading) return null;
  if (!validFavoriteId(ownerId)) {
    return (
      <Button variant="outline" className="h-10 rounded-xl" asChild>
        <Link href="/login"><Heart className="me-2 h-4 w-4" />{copy.login}</Link>
      </Button>
    );
  }
  if (!validFavoriteId(signId)) {
    return <p className="text-xs text-muted-foreground">{copy.unavailable}</p>;
  }

  const isCurrent = snapshot?.ownerId === ownerId;
  const isReady = isCurrent && snapshot?.error === false;
  const selected = isReady && snapshot?.ids.includes(signId) === true;
  const isWorking = busyOwnerId === ownerId;

  const toggle = async () => {
    if (!validFavoriteId(signId) || !validFavoriteId(ownerId)
        || !isReady || isWorking) return;
    const requestOwner = ownerId;
    setBusyOwnerId(requestOwner);
    setActionErrorOwnerId(null);
    try {
      if (selected) {
        await removeRoadSignFavorite(requestOwner, signId);
      } else {
        await addRoadSignFavorite(requestOwner, signId);
      }
      // Confirm the final server state rather than assuming a successful write.
      const ids = await listRoadSignFavorites(requestOwner);
      if (ownerRef.current === requestOwner) {
        setSnapshot({ ownerId: requestOwner, ids, error: false });
      }
    } catch {
      if (ownerRef.current === requestOwner) setActionErrorOwnerId(requestOwner);
    } finally {
      setBusyOwnerId((current) => current === requestOwner ? null : current);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-xl"
        onClick={toggle}
        aria-pressed={Boolean(selected)}
        disabled={!isReady || isWorking}
      >
        <Heart className={`me-2 h-4 w-4 ${selected ? "fill-current text-primary" : ""}`} />
        {!isReady ? copy.checking : selected ? copy.remove : copy.add}
      </Button>
      {(actionErrorOwnerId === ownerId || (isCurrent && snapshot?.error)) && (
        <div className="flex flex-wrap items-center gap-2">
          <p role="alert" className="text-xs text-destructive">{copy.error}</p>
          {isCurrent && snapshot?.error ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setRetry((v) => v + 1)}>
              {copy.retry}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
