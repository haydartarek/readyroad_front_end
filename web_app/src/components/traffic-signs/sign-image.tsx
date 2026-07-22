"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FALLBACK_IMAGE, getSignImageUrl } from "@/lib/image-utils";

// ─── Types ───────────────────────────────────────────────

interface SignImageProps {
  src: string;
  alt: string;
  className?: string;
  preload?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────

function resolveImageUrl(src: string): string | null {
  if (!src || src === FALLBACK_IMAGE) return null;
  return getSignImageUrl(src);
}

// ─── Component ───────────────────────────────────────────

export function SignImage({
  src,
  alt,
  className = "object-contain",
  preload = false,
}: SignImageProps) {
  const [imgSrc, setImgSrc] = useState(() => resolveImageUrl(src));

  useEffect(() => {
    setImgSrc(resolveImageUrl(src));
  }, [src]);

  const sharedClass = `absolute inset-0 h-full w-full ${className}`;

  if (!imgSrc) {
    return <div className={`bg-muted ${sharedClass}`} aria-label={alt} />;
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      preload={preload}
      sizes="(max-width: 768px) 80vw, 320px"
      unoptimized
      className={sharedClass}
      onError={() => setImgSrc(null)}
    />
  );
}
