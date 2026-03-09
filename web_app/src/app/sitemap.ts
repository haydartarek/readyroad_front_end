import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://readyroad.be';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ─── Public pages (indexed) ──────────────────────────────
  const publicPages: MetadataRoute.Sitemap = [
    {
      url:              APP_URL,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              `${APP_URL}/traffic-signs`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${APP_URL}/lessons`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${APP_URL}/register`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.8,
    },
    {
      url:              `${APP_URL}/login`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.7,
    },
    {
      url:              `${APP_URL}/contact`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.6,
    },
    {
      url:              `${APP_URL}/terms`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.3,
    },
    {
      url:              `${APP_URL}/privacy-policy`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.3,
    },
  ];

  return publicPages;
}
