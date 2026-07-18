import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://readyroad.be";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/traffic-signs/",
          "/lessons/",
          "/contact",
          "/terms",
          "/privacy-policy",
        ],
        disallow: [
          "/dashboard",
          "/profile",
          "/practice",
          "/exam",
          "/analytics",
          "/admin",
          "/api/",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "ClaudeBot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
