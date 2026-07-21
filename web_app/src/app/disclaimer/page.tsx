"use client";

import { Scale } from "lucide-react";
import { PublicDocumentPage } from "@/components/public/public-document-page";

export default function DisclaimerPage() {
  return (
    <PublicDocumentPage
      page="disclaimer"
      path="/disclaimer"
      icon={Scale}
    />
  );
}
