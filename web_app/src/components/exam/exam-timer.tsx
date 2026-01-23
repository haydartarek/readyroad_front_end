'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  expiresAt: Date;
  onTimeExpired: () => void;
}

export function ExamTimer({ expiresAt, onTimeExpired }: ExamTimerProps) {
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) {
      return 0;
    }

    return Math.floor(diff / 1000);
  }, [expiresAt]);

  const [timeRemaining, setTimeRemaining] = useState<number>(calculateTimeRemaining);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newRemaining = calculateTimeRemaining();
      setTimeRemaining(newRemaining);

      if (newRemaining <= 0 && !hasExpired) {
        setHasExpired(true);
        onTimeExpired();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeRemaining, hasExpired, onTimeExpired]);
  
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const getColorClass = () => {
    if (minutes < 1) return 'bg-red-500 text-white animate-pulse';
    if (minutes < 5) return 'bg-orange-500 text-white';
    return 'bg-green-500 text-white';
  };
  
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full px-4 py-2 font-mono text-lg font-bold transition-colors',
        getColorClass()
      )}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
