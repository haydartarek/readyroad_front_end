import type { Language } from "@/lib/constants";
import { localizeHref } from "@/lib/i18n-routing";

export function validateReturnUrl(returnUrl: string | null): string | undefined {
  if (!returnUrl) return undefined;
  if (!returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
    return undefined;
  }
  if (returnUrl === "/login" || returnUrl === "/register") {
    return undefined;
  }
  return returnUrl;
}

export function buildLearningLoginHref(
  returnPath: string,
  language: Language,
): string {
  const localizedLogin = localizeHref("/login", language);
  const localizedReturnPath = localizeHref(returnPath, language);
  const params = new URLSearchParams({ returnUrl: localizedReturnPath });
  return `${localizedLogin}?${params.toString()}`;
}

export function buildAuthSwitchHref(
  authPath: "/login" | "/register",
  returnPath: string | undefined,
  language: Language,
): string {
  const localizedAuthPath = localizeHref(authPath, language);
  if (!returnPath) return localizedAuthPath;
  const params = new URLSearchParams({ returnUrl: returnPath });
  return `${localizedAuthPath}?${params.toString()}`;
}
