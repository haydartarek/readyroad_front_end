import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ArticleMarkdownProps {
  body: string;
  className?: string;
  typography?: Partial<ArticleTypography> | null;
}

export interface ArticleTypography {
  h1Size: "COMPACT" | "DEFAULT" | "LARGE";
  h2Size: "COMPACT" | "DEFAULT" | "LARGE";
  h3Size: "COMPACT" | "DEFAULT" | "LARGE";
  h4Size: "COMPACT" | "DEFAULT" | "LARGE";
  paragraphSize: "COMPACT" | "DEFAULT" | "LARGE";
  textColor: "DEFAULT" | "MUTED" | "PRIMARY" | "SECONDARY";
}

export const DEFAULT_ARTICLE_TYPOGRAPHY: ArticleTypography = {
  h1Size: "DEFAULT",
  h2Size: "DEFAULT",
  h3Size: "DEFAULT",
  h4Size: "DEFAULT",
  paragraphSize: "DEFAULT",
  textColor: "DEFAULT",
};

const H1_CLASSES = {
  COMPACT: "text-2xl sm:text-3xl",
  DEFAULT: "text-3xl sm:text-4xl",
  LARGE: "text-4xl sm:text-5xl",
} as const;
const H2_CLASSES = {
  COMPACT: "text-xl sm:text-2xl",
  DEFAULT: "text-2xl sm:text-3xl",
  LARGE: "text-3xl sm:text-4xl",
} as const;
const H3_CLASSES = {
  COMPACT: "text-base sm:text-lg",
  DEFAULT: "text-xl sm:text-2xl",
  LARGE: "text-2xl sm:text-3xl",
} as const;
const H4_CLASSES = {
  COMPACT: "text-sm",
  DEFAULT: "text-base sm:text-lg",
  LARGE: "text-lg sm:text-xl",
} as const;
const PARAGRAPH_CLASSES = {
  COMPACT: "text-sm",
  DEFAULT: "text-base",
  LARGE: "text-lg",
} as const;
const COLOR_CLASSES = {
  DEFAULT: "text-foreground",
  MUTED: "text-muted-foreground",
  PRIMARY: "text-primary",
  SECONDARY: "text-secondary",
} as const;

function isSafeArticleHref(href: string | undefined): href is string {
  if (!href) return false;

  return (
    (href.startsWith("/") && !href.startsWith("//"))
    || /^https?:\/\//i.test(href)
  );
}

function SafeLink({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  if (!isSafeArticleHref(href)) {
    return <span>{children}</span>;
  }

  const external = /^https?:\/\//i.test(href);

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="font-bold text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary/75"
    >
      {children}
    </a>
  );
}

export default function ArticleMarkdown({
  body,
  className,
  typography,
}: ArticleMarkdownProps) {
  const styles: ArticleTypography = {
    ...DEFAULT_ARTICLE_TYPOGRAPHY,
    ...typography,
  };

  return (
    <div
      className={cn("min-w-0 break-words", COLOR_CLASSES[styles.textColor], className)}
      data-testid="article-markdown"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          h1: ({ children }) => (
            <h1 className={cn("mt-10 font-black leading-tight first:mt-0", H1_CLASSES[styles.h1Size])}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={cn("mt-10 font-black leading-tight first:mt-0", H2_CLASSES[styles.h2Size])}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={cn("mt-8 font-black leading-tight", H3_CLASSES[styles.h3Size])}>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className={cn("mt-7 font-black leading-tight", H4_CLASSES[styles.h4Size])}>
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className={cn("mt-5 whitespace-pre-wrap leading-inherit first:mt-0", PARAGRAPH_CLASSES[styles.paragraphSize])}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mt-5 list-disc space-y-2 ps-6 marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-5 list-decimal space-y-2 ps-6 marker:font-bold marker:text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="ps-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-6 border-s-4 border-primary/40 bg-primary/[0.04] px-5 py-3 font-semibold italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => <SafeLink href={href}>{children}</SafeLink>,
          strong: ({ children }) => <strong className="font-black">{children}</strong>,
          code: ({ children }) => (
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
              {children}
            </code>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
