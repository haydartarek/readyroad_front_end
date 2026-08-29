import type { Metadata } from "next";
import { headers } from "next/headers";
import { SeoIntentSection } from "@/components/seo/seo-intent-section";
import { createLearningEntryMetadata } from "@/lib/learning-entry-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pathname = (await headers()).get("x-rijvia-pathname") || "/exam";
  if (pathname === "/exam") {
    return createLearningEntryMetadata("theoryExam", "/exam");
  }
  return { robots: { index: false, follow: false } };
}

export default async function ExamLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-rijvia-pathname") || "/exam";

  return (
    <>
      {children}
      {pathname === "/exam" ? <SeoIntentSection page="theoryExam" /> : null}
    </>
  );
}
