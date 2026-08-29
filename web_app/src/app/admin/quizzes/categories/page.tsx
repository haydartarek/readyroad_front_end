"use client";

import { FolderCog } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminQuestionExposure } from "@/components/admin/admin-question-exposure";
import { AdminTheoryCategories } from "@/components/admin/admin-theory-categories";
import { useLanguage } from "@/contexts/language-context";

export default function AdminTheoryCategoriesPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-5 pb-6">
      <AdminPageHeader
        icon={<FolderCog className="h-6 w-6" />}
        title={t("admin.quizzes.health.category_management_title")}
        description={t("admin.quizzes.health.category_management_description")}
      />

      <AdminQuestionExposure />

      <section className="min-w-0 rounded-3xl border border-border/50 bg-card/70 p-4 shadow-sm sm:p-5">
        <AdminTheoryCategories />
      </section>
    </div>
  );
}
