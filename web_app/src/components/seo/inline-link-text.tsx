import type { ReactNode } from "react";
import Link from "@/components/localized-link";

export type InlineLinkMatch = {
  start: number;
  end: number;
  href: string;
};

export function InlineLinkText({
  text,
  links,
}: {
  text: string;
  links: readonly InlineLinkMatch[];
}) {
  if (links.length === 0) return <>{text}</>;

  const content: ReactNode[] = [];
  let position = 0;

  for (const link of [...links].sort((a, b) => a.start - b.start)) {
    if (link.start < position || link.end > text.length || link.end <= link.start) continue;
    content.push(text.slice(position, link.start));
    content.push(
      <Link
        key={`${link.href}-${link.start}`}
        href={link.href}
        className="font-medium text-primary underline decoration-primary/50 underline-offset-2 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {text.slice(link.start, link.end)}
      </Link>,
    );
    position = link.end;
  }

  content.push(text.slice(position));
  return <>{content}</>;
}
