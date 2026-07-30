import { getRequestLocale } from "@/lib/server/request-locale";
import { Home, LifeBuoy, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { translateMessage } from "@/lib/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    title: translateMessage(locale, "common.not_found_title"),
  };
}

export default async function NotFound() {
  const locale = await getRequestLocale();
  const isRTL = locale === "ar";

  return (
    <main
      data-testid="not-found-page"
      dir={isRTL ? "rtl" : "ltr"}
      className="flex min-h-[calc(100dvh-74px)] items-center bg-muted/30 px-4 py-10 sm:px-6 lg:px-8"
    >
      <section
        data-testid="not-found-card"
        aria-labelledby="not-found-title"
        className="mx-auto w-full max-w-3xl rounded-2xl border border-border/60 bg-card/95 px-5 py-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:px-10 sm:py-12"
      >
        <p
          data-testid="not-found-code"
          className="text-7xl font-black leading-none text-primary sm:text-8xl lg:text-9xl"
        >
          404
        </p>

        <div
          data-testid="not-found-icon"
          aria-hidden="true"
          className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15"
        >
          <SearchX className="h-8 w-8" />
        </div>

        <h1
          id="not-found-title"
          data-testid="not-found-title"
          className="mt-5 break-words text-2xl font-black text-foreground sm:text-3xl"
        >
          {translateMessage(locale, "common.not_found_title")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl break-words text-sm leading-7 text-muted-foreground sm:text-base">
          {translateMessage(locale, "common.not_found_desc")}
        </p>

        <div
          data-testid="not-found-actions"
          className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="h-12 min-h-12 flex-1 gap-2 rounded-xl"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              {translateMessage(locale, "common.go_home")}
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 min-h-12 flex-1 gap-2 rounded-xl"
          >
            <Link href="/contact">
              <LifeBuoy className="h-4 w-4" />
              {translateMessage(locale, "common.contact_support")}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
