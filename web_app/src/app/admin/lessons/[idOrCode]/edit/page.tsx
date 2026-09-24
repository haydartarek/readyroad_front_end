"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import Link from "@/components/localized-link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSectionCard from "@/components/admin/AdminSectionCard";
import LessonDraftEditor from "@/components/admin/lessons/LessonDraftEditor";
import LessonVersionHistory from "@/components/admin/lessons/LessonVersionHistory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { useLanguage } from "@/contexts/language-context";
import {
  getAdminLesson,
  getAdminLessonVersions,
  getOrCreateAdminLessonDraft,
  type AdminLessonDetail,
  type AdminLessonDocumentLanguageMap,
} from "@/lib/admin-lessons";
import {
  isServiceUnavailable,
  logApiError,
} from "@/lib/api";
import {
  ArrowLeft,
  BookOpenText,
  Clock3,
  ExternalLink,
  FileText,
  History,
  Loader2,
  PencilLine,
} from "lucide-react";

type SupportedLanguage =
  | "en"
  | "ar"
  | "nl"
  | "fr";

function localizedValue(
  values: AdminLessonDocumentLanguageMap,
  language: string,
): string {
  const selectedLanguage =
    language as SupportedLanguage;

  return (
    values[selectedLanguage] ??
    values.en ??
    values.nl ??
    values.fr ??
    values.ar ??
    ""
  );
}

function lessonTitle(
  lesson: AdminLessonDetail,
  language: string,
): string {
  const titles: Record<
    SupportedLanguage,
    string
  > = {
    en: lesson.titleEn,
    ar: lesson.titleAr,
    nl: lesson.titleNl,
    fr: lesson.titleFr,
  };

  const selectedLanguage =
    language as SupportedLanguage;

  return (
    titles[selectedLanguage] ||
    lesson.titleEn ||
    lesson.lessonCode
  );
}

