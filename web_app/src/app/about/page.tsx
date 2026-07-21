"use client";

import { Compass } from "lucide-react";
import { PublicDocumentPage } from "@/components/public/public-document-page";

export default function AboutPage() {
  return <PublicDocumentPage page="about" path="/about" icon={Compass} />;
}
