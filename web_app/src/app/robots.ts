import type { MetadataRoute } from "next";
import { DEFAULT_APP_URL } from "@/lib/site-copy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/traffic-signs/",
          "/lessons/",
          "/about",
          "/contact",
          "/faq",
          "/terms",
          "/privacy-policy",
          "/cookie-policy",
          "/disclaimer",
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
