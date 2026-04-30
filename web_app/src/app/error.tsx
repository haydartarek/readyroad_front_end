"use client";

import { LocalizedErrorScreen } from "@/components/ui/localized-error-screen";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <LocalizedErrorScreen reset={reset} fullscreen={false} />;
}