export default function AdminLessonEditorPage() {
  const params =
    useParams<{ idOrCode: string }>();

  const {
    t,
    language,
    isRTL,
  } = useLanguage();

  const idOrCode =
    decodeURIComponent(
      params.idOrCode ?? "",
    );

  const [lesson, setLesson] =
    useState<AdminLessonDetail | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    serviceUnavailable,
    setServiceUnavailable,
  ] = useState(false);
  const [
    hasUnsavedChanges,
    setHasUnsavedChanges,
  ] = useState(false);
  const [
    startingDraft,
    setStartingDraft,
  ] = useState(false);

  const [
    draftActionError,
    setDraftActionError,
  ] = useState<string | null>(
    null,
  );

  const loadLesson =
    useCallback(async () => {
      if (!idOrCode) {
        setError(
          t(
            "admin.lessons.editor.load_error",
          ),
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setServiceUnavailable(false);

        const data =
          await getAdminLesson(
            idOrCode,
          );

        let versions =
          data.versions;

        try {
          versions =
            await getAdminLessonVersions(
              idOrCode,
            );
        } catch (versionError) {
          logApiError(
            "Failed to load Admin lesson version history",
            versionError,
          );
        }

        setLesson({
          ...data,
          versions,
        });
      } catch (err) {
        logApiError(
          "Failed to load Admin lesson editor",
          err,
        );

        if (
          isServiceUnavailable(err)
        ) {
          setServiceUnavailable(true);
        } else {
          setError(
            t(
              "admin.lessons.editor.load_error",
            ),
          );
        }
      } finally {
        setLoading(false);
      }
    }, [idOrCode, t]);

  useEffect(() => {
    void loadLesson();
  }, [loadLesson]);
  const startEditing =
    async () => {
      if (
        !lesson ||
        lesson.draft ||
        startingDraft
      ) {
        return;
      }

      try {
        setStartingDraft(true);
        setDraftActionError(null);
        setServiceUnavailable(false);

        const draft =
          await getOrCreateAdminLessonDraft(
            idOrCode,
          );

        setLesson(
          (current) =>
            current
              ? {
                  ...current,
                  draft,
                }
              : current,
        );
      } catch (err) {
        logApiError(
          "Failed to start Admin lesson draft",
          err,
        );

        if (
          isServiceUnavailable(err)
        ) {
          setServiceUnavailable(true);
        }

        setDraftActionError(
          t(
            "admin.lessons.editor.draft_start_error",
          ),
        );
      } finally {
        setStartingDraft(false);
      }
    };

  const confirmInternalNavigation =
    (
      event: {
        preventDefault: () => void;
      },
    ) => {
      if (!hasUnsavedChanges) {
        return;
      }

      const confirmed =
        window.confirm(
          t(
            "admin.lessons.editor.unsaved_navigation_warning",
          ),
        );

      if (!confirmed) {
        event.preventDefault();
      }
    };
  const selectedTitle =
    useMemo(
      () =>
        lesson
          ? lessonTitle(
              lesson,
              language,
            )
          : "",
      [language, lesson],
    );

  if (
    loading &&
    !lesson
  ) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-32 rounded-3xl border border-border/50 bg-card" />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-[28rem] rounded-2xl border border-border/50 bg-card" />
          <div className="h-72 rounded-2xl border border-border/50 bg-card" />
        </div>
      </div>
    );
  }

  if (
    serviceUnavailable &&
    !lesson
  ) {
    return (
      <ServiceUnavailableBanner
        onRetry={() =>
          void loadLesson()
        }
      />
    );
  }

  if (
    error &&
    !lesson
  ) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="font-semibold text-destructive">
          {error}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void loadLesson()
            }
          >
            {t(
              "admin.lessons.retry",
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            asChild
          >
            <Link
                href="/admin/lessons"
                onClick={
                  confirmInternalNavigation
                }
              >
              {t(
                "admin.lessons.editor.back_to_lessons",
              )}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  const document =
    lesson.draft?.document ??
    lesson.publishedDocument;

  const description =
    localizedValue(
      document.lesson.description,
      language,
    );

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="space-y-5"
    >
      {serviceUnavailable ? (
        <ServiceUnavailableBanner
          onRetry={() =>
            void loadLesson()
          }
        />
      ) : null}

      <AdminPageHeader
        icon={
          <BookOpenText className="h-6 w-6" />
        }
        title={selectedTitle}
        description={t(
          "admin.lessons.editor.description",
        )}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              asChild
            >
              <Link
                href="/admin/lessons"
                onClick={
                  confirmInternalNavigation
                }
              >
                <ArrowLeft className="h-4 w-4" />
                {t(
                  "admin.lessons.editor.back_to_lessons",
                )}
              </Link>
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              asChild
            >
              <Link
                href={`/lessons/${lesson.lessonCode}`}
                onClick={
                  confirmInternalNavigation
                }
              >
                <ExternalLink className="h-4 w-4" />
                {t(
                  "admin.lessons.open_public",
                )}
              </Link>
            </Button>
          </div>
        }
        metrics={[
          {
            label: t(
              "admin.lessons.version",
            ),
            value:
              `V${lesson.currentVersion}`,
            icon: (
              <History className="h-4 w-4" />
            ),
            tone: "primary",
          },
          {
            label: t(
              "admin.lessons.pages",
            ),
            value:
              lesson.pageCount.toLocaleString(),
            icon: (
              <FileText className="h-4 w-4" />
            ),
            tone: "default",
          },
          {
            label: t(
              "admin.lessons.minutes",
            ),
            value:
              lesson.estimatedMinutes.toLocaleString(),
            icon: (
              <Clock3 className="h-4 w-4" />
            ),
            tone: "default",
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {lesson.draft ? (
          <LessonDraftEditor
            idOrCode={idOrCode}
            draft={lesson.draft}
            onSaved={(draft) => {
              setLesson(
                (current) =>
                  current
                    ? {
                        ...current,
                        draft,
                      }
                    : current,
              );
            }}
            onDirtyChange={
              setHasUnsavedChanges
            }
          />
        ) : (
          <AdminSectionCard
            title={t(
              "admin.lessons.editor.content_title",
            )}
            description={t(
              "admin.lessons.editor.content_description",
            )}
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t(
                    "admin.lessons.editor.lesson_description",
                  )}
                </p>

                <p
                  dir="auto"
                  className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground"
                >
                  {description ||
                    t(
                      "admin.lessons.editor.no_description",
                    )}
                </p>
              </div>

              <div className="space-y-3">
                {document.pages.map(
                  (page) => {
                    const title =
                      localizedValue(
                        page.title,
                        language,
                      );

                    const content =
                      localizedValue(
                        page.content,
                        language,
                      );

                    return (
                      <article
                        key={
                          page.pageNumber
                        }
                        className="rounded-2xl border border-border/50 bg-background p-4"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            dir="ltr"
                            className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 px-2 text-xs font-black text-primary"
                          >
                            {
                              page.pageNumber
                            }
                          </span>

                          <div className="min-w-0">
                            <h2
                              dir="auto"
                              className="font-black leading-6 text-foreground"
                            >
                              {title}
                            </h2>

                            <p
                              dir="auto"
                              className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
                            >
                              {content}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </div>
          </AdminSectionCard>
        )}
        <div className="space-y-5">
          <AdminSectionCard
            title={t(
              "admin.lessons.editor.status_title",
            )}
            description={t(
              "admin.lessons.editor.status_description",
            )}
          >
            <dl className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-muted-foreground">
                  {t(
                    "admin.lessons.editor.lesson_code",
                  )}
                </dt>

                <dd
                  dir="ltr"
                  className="font-mono text-sm font-bold text-foreground"
                >
                  {lesson.lessonCode}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-muted-foreground">
                  {t(
                    "admin.lessons.editor.publication",
                  )}
                </dt>

                <dd>
                  <Badge variant="outline">
                    {lesson.active
                      ? t(
                          "admin.lessons.status_published",
                        )
                      : t(
                          "admin.lessons.status_unpublished",
                        )}
                  </Badge>
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-muted-foreground">
                  {t(
                    "admin.lessons.editor.draft_status",
                  )}
                </dt>

                <dd>
                  <Badge variant="outline">
                    {lesson.draft
                      ? t(
                          "admin.lessons.editor.draft_exists",
                        )
                      : t(
                          "admin.lessons.editor.no_draft",
                        )}
                  </Badge>
                </dd>
              </div>

              {lesson.draft ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">
                    {t(
                      "admin.lessons.editor.draft_revision",
                    )}
                  </dt>

                  <dd
                    dir="ltr"
                    className="text-sm font-bold text-foreground"
                  >
                    R
                    {
                      lesson.draft
                        .revision
                    }
                  </dd>
                </div>
              ) : null}
            </dl>
          </AdminSectionCard>

          <LessonVersionHistory
            versions={
              lesson.versions
            }
          />

          <AdminSectionCard
            title={t(
              "admin.lessons.editor.scope_title",
            )}
          >
            {lesson.draft ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  {t(
                    "admin.lessons.editor.draft_ready_notice",
                  )}
                </p>

                <Badge
                  variant="outline"
                  className="font-mono"
                >
                  R{lesson.draft.revision}
                </Badge>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  {t(
                    "admin.lessons.editor.read_only_notice",
                  )}
                </p>

                {draftActionError ? (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-destructive"
                  >
                    {draftActionError}
                  </p>
                ) : null}

                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={startingDraft}
                  onClick={() =>
                    void startEditing()
                  }
                >
                  {startingDraft ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PencilLine className="h-4 w-4" />
                  )}

                  {startingDraft
                    ? t(
                        "admin.lessons.editor.starting_editing",
                      )
                    : t(
                        "admin.lessons.editor.start_editing",
                      )}
                </Button>
              </div>
            )}
          </AdminSectionCard>
        </div>
      </div>
    </div>
  );
}
