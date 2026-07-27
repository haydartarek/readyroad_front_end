"use client";

import { Footer } from "@/components/home/footer";
import { useRoutePathname } from "@/hooks/use-route-pathname";

const EXCLUDED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function ConditionalFooter() {
  const pathname = useRoutePathname();
  const allowAdminDashboard = pathname === "/admin/dashboard";
  const hidden = EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  if (hidden && !allowAdminDashboard) return null;
  return <Footer />;
}
