import type { Metadata } from "next";
import { headers } from "next/headers";
import { SeoIntentSection } from "@/components/seo/seo-intent-section";
import { createLearningEntryMetadata } from "@/lib/learning-entry-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pathname = (await headers()).get("x-rijvia-pathname") || "/practice";
  if (pathname === "/practice") {
    return createLearningEntryMetadata("practice", "/practice");
  }
  if (pathname === "/practice/random") {
    return {};
  }
  return { robots: { index: false, follow: false } };
}

export default async function PracticeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-rijvia-pathname") || "/practice";

  return (
    <>
      {children}
      {pathname === "/practice" ? <SeoIntentSection page="practice" /> : null}
    </>
  );
}
