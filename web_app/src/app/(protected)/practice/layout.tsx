import type { Metadata } from "next";
import { headers } from "next/headers";
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

export default function PracticeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
