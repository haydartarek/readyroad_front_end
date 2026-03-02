import * as React from 'react';
import { cn } from '@/lib/utils';

// ─── Component ───────────────────────────────────────────

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Layout & sizing
        'h-9 w-full min-w-0 rounded-md border px-3 py-1',
        // Colors & background
        'border-input bg-transparent dark:bg-input/30',
        // Typography
        'text-base md:text-sm',
        // Placeholder & selection
        'placeholder:text-muted-foreground',
        'selection:bg-primary selection:text-primary-foreground',
        // File input
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        // Misc
        'shadow-xs outline-none transition-[color,box-shadow]',
        // Disabled
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        // Focus
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        // Invalid
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
