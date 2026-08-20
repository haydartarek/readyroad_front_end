"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// ─── Constants ───────────────────────────────────────────

const REDIRECT_DELAY_MS = 3000;
const TICK_MS = 30;

// ─── Types ───────────────────────────────────────────────

interface DeleteAccountModalProps {
  isOpen: boolean;
  username: string;
  title: string;
  subtitle: string;
  redirectingText: string;
  onRedirect: () => void;
}

function DeleteAccountModalContent({
  username,
  title,
  subtitle,
  redirectingText,
  onRedirect,
}: DeleteAccountModalProps) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const step = (TICK_MS / REDIRECT_DELAY_MS) * 100;
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
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
    <DialogContent
      showCloseButton={false}
      overlayClassName="z-[9998] bg-black/60 backdrop-blur-md"
      className="z-[9999] max-w-[400px] border-0 bg-transparent p-0 shadow-none"
      onEscapeKeyDown={(event) => event.preventDefault()}
      onPointerDownOutside={(event) => event.preventDefault()}
    >
      <DialogTitle className="sr-only">
        {title} {username}
      </DialogTitle>
      <DialogDescription className="sr-only">{subtitle}</DialogDescription>

      {/* Card */}
      <div
        className="auth-redirect-animation relative z-10 w-full max-w-[400px] overflow-hidden rounded-3xl shadow-2xl"
        style={{
          animation: prefersReducedMotion
            ? "none"
            : "authModalIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both",
          boxShadow:
            "0 32px 80px -12px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* ── Destructive dark header ── */}
        <div
          className="relative flex flex-col items-center pt-9 pb-16 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(0 60% 28%), hsl(0 55% 20%) 50%, hsl(0 50% 14%))",
          }}
        >
          {/* Decorative blobs */}
          <span
            aria-hidden="true"
            className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-6 -right-8 w-32 h-32 rounded-full bg-black/20"
          />
          <span
            aria-hidden="true"
            className="absolute top-4 right-8 w-10 h-10 rounded-full bg-white/8"
          />

          {/* RijVia wordmark */}
          <p
            className="relative z-10 text-xs font-bold tracking-[0.2em] uppercase mb-5 select-none"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            RijVia
          </p>

          {/* Icon — overlaps header/body boundary */}
          <div className="relative z-10 mb-[-58px]">
            {/* Outer pulse ring */}
            <span
              aria-hidden="true"
              className="auth-redirect-animation absolute inset-[-10px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)",
                animation: prefersReducedMotion
                  ? "none"
                  : "authPulse 2.4s ease-in-out 0.6s infinite",
              }}
            />
            {/* White circle container */}
            <div
              className="relative w-[104px] h-[104px] rounded-full bg-white flex items-center justify-center"
              style={{
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.30), 0 0 0 4px rgba(255,255,255,0.15)",
              }}
            >
              <svg
                viewBox="0 0 52 52"
                className="w-[56px] h-[56px]"
                aria-hidden="true"
                fill="none"
              >
                {/* Animated ring — destructive red */}
                <circle
                  cx="26"
                  cy="26"
                  r="22"
                  stroke="hsl(0 72% 51%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: "138",
                    strokeDashoffset: "138",
                    animation: prefersReducedMotion
                      ? "none"
                      : "authCircleDraw 0.55s ease 0.25s forwards",
                  }}
                  className="auth-redirect-animation"
                />
                {/* Trash bin lid */}
                <path
                  d="M16 18h20M22 18V15a1 1 0 011-1h6a1 1 0 011 1v3"
                  stroke="hsl(0 72% 51%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: "36",
                    strokeDashoffset: "36",
                    animation: prefersReducedMotion
                      ? "none"
                      : "authCheckDraw 0.35s ease 0.65s forwards",
                  }}
                  className="auth-redirect-animation"
                />
                {/* Trash bin body */}
                <path
                  d="M18 20l1.5 16a1 1 0 001 .9h11a1 1 0 001-.9L34 20"
                  stroke="hsl(0 72% 51%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: "54",
                    strokeDashoffset: "54",
                    animation: prefersReducedMotion
                      ? "none"
                      : "authCheckDraw 0.38s ease 0.88s forwards",
                  }}
                  className="auth-redirect-animation"
                />
                {/* Inner lines */}
                <path
                  d="M26 23v11M22 23l.5 11M30 23l-.5 11"
                  stroke="hsl(0 72% 51%)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: "48",
                    strokeDashoffset: "48",
                    animation: prefersReducedMotion
                      ? "none"
                      : "authCheckDraw 0.3s ease 1.1s forwards",
                  }}
                  className="auth-redirect-animation"
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
              fontSize: "2rem",
              background:
                "linear-gradient(135deg, hsl(0 60% 35%), hsl(0 72% 51%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
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

          {/* Progress bar */}
          <div className="space-y-2.5">
            <div
              role="progressbar"
              aria-label={redirectingText}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "hsl(var(--muted))" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, hsl(0 72% 40%), hsl(0 72% 56%), hsl(0 60% 42%))",
                  transition: prefersReducedMotion
                    ? "none"
                    : `width ${TICK_MS}ms linear`,
                }}
              />
            </div>
            <p
              aria-live="polite"
              className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5"
            >
              {/* Login arrow icon */}
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  d="M10 3H6a1 1 0 00-1 1v8a1 1 0 001 1h4M7 8h6M10 6l3 2-3 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {redirectingText}
            </p>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Component ───────────────────────────────────────────

export function DeleteAccountModal(props: DeleteAccountModalProps) {
  return (
    <Dialog open={props.isOpen} onOpenChange={() => {}}>
      {props.isOpen ? <DeleteAccountModalContent {...props} /> : null}
    </Dialog>
  );
}
