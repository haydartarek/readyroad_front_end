import type { Metadata } from "next";
import FavoritesClient from "./favorites-client";

// Account-specific content is not indexable.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function FavoritesPage() {
  return <FavoritesClient />;
}
