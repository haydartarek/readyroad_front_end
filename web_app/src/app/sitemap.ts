import type { MetadataRoute } from "next";
import {
  getPublicLessons,
  getPublicTrafficSigns,
} from "@/lib/server/public-catalog";
import { DEFAULT_APP_URL } from "@/lib/site-copy";
import {
  buildLanguageAlternates,
  buildLocalizedUrl,
  SITE_LOCALES,
} from "@/lib/i18n-routing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicPages = [
    {
      pathname: "/",
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      pathname: "/traffic-signs",
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      pathname: "/lessons",
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      pathname: "/contact",
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      pathname: "/about",
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      pathname: "/faq",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      pathname: "/terms",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      pathname: "/privacy-policy",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      pathname: "/cookie-policy",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      pathname: "/disclaimer",
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ] as const;

  const [signs, lessons] = await Promise.all([
    getPublicTrafficSigns(),
    getPublicLessons(),
  ]);
  const uniqueSignCodes = [
    ...new Set(
      signs
        .map((sign) => sign.routeCode || sign.signCode)
        .filter((code): code is string => Boolean(code)),
    ),
  ];
  const signPages = uniqueSignCodes.map((code) => ({
    pathname: `/traffic-signs/${encodeURIComponent(code)}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const lessonPages = lessons.flatMap((lesson) => {
    if (!lesson.lessonCode) return [];
    const lessonPath = `/lessons/${encodeURIComponent(lesson.lessonCode)}`;
    const totalPages = Math.max(lesson.totalPages || 1, 1);

    return Array.from({ length: totalPages }, (_, index) => ({
      pathname: index === 0 ? lessonPath : `${lessonPath}/${index + 1}`,
      changeFrequency: "monthly" as const,
      priority: index === 0 ? 0.7 : 0.6,
    }));
  });
  const routes = [...publicPages, ...signPages, ...lessonPages];

  return routes.flatMap((route) =>
    SITE_LOCALES.map((locale) => ({
      url: buildLocalizedUrl(route.pathname, locale, APP_URL),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: buildLanguageAlternates(route.pathname, APP_URL),
      },
    })),
  );
}
