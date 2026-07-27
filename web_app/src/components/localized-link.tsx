"use client";

import NextLink, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useOptionalLanguage } from "@/contexts/language-context";
import { localizeHref } from "@/lib/i18n-routing";

type LocalizedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
  };

export default function LocalizedLink({
  href,
  ...props
}: LocalizedLinkProps) {
  const language = useOptionalLanguage();
  const localizedHref =
    typeof href === "string"
      ? localizeHref(href, language)
      : {
          ...href,
          pathname:
            typeof href.pathname === "string"
              ? localizeHref(href.pathname, language)
              : href.pathname,
        };

  return <NextLink href={localizedHref} {...props} />;
}
