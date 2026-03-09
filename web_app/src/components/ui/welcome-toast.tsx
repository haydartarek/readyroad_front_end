'use client';

import { X, Car } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────

interface WelcomeToastProps {
  toastId:   string | number;
  firstName: string;
  subtitle:  string;
}

// ─── Component ───────────────────────────────────────────

export function WelcomeToastContent({ toastId, firstName, subtitle }: WelcomeToastProps) {
  const initial = firstName?.[0]?.toUpperCase() ?? 'U';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ animation: 'welcomeSlideIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      className="
        relative flex items-center gap-3.5
        w-[340px] bg-card border border-border/60
        rounded-2xl shadow-2xl shadow-black/10
        px-4 py-3.5 overflow-hidden
      "
    >
      {/* Primary accent bar — left edge */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-l-2xl"
      />

      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="
            w-11 h-11 rounded-full
            bg-primary/10 border-2 border-primary/25
            flex items-center justify-center
          "
        >
          <span className="text-primary font-bold text-base leading-none select-none">
            {initial}
          </span>
        </div>
        {/* Online dot */}
        <span
          aria-hidden="true"
          className="
            absolute bottom-0 right-0
            w-3 h-3 bg-emerald-500
            border-2 border-card rounded-full
          "
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pl-0.5">
        <p className="text-sm font-semibold text-foreground leading-tight truncate">
          Welcome back,{' '}
          <span className="text-primary">{firstName}</span>!
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Car className="w-3 h-3 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground leading-snug truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => toast.dismiss(toastId)}
        aria-label="Dismiss notification"
        className="
          shrink-0 ml-1 p-1 rounded-md
          text-muted-foreground/50 hover:text-foreground
          hover:bg-muted/50 transition-colors
        "
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
