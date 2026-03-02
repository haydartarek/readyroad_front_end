'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface TrafficSignImageProps {
  src:        string;
  alt:        string;
  className?: string;
  width?:     number;
  height?:    number;
  priority?:  boolean;
}

// ─── Helpers ─────────────────────────────────────────────

function buildFallbacks(src: string): string[] {
  return [
    src.replace(/-v\d+/, ''),
    src.replace(/_\d+/, ''),
    src.replace(/delineation_signs/, 'bicycle_signs'),
    src.replace(/additional_signs/, 'bicycle_signs'),
    '/images/signs/placeholder.png',
  ].filter(alt => alt !== src);
}

function normalizeSrc(src: string): string {
  const stripped  = src.replace(/^\/+/, '').replace(/^images\//, '');
  const parts     = stripped.split('/');
  const filename  = parts.at(-1) ?? '';
  const category  = parts.at(-2) ?? 'signs';
  return `/images/signs/${category}/${filename}`;
}

// ─── Placeholder ─────────────────────────────────────────

function SignPlaceholder({
  alt,
  width,
  height,
  className,
}: Pick<TrafficSignImageProps, 'alt' | 'width' | 'height' | 'className'>) {
  return (
    <div
      className={cn('flex items-center justify-center rounded-lg bg-muted', className)}
      style={{ width, height }}
      role="img"
      aria-label={alt}
    >
      <div className="flex flex-col items-center gap-2 p-4">
        <ImageIcon className="size-12 text-muted-foreground" />
        <p className="text-center text-xs text-muted-foreground">{alt}</p>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────

export function TrafficSignImage({
  src,
  alt,
  className,
  width    = 200,
  height   = 200,
  priority = false,
}: TrafficSignImageProps) {
  const [currentSrc, setCurrentSrc] = useState(() => normalizeSrc(src));
  const [fallbacks,  setFallbacks]  = useState(() => buildFallbacks(src));

  const handleError = useCallback(() => {
    if (fallbacks.length === 0) return;
    const [next, ...rest] = fallbacks;
    setCurrentSrc(next);
    setFallbacks(rest);
  }, [fallbacks]);

  // All fallbacks exhausted
  if (fallbacks.length === 0 && currentSrc === '/images/signs/placeholder.png') {
    return (
      <SignPlaceholder
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={handleError}
      unoptimized
    />
  );
}
