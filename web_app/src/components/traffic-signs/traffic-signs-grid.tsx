"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { TrafficSign } from "@/lib/types";
import { resolveTrafficSignImage } from "@/lib/sign-image-resolver";
import { SignImage } from "./sign-image";
import {
  getTrafficSignGroupInfo,
  getTrafficSignName,
} from "@/lib/traffic-sign-presentation";

// ─── Component ───────────────────────────────────────────

export function TrafficSignsGrid({ signs }: { signs: TrafficSign[] }) {
  const { language, t } = useLanguage();
  const lang = language as "en" | "ar" | "nl" | "fr";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {signs.map((sign) => {
        const name = getTrafficSignName(sign, lang);
        const { info, style } = getTrafficSignGroupInfo(sign);
        const routeCode = sign.routeCode ?? sign.signCode;

        return (
          <Link
            key={routeCode}
            href={`/traffic-signs/${routeCode}`}
            className="group block h-full"
          >
            <Card
              className={`h-full overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-md ${style.cardGlow}`}
            >
              <CardContent className="flex h-full flex-col p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {info.title[lang]}
                  </p>
                  <span className="rounded-full border border-border/60 bg-background px-3 py-1 font-mono text-[11px] font-semibold tracking-wide text-muted-foreground">
                    {sign.signCode}
                  </span>
                </div>

                <div
                  className={`mt-4 rounded-[1.4rem] border border-border/60 p-4 ${style.soft}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.1rem] bg-background/90">
                    <SignImage
                      src={resolveTrafficSignImage(sign)}
                      alt={name}
                      className="object-contain p-4 transition-transform duration-200 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-1 flex-col">
                  <h3 className="min-h-[3.1rem] line-clamp-2 text-base font-black leading-6 tracking-tight text-foreground sm:min-h-[3.3rem] sm:text-[1.1rem]">
                    {name}
                  </h3>

                  <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3 text-sm">
                    <span className="font-semibold text-primary">
                      {t("common.view")}
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/15 bg-primary/6 text-primary transition-transform duration-200 group-hover:-translate-y-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
