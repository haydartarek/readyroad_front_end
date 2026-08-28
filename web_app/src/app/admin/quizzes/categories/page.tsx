"use client";

import { FolderCog } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminTheoryCategories } from "@/components/admin/admin-theory-categories";
import { useLanguage } from "@/contexts/language-context";

export default function AdminTheoryCategoriesPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={<FolderCog className="h-6 w-6" />}
        title={t("admin.quizzes.health.category_management_title")}
        description={t("admin.quizzes.health.category_management_description")}
      />

      <AdminTheoryCategories />
    </div>
  );
}
