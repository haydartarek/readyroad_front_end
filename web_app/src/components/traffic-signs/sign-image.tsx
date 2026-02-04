'use client';

import { useState, useEffect } from 'react';
import { convertToPublicImageUrl, FALLBACK_IMAGE } from '@/lib/image-utils';

interface SignImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Convert asset path from backend to public URL
function convertToPublicUrl(src: string): string {
  if (!src) return FALLBACK_IMAGE;
  return convertToPublicImageUrl(src) || FALLBACK_IMAGE;
}

export function SignImage({ src, alt, className = 'object-contain' }: SignImageProps) {
  const [imgSrc, setImgSrc] = useState(() => convertToPublicUrl(src));
  const [mounted, setMounted] = useState(false);

  // Only update src when it changes, not on mount
  useEffect(() => {
    setImgSrc(convertToPublicUrl(src));
  }, [src]);

  // Separate effect for mounting flag
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a placeholder during SSR to avoid hydration issues
  if (!mounted) {
    return (
      <div
        className={`absolute inset-0 h-full w-full bg-gray-100 ${className}`}
        aria-label={alt}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${className}`}
      onError={() => setImgSrc(FALLBACK_IMAGE)}
    />
  );
}
