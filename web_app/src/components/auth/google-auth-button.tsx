"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GoogleAuthMode = "login" | "register" | "link";

interface GoogleAuthButtonProps {
  mode: GoogleAuthMode;
  label: string;
  returnTo?: string;
  className?: string;
}

function buildHref(mode: GoogleAuthMode, returnTo?: string) {
  const params = new URLSearchParams({ mode });
  if (returnTo) {
    params.set("returnTo", returnTo);
  }

  return `/api/auth/google/start?${params.toString()}`;
}

export function GoogleAuthButton({
  mode,
  label,
  returnTo,
  className,
}: GoogleAuthButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    event.currentTarget.blur();
  };

  return (
    <Button
      asChild
      variant="outline"
      className={cn(
        "h-12 w-full rounded-2xl border-border/70 bg-background/90 text-sm font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background hover:text-foreground hover:shadow-md",
        className,
      )}
    >
      <a href={buildHref(mode, returnTo)} onClick={handleClick}>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
        >
          <path
            d="M21.805 10.023h-9.76v3.955h5.594c-.241 1.271-.965 2.348-2.058 3.069v2.545h3.327c1.948-1.793 3.067-4.438 2.897-7.57Z"
            fill="#4285F4"
          />
          <path
            d="M12.045 22c2.79 0 5.132-.924 6.843-2.5l-3.327-2.545c-.924.62-2.105.986-3.516.986-2.699 0-4.986-1.821-5.804-4.268H2.81v2.626A10.33 10.33 0 0 0 12.045 22Z"
            fill="#34A853"
          />
          <path
            d="M6.241 13.673a6.204 6.204 0 0 1 0-3.946V7.1H2.81a10.328 10.328 0 0 0 0 9.2l3.431-2.627Z"
            fill="#FBBC04"
          />
          <path
            d="M12.045 5.455c1.518 0 2.882.522 3.955 1.546l2.967-2.967C17.171 2.362 14.828 1.4 12.045 1.4A10.33 10.33 0 0 0 2.81 7.1l3.431 2.627c.818-2.448 3.105-4.272 5.804-4.272Z"
            fill="#EA4335"
          />
        </svg>
        {label}
      </a>
    </Button>
  );
}
