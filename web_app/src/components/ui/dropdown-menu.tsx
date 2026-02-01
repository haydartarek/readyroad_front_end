"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

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
          // Modern 2026 styling with brand colors and design system tokens
          "bg-white text-gray-900 border border-gray-200/80 rounded-2xl shadow-lg",
          // Smooth micro-interactions
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          // Positioning and sizing
          "z-50 min-w-[12rem] max-h-[calc(var(--radix-dropdown-menu-content-available-height)-16px)]",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          // Content overflow handling
          "overflow-x-hidden overflow-y-auto",
          // Modern padding for breathing room
          "p-2",
          // Backdrop blur for depth (modern 2026 effect)
          "backdrop-blur-sm",
          // Dark mode support (future-ready)
          "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // Base styles - modern and clean
        "relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-hidden select-none transition-all duration-150",
        // Text color
        "text-gray-700 dark:text-gray-200",
        // Hover state - modern with primary brand color
        "hover:bg-primary/5 hover:text-primary focus:bg-primary/8 focus:text-primary",
        // Active/pressed state for mobile
        "active:bg-primary/10 active:scale-[0.98]",
        // Focus ring for keyboard navigation (accessibility)
        "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1",
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed",
        // Inset for nested items
        "data-[inset]:pl-10",
        // Destructive variant
        "data-[variant=destructive]:text-red-600 dark:data-[variant=destructive]:text-red-400",
        "data-[variant=destructive]:hover:bg-red-50 data-[variant=destructive]:hover:text-red-700",
        "data-[variant=destructive]:focus:bg-red-50 data-[variant=destructive]:focus:text-red-700",
        "dark:data-[variant=destructive]:hover:bg-red-950/30 dark:data-[variant=destructive]:focus:bg-red-950/40",
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        "[&_svg:not([class*='text-'])]:text-gray-500 dark:[&_svg:not([class*='text-'])]:text-gray-400",
        "hover:[&_svg:not([class*='text-'])]:text-primary focus:[&_svg:not([class*='text-'])]:text-primary",
        "data-[variant=destructive]:[&_svg]:!text-red-600 dark:data-[variant=destructive]:[&_svg]:!text-red-400",
        className
      )}
      {...props}
    />
  )
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
      className={cn(
        "relative flex cursor-pointer items-center gap-3 rounded-xl py-2.5 pr-3 pl-10 text-sm font-medium outline-hidden select-none transition-all duration-150",
        "text-gray-700 dark:text-gray-200",
        "hover:bg-primary/5 hover:text-primary focus:bg-primary/8 focus:text-primary",
        "active:bg-primary/10 active:scale-[0.98]",
        "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
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
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-3 rounded-xl py-2.5 pr-3 pl-10 text-sm font-medium outline-hidden select-none transition-all duration-150",
        "text-gray-700 dark:text-gray-200",
        "hover:bg-primary/5 hover:text-primary focus:bg-primary/8 focus:text-primary",
        "active:bg-primary/10 active:scale-[0.98]",
        "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-3 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2.5 fill-primary text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400",
        "data-[inset]:pl-10",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        "bg-gray-200/60 dark:bg-gray-700/60 -mx-1 my-2 h-px",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-hidden select-none transition-all duration-150",
        "text-gray-700 dark:text-gray-200",
        "hover:bg-primary/5 hover:text-primary focus:bg-primary/8 focus:text-primary",
        "data-[state=open]:bg-primary/8 data-[state=open]:text-primary",
        "active:bg-primary/10 active:scale-[0.98]",
        "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1",
        "data-[inset]:pl-10",
        "[&_svg:not([class*='text-'])]:text-gray-500 dark:[&_svg:not([class*='text-'])]:text-gray-400",
        "hover:[&_svg:not([class*='text-'])]:text-primary focus:[&_svg:not([class*='text-'])]:text-primary",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4 rtl:rotate-180" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        // Modern 2026 styling matching main dropdown
        "bg-white text-gray-900 border border-gray-200/80 rounded-2xl shadow-lg",
        // Smooth micro-interactions
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        // Positioning and sizing
        "z-50 min-w-[12rem] origin-(--radix-dropdown-menu-content-transform-origin)",
        "overflow-hidden p-2",
        // Dark mode support
        "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
        className
      )}
      {...props}
    />
  )
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
}
