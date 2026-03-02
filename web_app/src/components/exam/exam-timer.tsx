'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface ExamTimerProps {
  expiresAt: Date;
  onTimeExpired: () => void;
}

// ─── Helpers ─────────────────────────────────────────────

function getTimerStyle(minutes: number): string {
  if (minutes <  1) return 'bg-red-500    text-white animate-pulse';
  if (minutes <  5) return 'bg-orange-500 text-white';
  return                    'bg-green-500  text-white';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// ─── Component ───────────────────────────────────────────

export function ExamTimer({ expiresAt, onTimeExpired }: ExamTimerProps) {
  const expiredRef = useRef(false);

  const getRemainingSeconds = useCallback((): number => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff <= 0 ? 0 : Math.floor(diff / 1000);
  }, [expiresAt]);

  const [timeRemaining, setTimeRemaining] = useState<number>(getRemainingSeconds);

  useEffect(() => {
    expiredRef.current = false;

    const interval = setInterval(() => {
      const remaining = getRemainingSeconds();
      setTimeRemaining(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onTimeExpired();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getRemainingSeconds, onTimeExpired]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-full px-4 py-2',
      'font-mono text-lg font-black transition-colors',
      getTimerStyle(minutes),
    )}>
      <Timer className="h-5 w-5 flex-shrink-0" />
      <span>{pad(minutes)}:{pad(seconds)}</span>
    </div>
  );
}
