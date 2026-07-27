"use client";

import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n-routing";

export function useRoutePathname(): string {
  return getLocaleFromPathname(usePathname()).pathname;
}
