'use client';

import { useState, useEffect } from 'react';

interface SignImageProps {
  src: string;
  alt: string;
  className?: string;
}

const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaWduIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

// Convert asset path from backend to public URL
function convertToPublicUrl(src: string): string {
  if (!src) return FALLBACK_IMAGE;

  // If already a public URL, return as-is
  if (src.startsWith('/images/') || src.startsWith('http')) {
    return src;
  }

  // Convert from "assets/traffic_signs/..." to "/images/signs/..."
  if (src.startsWith('assets/traffic_signs/')) {
    return src.replace('assets/traffic_signs/', '/images/signs/');
  }

  return src;
}

export function SignImage({ src, alt, className = 'object-contain' }: SignImageProps) {
  const [imgSrc, setImgSrc] = useState(() => convertToPublicUrl(src));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setImgSrc(convertToPublicUrl(src));
  }, [src]);

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
