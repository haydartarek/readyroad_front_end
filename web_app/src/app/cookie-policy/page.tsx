"use client";

import { Cookie } from "lucide-react";
import { PublicDocumentPage } from "@/components/public/public-document-page";

export default function CookiePolicyPage() {
  return (
    <PublicDocumentPage
      page="cookies"
      path="/cookie-policy"
      icon={Cookie}
    />
  );
}
