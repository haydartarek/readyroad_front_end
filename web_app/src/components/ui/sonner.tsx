'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

// ─── Constants ───────────────────────────────────────────

const TOAST_ICONS: ToasterProps['icons'] = {
  success: <CircleCheckIcon className="size-4" />,
  info:    <InfoIcon        className="size-4" />,
  warning: <TriangleAlertIcon className="size-4" />,
  error:   <OctagonXIcon    className="size-4" />,
  loading: <Loader2Icon     className="size-4 animate-spin" />,
};

const TOAST_STYLE: React.CSSProperties = {
  '--normal-bg':     'var(--popover)',
  '--normal-text':   'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
  '--border-radius': 'var(--radius)',
} as React.CSSProperties;

// ─── Component ───────────────────────────────────────────

function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={TOAST_ICONS}
      style={TOAST_STYLE}
      {...props}
    />
  );
}

export { Toaster };
