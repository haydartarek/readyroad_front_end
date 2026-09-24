"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/localized-link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSectionCard from "@/components/admin/AdminSectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { useLanguage } from "@/contexts/language-context";
import {
  getAdminLessons,
  type AdminLessonSummary,
  type LessonEditorState,
} from "@/lib/admin-lessons";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BookOpenText,
  Clock3,
  ExternalLink,
  FileText,
  History,
  Pencil,
  Search,
} from "lucide-react";

type LessonFilter = "ALL" | "PUBLISHED" | "DRAFT";

const STATE_LABEL_KEYS: Record<LessonEditorState, string> = {
  PUBLISHED: "admin.lessons.status_published",
  PUBLISHED_WITH_DRAFT: "admin.lessons.status_published_with_draft",
  UNPUBLISHED: "admin.lessons.status_unpublished",
  UNPUBLISHED_WITH_DRAFT: "admin.lessons.status_unpublished_with_draft",
};

const STATE_BADGE_CLASSES: Record<LessonEditorState, string> = {
  PUBLISHED:
    "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  PUBLISHED_WITH_DRAFT:
    "border-amber-200 bg-amber-500/10 text-amber-700",
  UNPUBLISHED:
    "border-border bg-muted text-muted-foreground",
  UNPUBLISHED_WITH_DRAFT:
    "border-orange-200 bg-orange-500/10 text-orange-700",
};

const DATE_LOCALES: Record<string, string> = {
  en: "en-BE",
  ar: "ar-BE",
  nl: "nl-BE",
  fr: "fr-BE",
};

function getLessonTitle(
  lesson: AdminLessonSummary,
  language: string,
): string {
  const titles: Record<string, string> = {
    en: lesson.titleEn,
    ar: lesson.titleAr,
    nl: lesson.titleNl,
    fr: lesson.titleFr,
  };

  return titles[language] || lesson.titleEn || lesson.lessonCode;
}

function formatUpdatedAt(
  value: string,
  language: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    DATE_LOCALES[language] ?? DATE_LOCALES.en,
    {
      dateStyle: "medium",
    },
  ).format(date);
}

