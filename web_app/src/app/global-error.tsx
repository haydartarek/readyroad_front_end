"use client";

import "./globals.css";
import { LocalizedErrorScreen } from "@/components/ui/localized-error-screen";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <LocalizedErrorScreen reset={reset} fullscreen />
      </body>
    </html>
  );
}
