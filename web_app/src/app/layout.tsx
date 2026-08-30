import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { LanguageProvider } from "@/contexts/language-context";
import { CookieConsentProvider } from "@/contexts/cookie-consent-context";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ErrorBoundary } from "@/components/error-boundary";
import { STORAGE_KEYS, type Language } from "@/lib/constants";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getLayoutMetadataCopy,
  getOpenGraphLocale,
  getSharedOgImage,
  createEducationalAppSchema,
  createOrganizationSchema,
  createWebsiteSchema,
} from "@/lib/site-copy";
import { serializeJsonLd } from "@/lib/seo";
import { COOKIE_CONSENT_BOOTSTRAP_SCRIPT } from "@/lib/cookie-consent-bootstrap";
import { CookieConsentManager } from "@/components/privacy/cookie-consent-manager";
import { ConsentThemeController } from "@/components/privacy/consent-theme-controller";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";
import { getRequestLocale } from "@/lib/server/request-locale";

// ─── Typography ──────────────────────────────────────────

const tajawal = Tajawal({
  weight: "500",
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  display: "swap",
});

// ─── Viewport ────────────────────────────────────────────

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#DF5830" },
    { media: "(prefers-color-scheme: dark)", color: "#181B20" },
  ],
  width: "device-width",
  initialScale: 1,
};

// ─── Metadata ────────────────────────────────────────────

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
export async function generateMetadata(): Promise<Metadata> {
  const [locale, headerStore] = await Promise.all([
    getRequestLocale(),
    headers(),
  ]);
  const copy = getLayoutMetadataCopy(locale);
  const ogImage = getSharedOgImage(locale);
  const pathname = headerStore.get("x-rijvia-pathname") || "/";
  const canonical = buildLocalizedUrl(pathname, locale, APP_URL);

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: copy.defaultTitle,
      template: "%s | RijVia",
    },
    description: copy.description,
    keywords: copy.keywords,
    authors: [{ name: "RijVia Team", url: APP_URL }],
    creator: "RijVia",
    publisher: "RijVia",
    category: "education",
    formatDetection: { email: false, address: false, telephone: false },
    alternates: getLocalizedAlternates(pathname, locale, APP_URL),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: [{ url: "/favicon.ico" }],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    manifest: "/manifest.json",
    openGraph: {
      title: copy.defaultTitle,
      description: copy.openGraphDescription,
      type: "website",
      url: canonical,
      siteName: "RijVia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.defaultTitle,
      description: copy.twitterDescription,
      images: [ogImage.url],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "RijVia",
    },
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

// ─── Layout ──────────────────────────────────────────────

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  const isRTL = locale === "ar";
  const organizationSchema = createOrganizationSchema(APP_URL, locale);
  const websiteSchema = createWebsiteSchema(APP_URL, locale);
  const educationalAppSchema = createEducationalAppSchema(APP_URL, locale);

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <Script
          id="rijvia-consent-defaults"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: COOKIE_CONSENT_BOOTSTRAP_SCRIPT }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(educationalAppSchema),
          }}
        />
      </head>
      <body
        className={`${tajawal.className} ${tajawal.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <LanguageProvider initialLanguage={locale as Language}>
            <CookieConsentProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                disableTransitionOnChange
                storageKey={STORAGE_KEYS.THEME}
              >
                <ConsentThemeController />
                <AuthProvider>
                  <NotificationProvider>
                    <Navbar />
                    {children}
                    <ConditionalFooter />
                    <CookieConsentManager />
                    <Toaster position="bottom-right" richColors />
                  </NotificationProvider>
                </AuthProvider>
              </ThemeProvider>
            </CookieConsentProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
