'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Simple Re-exports ───────────────────────────────────

const Select      = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

// ─── Trigger ─────────────────────────────────────────────

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        'flex h-11 w-full items-center justify-between rounded-2xl',
        'border border-border/70 bg-background/85 px-4 py-2 text-sm font-semibold text-foreground shadow-sm',
        'data-[placeholder]:text-muted-foreground placeholder:text-muted-foreground',
        'ring-offset-background transition-[color,box-shadow,border-color] outline-none',
        'focus:border-primary/20 focus:ring-4 focus:ring-primary/12',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        {/* ✅ lucide-react — موحد مع باقي المشروع، بدلاً من inline SVG */}
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

// ─── Content ─────────────────────────────────────────────

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          'relative z-50 min-w-[10rem] overflow-hidden',
          'rounded-[1.45rem] border border-border/60 bg-gradient-to-br from-background/98 via-background/94 to-primary/[0.03] text-popover-foreground',
          'shadow-[0_24px_60px_-32px_rgba(15,23,42,0.34)] ring-1 ring-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80',
          'data-[state=open]:animate-in   data-[state=open]:fade-in-0   data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2    data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2   data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' && [
            'data-[side=bottom]:translate-y-1',
            'data-[side=left]:-translate-x-1',
            'data-[side=right]:translate-x-1',
            'data-[side=top]:-translate-y-1',
          ],
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            'p-2',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

// ─── Label ───────────────────────────────────────────────

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        'px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

// ─── Item ────────────────────────────────────────────────

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default select-none items-center gap-3',
        'rounded-2xl border border-transparent py-3 pl-9 pr-3.5 text-sm font-semibold text-foreground/85 outline-none transition-all duration-200',
        'focus:border-primary/12 focus:bg-primary/[0.09] focus:text-foreground',
        'data-[state=checked]:border-primary/10 data-[state=checked]:bg-primary/[0.06] data-[state=checked]:text-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

// ─── Separator ───────────────────────────────────────────

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('mx-1 my-2 h-px bg-border/60', className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
