'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

// ─── Constants ───────────────────────────────────────────

const REDIRECT_DELAY_MS = 3200;
const TICK_MS           = 30;

// ─── Types ───────────────────────────────────────────────

interface AuthSuccessModalProps {
  isOpen:          boolean;
  username:        string;
  title:           string;
  subtitle:        string;
  redirectingText: string;
  onRedirect:      () => void;
}

function AuthSuccessModalContent({
  username,
  title,
  subtitle,
  redirectingText,
  onRedirect,
}: AuthSuccessModalProps) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval>  | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout>   | null>(null);

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
          boxShadow: '0 32px 80px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >

        {/* ── Gradient hero header ── */}
        <div
          className="relative flex flex-col items-center pt-9 pb-16 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(13 76% 53%), hsl(13 76% 45%) 40%, hsl(25 95% 50%))' }}
        >
          {/* Decorative blobs */}
          <span aria-hidden="true" className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
          <span aria-hidden="true" className="absolute -bottom-6 -right-8 w-32 h-32 rounded-full bg-black/10" />
          <span aria-hidden="true" className="absolute top-4 right-8 w-10 h-10 rounded-full bg-white/10" />

          {/* ReadyRoad wordmark */}
          <p className="relative z-10 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-5 select-none">
            ReadyRoad
          </p>

          {/* Pulsing ring + SVG checkmark — overlaps header/body boundary */}
          <div className="relative z-10 mb-[-58px]">
            {/* Outer pulse ring */}
            <span
              aria-hidden="true"
              className="absolute inset-[-10px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
                animation: 'authPulse 2s ease-in-out 0.8s infinite',
              }}
            />
            {/* White circle container */}
            <div
              className="relative w-[104px] h-[104px] rounded-full bg-white flex items-center justify-center"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 0 0 4px rgba(255,255,255,0.25)' }}
            >
              <svg viewBox="0 0 52 52" className="w-[58px] h-[58px]" aria-hidden="true" fill="none">
                {/* Ring */}
                <circle
                  cx="26" cy="26" r="22"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: '138',
                    strokeDashoffset: '138',
                    animation: 'authCircleDraw 0.55s ease 0.25s forwards',
                  }}
                />
                {/* Check */}
                <path
                  d="M15 26.5l7.5 7.5 14.5-15"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: '44',
                    strokeDashoffset: '44',
                    animation: 'authCheckDraw 0.3s ease 0.72s forwards',
                  }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ── White body ── */}
        <div className="bg-card text-center px-8 pt-[72px] pb-7">

          {/* Title */}
          <p className="text-sm font-medium text-muted-foreground mb-1 tracking-wide">
            {title}
          </p>
          <h2
            className="font-extrabold leading-tight mb-1"
            style={{
              fontSize: '2rem',
              background: 'linear-gradient(135deg, hsl(13 76% 48%), hsl(25 95% 50%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {username}
          </h2>
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
                  background: 'linear-gradient(90deg, hsl(13 76% 53%), hsl(25 95% 50%), #10b981)',
                  transition: `width ${TICK_MS}ms linear`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M2 10h1.5a1 1 0 001-1V7a1 1 0 011-1h5a1 1 0 011 1v2a1 1 0 001 1H14M4.5 10v1.5M11.5 10v1.5M1 7.5l1-3h12l1 3" strokeLinecap="round" strokeLinejoin="round" />
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

export function AuthSuccessModal(props: AuthSuccessModalProps) {
  if (!props.isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AuthSuccessModalContent {...props} />,
    document.body,
  );
}

