import Image from "next/image";
import Link from "@/components/localized-link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatusAction =
  | {
      label: string;
      href: string;
      onClick?: never;
    }
  | {
      label: string;
      href?: never;
      onClick: () => void;
    };

export function StatusScreen({
  title,
  description,
  icon,
  dir = "ltr",
  primaryAction,
  secondaryAction,
  brandCaption,
  asideNote,
  fullscreen = true,
  footer,
}: {
  badge?: string;
  title: string;
  description: string;
  icon: ReactNode;
  dir?: "ltr" | "rtl";
  primaryAction: StatusAction;
  secondaryAction?: StatusAction;
  brandCaption?: string;
  asideNote?: string;
  fullscreen?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-[radial-gradient(circle_at_top_right,rgba(223,88,48,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(28,48,67,0.12),transparent_28%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.35)_100%)]",
        fullscreen ? "min-h-screen" : "min-h-[calc(100vh-74px)]",
      )}
      dir={dir}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8",
          fullscreen ? "min-h-screen" : "min-h-[calc(100vh-74px)]",
        )}
      >
        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="hidden min-w-0 rounded-[2.5rem] border border-border/60 bg-card/60 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur xl:flex xl:flex-col xl:justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/icons/icon-192.png"
                  alt=""
                  aria-hidden="true"
                  width={52}
                  height={52}
                  className="rounded-2xl ring-1 ring-border/60"
                  priority
                />
                <div>
                  <p className="text-[1.7rem] font-black tracking-tight">
                    <span className="text-primary">Rij</span>
                    <span className="text-foreground">Via</span>
                  </p>
                  {brandCaption ? (
                    <p className="text-sm font-medium text-muted-foreground">
                      {brandCaption}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border/60 bg-background/80 p-6 shadow-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {icon}
                </div>
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {title}
                </h2>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>

            {asideNote ? (
              <div className="rounded-[1.75rem] border border-primary/15 bg-primary/5 px-5 py-4 text-sm font-medium leading-6 text-muted-foreground">
                {asideNote}
              </div>
            ) : null}
          </section>

          <section className="flex min-w-0 items-center">
            <div className="min-w-0 w-full rounded-[2.25rem] border border-border/60 bg-card/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8">
              <div className="mb-8 flex items-center justify-center gap-3 xl:hidden">
                <Image
                  src="/icons/icon-192.png"
                  alt=""
                  aria-hidden="true"
                  width={48}
                  height={48}
                  className="rounded-2xl ring-1 ring-border/60"
                  priority
                />
                <p className="text-2xl font-black tracking-tight text-foreground">
                  <span className="text-primary">Rij</span>
                  <span>Via</span>
                </p>
              </div>

              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10">
                  {icon}
                </div>

                <h1 className="break-words text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-3 break-words text-base leading-7 text-muted-foreground sm:text-lg">
                  {description}
                </p>
              </div>

              <div
                className={cn(
                  "mt-8 flex flex-col gap-3",
                  secondaryAction ? "sm:flex-row" : undefined,
                )}
              >
                <StatusActionButton
                  action={primaryAction}
                  variant="default"
                  className="min-h-12 h-auto flex-1 whitespace-normal rounded-[1.1rem] px-5 py-3 text-center text-sm font-bold"
                />
                {secondaryAction ? (
                  <StatusActionButton
                    action={secondaryAction}
                    variant="outline"
                    className="min-h-12 h-auto flex-1 whitespace-normal rounded-[1.1rem] px-5 py-3 text-center text-sm font-semibold"
                  />
                ) : null}
              </div>

              {footer ? (
                <div className="mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">
                  {footer}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusActionButton({
  action,
  variant,
  className,
}: {
  action: StatusAction;
  variant: "default" | "outline";
  className?: string;
}) {
  if ("href" in action && action.href) {
    return (
      <Button asChild variant={variant} className={className}>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }

  return (
    <Button variant={variant} className={className} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}
