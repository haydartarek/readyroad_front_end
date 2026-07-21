"use client";

import { Shield } from "lucide-react";
import { PublicDocumentPage } from "@/components/public/public-document-page";

export default function PrivacyPolicyPage() {
  return (
    <PublicDocumentPage
      page="privacy"
      path="/privacy-policy"
      icon={Shield}
    />
  );
}