export default function AdminLessonsPage() {
  const { t, language, isRTL } = useLanguage();

  const [lessons, setLessons] = useState<AdminLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<LessonFilter>("ALL");

  const loadLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setServiceUnavailable(false);

      const data = await getAdminLessons();
      setLessons(data);
    } catch (err) {
      logApiError("Failed to load Admin lessons", err);

      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        setError(t("admin.lessons.load_error"));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  const filteredLessons = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();

    return lessons.filter((lesson) => {
      const matchesFilter =
        filter === "ALL"
          ? true
          : filter === "DRAFT"
            ? lesson.hasDraft
            : lesson.active;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        lesson.lessonCode,
        lesson.titleEn,
        lesson.titleAr,
        lesson.titleNl,
        lesson.titleFr,
      ].some((value) =>
        value?.toLocaleLowerCase().includes(query),
      );
    });
  }, [filter, lessons, searchQuery]);

  const draftCount =
    lessons.filter((lesson) => lesson.hasDraft).length;

  const publishedCount =
    lessons.filter((lesson) => lesson.active).length;

  if (loading && lessons.length === 0) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-32 rounded-3xl border border-border/50 bg-card" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-56 rounded-2xl border border-border/50 bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && lessons.length === 0) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="font-semibold text-destructive">
          {error}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void loadLessons()}
        >
          {t("admin.lessons.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="space-y-5"
    >
      {serviceUnavailable ? (
        <ServiceUnavailableBanner
          onRetry={() => void loadLessons()}
        />
      ) : null}

      <AdminPageHeader
        icon={<BookOpenText className="h-6 w-6" />}
        title={t("admin.lessons.title")}
        description={t("admin.lessons.description")}
        metrics={[
          {
            label: t("admin.lessons.total"),
            value: lessons.length.toLocaleString(),
            icon: <BookOpenText className="h-4 w-4" />,
            tone: "primary",
          },
          {
            label: t("admin.lessons.published"),
            value: publishedCount.toLocaleString(),
            icon: <FileText className="h-4 w-4" />,
            tone: "success",
          },
          {
            label: t("admin.lessons.with_draft"),
            value: draftCount.toLocaleString(),
            icon: <History className="h-4 w-4" />,
            tone: draftCount > 0 ? "warning" : "default",
          },
        ]}
      />

      <AdminSectionCard
        title={t("admin.lessons.list_title")}
        description={t("admin.lessons.list_description")}
        actions={
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1"
          >
            {filteredLessons.length} / {lessons.length}
          </Badge>
        }
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="admin-lessons-search"
              name="lessonSearch"
              type="search"
              autoComplete="off"
              aria-label={t("admin.lessons.search_label")}
              placeholder={t("admin.lessons.search_placeholder")}
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              className="ps-10"
            />
          </div>

          <select
            id="admin-lessons-status-filter"
            name="lessonStatusFilter"
            aria-label={t("admin.lessons.filter_label")}
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as LessonFilter)
            }
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/40"
          >
            <option value="ALL">
              {t("admin.lessons.filter_all")}
            </option>
            <option value="PUBLISHED">
              {t("admin.lessons.filter_published")}
            </option>
            <option value="DRAFT">
              {t("admin.lessons.filter_draft")}
            </option>
          </select>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Search className="h-5 w-5" />
            </div>
            <h2 className="font-black text-foreground">
              {t("admin.lessons.empty_title")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {t("admin.lessons.empty_description")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredLessons.map((lesson) => {
              const title =
                getLessonTitle(lesson, language);

              return (
                <article
                  key={lesson.id}
                  className="flex min-w-0 flex-col rounded-2xl border border-border/50 bg-background p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          dir="ltr"
                          className="rounded-lg bg-primary/10 px-2 py-1 font-mono text-[11px] font-bold text-primary"
                        >
                          {lesson.lessonCode}
                        </span>

                        <Badge
                          variant="outline"
                          className={cn(
                            "border text-[11px] font-semibold",
                            STATE_BADGE_CLASSES[lesson.editorState],
                          )}
                        >
                          {t(
                            STATE_LABEL_KEYS[
                              lesson.editorState
                            ],
                          )}
                        </Badge>
                      </div>

                      <h2
                        dir="auto"
                        className="line-clamp-2 text-lg font-black leading-6 text-foreground"
                      >
                        {title}
                      </h2>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpenText className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-muted/40 px-3 py-2">
                      <FileText className="mb-1 h-4 w-4 text-primary" />
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {t("admin.lessons.pages")}
                      </p>
                      <p className="font-black text-foreground">
                        {lesson.pageCount}
                      </p>
                    </div>

                    <div className="rounded-xl bg-muted/40 px-3 py-2">
                      <History className="mb-1 h-4 w-4 text-primary" />
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {t("admin.lessons.version")}
                      </p>
                      <p className="font-black text-foreground">
                        V{lesson.currentVersion}
                      </p>
                    </div>

                    <div className="rounded-xl bg-muted/40 px-3 py-2">
                      <Clock3 className="mb-1 h-4 w-4 text-primary" />
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {t("admin.lessons.minutes")}
                      </p>
                      <p className="font-black text-foreground">
                        {lesson.estimatedMinutes}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex min-w-0 items-end justify-between gap-3 border-t border-border/40 pt-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("admin.lessons.updated")}
                      </p>
                      <p className="truncate text-xs font-medium text-foreground">
                        {formatUpdatedAt(
                          lesson.updatedAt,
                          language,
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        className="gap-2"
                        asChild
                      >
                        <Link
                          href={`/admin/lessons/${lesson.lessonCode}/edit`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("admin.lessons.manage")}
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        asChild
                      >
                        <Link
                          href={`/lessons/${lesson.lessonCode}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t("admin.lessons.open_public")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </AdminSectionCard>
    </div>
  );
}
