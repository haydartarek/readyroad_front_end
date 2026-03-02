'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Shared Class Strings ────────────────────────────────

const ITEM_BASE = [
  'relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5',
  'text-sm font-medium text-foreground outline-hidden select-none',
  'transition-all duration-150',
  'hover:bg-primary/5 hover:text-primary',
  'focus:bg-primary/8 focus:text-primary',
  'active:bg-primary/10 active:scale-[0.98]',
  'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
] as const;

const INDICATOR_ITEM_BASE = [
  'relative flex cursor-pointer items-center gap-3 rounded-xl py-2.5 pr-3 pl-10',
  'text-sm font-medium text-foreground outline-hidden select-none',
  'transition-all duration-150',
  'hover:bg-primary/5 hover:text-primary',
  'focus:bg-primary/8 focus:text-primary',
  'active:bg-primary/10 active:scale-[0.98]',
  'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
] as const;

const CONTENT_BASE = [
  'z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-border',
  'bg-popover p-2 text-popover-foreground shadow-lg',
  'data-[state=open]:animate-in   data-[state=open]:fade-in-0   data-[state=open]:zoom-in-95',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
  'data-[side=bottom]:slide-in-from-top-2    data-[side=left]:slide-in-from-right-2',
  'data-[side=right]:slide-in-from-left-2   data-[side=top]:slide-in-from-bottom-2',
] as const;

// ─── Simple Wrappers ─────────────────────────────────────

function DropdownMenu(props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal(props: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger(props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuGroup(props: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuRadioGroup(props: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuSub(props: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

// ─── Content ─────────────────────────────────────────────

function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          ...CONTENT_BASE,
          'max-h-[calc(var(--radix-dropdown-menu-content-available-height)-16px)]',
          'origin-(--radix-dropdown-menu-content-transform-origin)',
          'overflow-x-hidden overflow-y-auto',
          // ⚠️ backdrop-blur removed: causes rendering artifacts on some browsers
          // and is not part of the base shadcn/ui design token system
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        ...CONTENT_BASE,
        'origin-(--radix-dropdown-menu-content-transform-origin)',
        className,
      )}
      {...props}
    />
  );
}

// ─── Items ───────────────────────────────────────────────

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        ...ITEM_BASE,
        'data-[inset]:pl-10',
        '[&_svg:not([class*="text-"])]:text-muted-foreground',
        'hover:[&_svg:not([class*="text-"])]:text-primary focus:[&_svg:not([class*="text-"])]:text-primary',
        // Destructive variant
        'data-[variant=destructive]:text-destructive',
        'data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:hover:text-destructive',
        'data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive',
        'data-[variant=destructive]:[&_svg]:text-destructive',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(...INDICATOR_ITEM_BASE, className)}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-3 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(...INDICATOR_ITEM_BASE, className)}
      {...props}
    >
      <span className="pointer-events-none absolute left-3 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2.5 fill-primary text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        ...ITEM_BASE,
        'data-[inset]:pl-10',
        'data-[state=open]:bg-primary/8 data-[state=open]:text-primary',
        '[&_svg:not([class*="text-"])]:text-muted-foreground',
        'hover:[&_svg:not([class*="text-"])]:text-primary focus:[&_svg:not([class*="text-"])]:text-primary',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4 rtl:rotate-180" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

// ─── Label / Separator / Shortcut ────────────────────────

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
        'data-[inset]:pl-10',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-2 h-px bg-border', className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
