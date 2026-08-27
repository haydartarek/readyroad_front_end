"use client";

import { FileText } from "lucide-react";
import { PublicDocumentPage } from "@/components/public/public-document-page";

export default function TermsPage() {
  return (
    <PublicDocumentPage page="terms" path="/terms" icon={FileText} />
  );
}
