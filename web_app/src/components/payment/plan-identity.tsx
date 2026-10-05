import { CalendarCheck, Trophy, Zap } from "lucide-react";

import type { PaymentPlan } from "@/services/paymentService";

export const RECOMMENDED_PAYMENT_PLAN: PaymentPlan =
  "RIJVIA_1_WEEK";

type PlanIdentityVariant =
  | "home"
  | "selection"
  | "paywall";

type PlanLabelTag =
  | "h3"
  | "p"
  | "span";

type RecommendedBadgeVariant =
  | "floating"
  | "corner"
  | "compact";

function PlanGlyph({
  plan,
}: {
  plan: PaymentPlan;
}) {
  const iconClass = "h-4 w-4";

  switch (plan) {
    case "RIJVIA_3_DAYS":
      return (
        <Zap
          className={iconClass}
          aria-hidden
        />
      );

    case "RIJVIA_1_WEEK":
      return (
        <CalendarCheck
          className={iconClass}
          aria-hidden
        />
      );

    case "RIJVIA_4_WEEKS":
      return (
        <Trophy
          className={iconClass}
          aria-hidden
        />
      );
  }
}

const WRAPPER_CLASSES: Record<
  PlanIdentityVariant,
  string
> = {
  home:
    "mb-3 flex min-w-0 items-center justify-center gap-2 text-center",
  selection:
    "flex min-w-0 items-center justify-center gap-2 text-center",
  paywall:
    "col-start-1 row-start-1 flex min-w-0 items-center gap-2 md:gap-2.5",
};

const ICON_CLASSES: Record<
  PlanIdentityVariant,
  string
> = {
  home:
    "grid h-8 w-8 shrink-0 place-items-center rounded-xl border xl:h-9 xl:w-9",
  selection:
    "grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
  paywall:
    "grid h-6 w-6 shrink-0 place-items-center rounded-lg border md:h-7 md:w-7",
};

const LABEL_CLASSES: Record<
  PlanIdentityVariant,
  string
> = {
  home:
    "text-center text-lg font-black sm:text-xl",
  selection:
    "min-w-0 text-center text-2xl font-black",
  paywall:
    "truncate text-sm font-black md:text-base",
};

export function PlanIdentity({
  plan,
  label,
  featured = false,
  variant,
  labelAs = "span",
}: {
  plan: PaymentPlan;
  label: string;
  featured?: boolean;
  variant: PlanIdentityVariant;
  labelAs?: PlanLabelTag;
}) {
  const Label = labelAs;

  const iconTone = featured
    ? "border-primary bg-primary text-primary-foreground shadow-sm"
    : "border-primary/15 bg-primary/10 text-primary";

  const labelTone =
    variant === "home"
      ? featured
        ? "text-secondary-foreground"
        : "text-secondary"
      : "text-foreground";

  return (
    <div className={WRAPPER_CLASSES[variant]}>
      <span
        className={[
          ICON_CLASSES[variant],
          iconTone,
        ].join(" ")}
      >
        <PlanGlyph plan={plan} />
      </span>

      <Label
        className={[
          LABEL_CLASSES[variant],
          labelTone,
        ].join(" ")}
      >
        {label}
      </Label>
    </div>
  );
}

export function RecommendedPlanAccent() {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-2xl border-t-[3px] border-primary md:rounded-[20px] xl:rounded-[24px]" />
  );
}

const BADGE_VARIANTS: Record<
  RecommendedBadgeVariant,
  string
> = {
  floating:
    "left-1/2 top-0 h-8 -translate-x-1/2 -translate-y-1/2 px-4 text-xs ring-2 ring-background sm:text-sm",
  corner:
    "end-4 top-4 h-7 px-3 text-xs ring-2 ring-background",
  compact:
    "-top-2 end-2 h-6 px-2 text-[10px] ring-2 ring-background md:-top-3 md:end-3 md:h-7 md:px-2.5 md:text-[11px]",
};

export function RecommendedPlanBadge({
  label,
  variant,
}: {
  label: string;
  variant: RecommendedBadgeVariant;
}) {
  return (
    <span
      className={[
        "absolute z-20 inline-flex items-center whitespace-nowrap rounded-full bg-primary font-black text-primary-foreground shadow-md",
        BADGE_VARIANTS[variant],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
