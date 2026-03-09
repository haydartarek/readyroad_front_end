import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://readyroad.be';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all bots on public pages
        userAgent:  '*',
        allow:      ['/', '/traffic-signs', '/lessons', '/contact', '/terms', '/privacy-policy', '/register', '/login'],
        disallow:   [
          '/dashboard',
          '/profile',
          '/practice',
          '/exam',
          '/analytics',
          '/admin',
          '/api/',
          '/_next/',
        ],
      },
      {
        // Block AI crawlers from scraping content
        userAgent:  ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'ClaudeBot'],
        disallow:   ['/'],
      },
    ],
    sitemap:  `${APP_URL}/sitemap.xml`,
    host:     APP_URL,
  };
}
