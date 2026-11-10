"use client";

import { InlineLinkText, type InlineLinkMatch } from "@/components/seo/inline-link-text";
import { lessonSignRules } from "@/components/seo/inline-link-rules";

type Props = {
  lessonCode: string;
  pageNumber: number;
  paragraphIndex: number;
  paragraphs: readonly string[];
  text: string;
  availableSignCodes: readonly string[];
};

function findSignCode(text: string, code: string): { start: number; end: number } | null {
  const match = new RegExp(`(^|[^A-Za-z0-9])(${code})(?=$|[^A-Za-z0-9])`).exec(text);
  if (!match) return null;
  const start = match.index + match[1].length;
  return { start, end: start + code.length };
}

export function PilotInlineLink({
  lessonCode,
  pageNumber,
  paragraphIndex,
  paragraphs,
  text,
  availableSignCodes,
}: Props) {
  const links: InlineLinkMatch[] = [];

  for (const rule of lessonSignRules) {
    if (
      rule.lesson !== lessonCode ||
      rule.page !== pageNumber ||
      !availableSignCodes.includes(rule.sign)
    ) continue;

    const selectedIndex = paragraphs.findIndex(
      (paragraph) => !/^[•\-*]\s/.test(paragraph) && findSignCode(paragraph, rule.sign),
    );
    if (selectedIndex !== paragraphIndex) continue;

    const match = findSignCode(text, rule.sign);
    if (match) links.push({ ...match, href: `/traffic-signs/${rule.sign}` });
  }

  return <InlineLinkText text={text} links={links} />;
}
