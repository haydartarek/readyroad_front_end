import type { Metadata } from "next";
import { SeoIntentSection } from "@/components/seo/seo-intent-section";
import { createLearningEntryMetadata } from "@/lib/learning-entry-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createLearningEntryMetadata("signExam", "/practice/random");
}

export default function RandomPracticeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <SeoIntentSection page="signExam" />
    </>
  );
}
