'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

// ─── Constants ───────────────────────────────────────────

const REDIRECT_DELAY_MS = 2500;
const TICK_MS           = 30;

// ─── Types ───────────────────────────────────────────────

interface LogoutModalProps {
  isOpen:          boolean;
  username:        string;
  title:           string;
  subtitle:        string;
  redirectingText: string;
  onRedirect:      () => void;
}

function LogoutModalContent({
  username,
  title,
  subtitle,
  redirectingText,
  onRedirect,
}: LogoutModalProps) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);

  useEffect(() => {
    const step = (TICK_MS / REDIRECT_DELAY_MS) * 100;
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        const next = p - step;
        if (next <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return 0;
        }
        return next;
      });
    }, TICK_MS);
    timeoutRef.current = setTimeout(onRedirect, REDIRECT_DELAY_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onRedirect]);

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label={`${title} ${username}`}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: 'authOverlayIn 0.3s ease both' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-3xl shadow-2xl"
        style={{
          animation: 'authModalIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both',
          boxShadow: '0 32px 80px -12px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {/* ── Dark navy gradient header ── */}
        <div
          className="relative flex flex-col items-center pt-9 pb-16 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(210 29% 30%), hsl(210 35% 20%) 50%, hsl(215 40% 14%))' }}
        >
          {/* Decorative blobs */}
          <span aria-hidden="true" className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
          <span aria-hidden="true" className="absolute -bottom-6 -right-8 w-32 h-32 rounded-full bg-black/20" />
          <span aria-hidden="true" className="absolute top-4 right-8 w-10 h-10 rounded-full bg-white/8" />

          {/* ReadyRoad wordmark */}
          <p className="relative z-10 text-xs font-bold tracking-[0.2em] uppercase mb-5 select-none"
             style={{ color: 'rgba(255,255,255,0.5)' }}>
            ReadyRoad
          </p>

          {/* Icon — overlaps header/body boundary */}
          <div className="relative z-10 mb-[-58px]">
            {/* Outer pulse ring (slower, subtler) */}
            <span
              aria-hidden="true"
              className="absolute inset-[-10px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)',
                animation: 'authPulse 2.4s ease-in-out 0.6s infinite',
              }}
            />
            {/* White circle container */}
            <div
              className="relative w-[104px] h-[104px] rounded-full bg-white flex items-center justify-center"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.30), 0 0 0 4px rgba(255,255,255,0.15)' }}
            >
              <svg
                viewBox="0 0 52 52"
                className="w-[56px] h-[56px]"
                aria-hidden="true"
                fill="none"
              >
                {/* Animated ring in secondary/navy */}
                <circle
                  cx="26" cy="26" r="22"
                  stroke="hsl(210 29% 40%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: '138',
                    strokeDashoffset: '138',
                    animation: 'authCircleDraw 0.55s ease 0.25s forwards',
                  }}
                />
                {/* Door frame — left bracket */}
                <path
                  d="M24 14H16a2 2 0 00-2 2v24a2 2 0 002 2h8"
                  stroke="hsl(13 76% 53%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: '60',
                    strokeDashoffset: '60',
                    animation: 'authCheckDraw 0.38s ease 0.65s forwards',
                  }}
                />
                {/* Exit arrow → */}
                <path
                  d="M22 26h16M32 21l6 5-6 5"
                  stroke="hsl(13 76% 53%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: '40',
                    strokeDashoffset: '40',
                    animation: 'authCheckDraw 0.32s ease 0.9s forwards',
                  }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ── White body ── */}
        <div className="bg-card text-center px-8 pt-[72px] pb-7">

          {/* Title line */}
          <p className="text-sm font-medium text-muted-foreground mb-1 tracking-wide">
            {title}
          </p>

          {/* Username */}
          <h2
            className="font-extrabold leading-tight mb-1"
            style={{
              fontSize: '2rem',
              background: 'linear-gradient(135deg, hsl(210 29% 28%), hsl(210 40% 40%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {username}
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-muted-foreground mt-2.5 mb-7">
            {subtitle}
          </p>

          {/* Divider */}
          <div className="h-px bg-border/60 mb-5" />

          {/* Progress */}
          <div className="space-y-2.5">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'hsl(var(--muted))' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, hsl(210 29% 35%), hsl(210 40% 50%), hsl(210 29% 30%))',
                  transition: `width ${TICK_MS}ms linear`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5">
              {/* Login door icon */}
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M10 3H6a1 1 0 00-1 1v8a1 1 0 001 1h4M7 8h6M10 6l3 2-3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {redirectingText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────

export function LogoutModal(props: LogoutModalProps) {
  if (!props.isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <LogoutModalContent {...props} />,
    document.body,
  );
}
