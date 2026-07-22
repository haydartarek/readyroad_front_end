import type { MetadataRoute } from "next";
import {
  getPublicLessons,
  getPublicTrafficSigns,
} from "@/lib/server/public-catalog";
import { DEFAULT_APP_URL } from "@/lib/site-copy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicPages: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/traffic-signs`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/lessons`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/contact`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/about`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/faq`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/cookie-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/disclaimer`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

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
  const uniqueLessonCodes = [
    ...new Set(
      lessons
        .map((lesson) => lesson.lessonCode)
        .filter((code): code is string => Boolean(code)),
    ),
  ];

  const signPages: MetadataRoute.Sitemap = uniqueSignCodes.map((code) => ({
    url: `${APP_URL}/traffic-signs/${encodeURIComponent(code)}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const lessonPages: MetadataRoute.Sitemap = uniqueLessonCodes.map((code) => ({
    url: `${APP_URL}/lessons/${encodeURIComponent(code)}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...publicPages, ...signPages, ...lessonPages];
}
