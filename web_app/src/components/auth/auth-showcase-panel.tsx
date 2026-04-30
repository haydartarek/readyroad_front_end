"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

type AuthFeature = {
  icon: LucideIcon;
  label: string;
};

export function AuthShowcasePanel({
  badge,
  title,
  titleAccent,
  description,
  features,
  supportingText,
  verticalAlign = "center",
}: {
  badge: string;
  title: string;
  titleAccent?: string;
  description: string;
  features: AuthFeature[];
  supportingText?: string;
  verticalAlign?: "center" | "start";
}) {
  const { t } = useLanguage();

  return (
    <aside className="relative hidden overflow-hidden lg:flex lg:w-[42%] xl:w-[40%]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_32%),linear-gradient(150deg,hsl(var(--secondary))_0%,hsl(var(--secondary)/0.98)_42%,hsl(var(--primary)/0.94)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20" />
      <div className="absolute -left-20 top-10 h-60 w-60 rounded-full bg-white/6 blur-3xl" />
      <div className="absolute -bottom-16 right-[-3rem] h-72 w-72 rounded-full bg-white/6 blur-3xl" />

      <div
        className={[
          "relative z-10 flex min-h-screen w-full flex-col gap-7 px-6 py-6 text-white xl:px-8 xl:py-8",
          verticalAlign === "start" ? "justify-start pt-10 xl:pt-12" : "justify-center",
        ].join(" ")}
      >
        <div className="rounded-[1.55rem] border border-white/12 bg-white/8 px-3.5 py-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 ring-2 ring-primary/35 shadow-[0_12px_30px_rgba(223,88,48,0.22)]">
              <Image
                src="/images/logo.png"
                alt="ReadyRoad Logo"
                width={40}
                height={40}
                className="rounded-full object-cover"
                priority
              />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[1.45rem] font-black tracking-tight text-white">
                {t("app.name")}
              </p>
              <p className="max-w-xs text-[11px] font-medium leading-[1.1rem] text-white/70">
                {t("auth.showcase_brand_caption")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">
            {badge}
          </span>

          <div className="space-y-2.5">
            <h1 className="max-w-xl text-[2.7rem] font-black leading-[1.02] tracking-tight text-white xl:text-[3rem]">
              {title}
              {titleAccent ? (
                <span className="block text-white/72">{titleAccent}</span>
              ) : null}
            </h1>
            <p className="max-w-lg text-sm leading-6 text-white/78 xl:text-[15px]">
              {description}
            </p>
          </div>

          <div className="grid gap-2.5 xl:grid-cols-2">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-start gap-2.5 rounded-[1.2rem] border border-white/12 bg-white/8 px-3.5 py-3 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[1rem] border border-white/10 bg-white/12 text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-[13px] font-medium leading-[1.35rem] text-white/85">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {supportingText ? (
            <div className="rounded-[1.2rem] border border-white/12 bg-black/15 px-3.5 py-3 backdrop-blur-sm">
              <p className="text-[13px] font-medium leading-[1.35rem] text-white/78">
                {supportingText}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
