"use client";

import { InlineLinkText } from "@/components/seo/inline-link-text";
import { signLessonRules, type InlineLinkLanguage } from "@/components/seo/inline-link-rules";

type Props = {
  signCode: string;
  text: string;
  language: string;
  availableLessonCodes: readonly string[];
};

export function PilotSignLessonLink({ signCode, text, language, availableLessonCodes }: Props) {
  const rule = signLessonRules[signCode];
  const anchor = rule?.anchors[language.toLowerCase() as InlineLinkLanguage];

  if (!rule || !anchor || !availableLessonCodes.includes(rule.lesson)) {
    return <>{text}</>;
  }

  const start = text.indexOf(anchor);
  if (start === -1) return <>{text}</>;

  return (
    <InlineLinkText
      text={text}
      links={[{ start, end: start + anchor.length, href: `/lessons/${rule.lesson}#section-${rule.section}` }]}
    />
  );
}
