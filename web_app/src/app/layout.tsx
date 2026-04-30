import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { LanguageProvider } from "@/contexts/language-context";
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
  resolveSiteLocale,
  createEducationalAppSchema,
  createOrganizationSchema,
  createWebsiteSchema,
} from "@/lib/site-copy";

// ─── Font ────────────────────────────────────────────────

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// ─── Viewport ────────────────────────────────────────────

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#181B20" },
  ],
  width: "device-width",
  initialScale: 1,
};

// ─── Metadata ────────────────────────────────────────────

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveSiteLocale(
    cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value,
  );
  const copy = getLayoutMetadataCopy(locale);
  const ogImage = getSharedOgImage(locale);

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: copy.defaultTitle,
      template: "%s | ReadyRoad",
    },
    description: copy.description,
    keywords: copy.keywords,
    authors: [{ name: "ReadyRoad Team", url: APP_URL }],
    creator: "ReadyRoad",
    publisher: "ReadyRoad",
    category: "education",
    formatDetection: { email: false, address: false, telephone: false },
    alternates: {
      canonical: APP_URL,
      languages: {
        en: `${APP_URL}`,
        nl: `${APP_URL}`,
        fr: `${APP_URL}`,
        ar: `${APP_URL}`,
        "x-default": APP_URL,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/images/logo.png", sizes: "512x512", type: "image/png" },
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
      url: APP_URL,
      siteName: "ReadyRoad",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      site: "@ReadyRoad",
      creator: "@ReadyRoad",
      title: copy.defaultTitle,
      description: copy.twitterDescription,
      images: [ogImage.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "ReadyRoad",
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
    },
  };
}

// ─── Layout ──────────────────────────────────────────────

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const locale = resolveSiteLocale(
    cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value,
  );
  const isRTL = locale === "ar";
  const organizationSchema = createOrganizationSchema(APP_URL, locale);
  const websiteSchema = createWebsiteSchema(APP_URL, locale);
  const educationalAppSchema = createEducationalAppSchema(APP_URL, locale);

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(educationalAppSchema),
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
            storageKey={STORAGE_KEYS.THEME}
          >
            <LanguageProvider initialLanguage={locale as Language}>
              <AuthProvider>
                <NotificationProvider>
                  <Navbar />
                  {children}
                  <ConditionalFooter />
                  <Toaster position="bottom-right" richColors />
                </NotificationProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
