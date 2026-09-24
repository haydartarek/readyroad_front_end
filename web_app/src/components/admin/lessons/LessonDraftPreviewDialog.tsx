"use client";

import {
  useMemo,
  useState,
} from "react";
import { LessonIcon } from "@/components/lessons/lesson-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import { useLanguage } from "@/contexts/language-context";
import type { AdminLessonDocument } from "@/lib/admin-lessons";
import {
  CheckCircle2,
  FileText,
} from "lucide-react";

type SupportedLanguage =
  | "ar"
  | "nl"
  | "fr"
  | "en";

type LessonDraftPreviewDialogProps = {
  document: AdminLessonDocument;
  open: boolean;
  onOpenChange: (
    open: boolean,
  ) => void;
  initialLanguage: SupportedLanguage;
};

const PREVIEW_LANGUAGES: Array<{
  code: SupportedLanguage;
  labelKey: string;
}> = [
  {
    code: "ar",
    labelKey:
      "admin.lessons.editor.language_ar",
  },
  {
    code: "nl",
    labelKey:
      "admin.lessons.editor.language_nl",
  },
  {
    code: "fr",
    labelKey:
      "admin.lessons.editor.language_fr",
  },
  {
    code: "en",
    labelKey:
      "admin.lessons.editor.language_en",
  },
];

function parseBulletPoints(
  value: string | null,
): string[] {
  const trimmed =
    value?.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (
            item,
          ): item is string =>
            typeof item ===
            "string",
        )
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean);
    }
  } catch {
    // Legacy values are not always JSON arrays.
  }

  return trimmed
    .split(/\r?\n+/)
    .map((item) =>
      item
        .replace(
          /^[•\-*]\s*/,
          "",
        )
        .trim(),
    )
    .filter(Boolean);
}

export default function LessonDraftPreviewDialog({
  document,
  open,
  onOpenChange,
  initialLanguage,
}: LessonDraftPreviewDialogProps) {
  const { t } =
    useLanguage();

  const [
    previewLanguage,
    setPreviewLanguage,
  ] = useState<SupportedLanguage>(
    initialLanguage,
  );

  const pages =
    useMemo(
      () =>
        [...document.pages].sort(
          (a, b) =>
            a.pageNumber -
            b.pageNumber,
        ),
      [document.pages],
    );

  const title =
    document.lesson.title[
      previewLanguage
    ];

  const description =
    document.lesson.description[
      previewLanguage
    ] ?? "";

  const isRTL =
    previewLanguage === "ar";

  return (
    <Dialog
      open={open}
      onOpenChange={
        onOpenChange
      }
    >
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-6xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="font-black">
              {t(
                "admin.lessons.preview.title",
              )}
            </DialogTitle>

            <DialogDescription>
              {t(
                "admin.lessons.preview.description",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PREVIEW_LANGUAGES.map(
              ({
                code,
                labelKey,
              }) => (
                <Button
                  key={code}
                  type="button"
                  size="sm"
                  variant={
                    previewLanguage ===
                    code
                      ? "default"
                      : "outline"
                  }
                  aria-pressed={
                    previewLanguage ===
                    code
                  }
                  onClick={() =>
                    setPreviewLanguage(
                      code,
                    )
                  }
                >
                  {t(
                    labelKey,
                  )}
                </Button>
              ),
            )}
          </div>
        </div>

        <div
          dir={
            isRTL
              ? "rtl"
              : "ltr"
          }
          className="min-w-0 space-y-5 bg-[radial-gradient(circle_at_top,_rgba(223,88,48,0.08),_transparent_32%)] p-4 sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {t(
                "admin.lessons.preview.draft_badge",
              )}
            </Badge>

            <Badge variant="outline">
              {pages.length}{" "}
              {t(
                "admin.lessons.pages",
              )}
            </Badge>

            <Badge variant="outline">
              {
                document.lesson
                  .estimatedMinutes
              }{" "}
              {t(
                "admin.lessons.minutes",
              )}
            </Badge>
          </div>

          <PageHeroSurface>
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-3">
                <PageHeroTitle>
                  {title}
                </PageHeroTitle>

                <PageHeroDescription>
                  {description}
                </PageHeroDescription>
              </div>

              <LessonIcon
                icon={
                  document.lesson
                    .icon
                }
              />
            </div>
          </PageHeroSurface>

          {pages.map((page) => {
            const pageTitle =
              page.title[
                previewLanguage
              ];

            const content =
              page.content[
                previewLanguage
              ] ?? "";

            const paragraphs =
              content
                .split(/\n+/)
                .map((item) =>
                  item.trim(),
                )
                .filter(Boolean);

            const bullets =
              parseBulletPoints(
                page
                  .bulletPointsRaw[
                  previewLanguage
                ],
              );

            return (
              <PageSectionSurface
                key={
                  page.pageNumber
                }
                className="p-0"
              >
                <div className="border-b border-border/40 bg-primary/[0.035] px-4 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        {t(
                          "admin.lessons.editor.page_label",
                        )}{" "}
                        {
                          page.pageNumber
                        }
                      </div>

                      <h2 className="mt-1 break-words text-xl font-black text-foreground">
                        {pageTitle}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 space-y-5 px-4 py-5 sm:px-6 sm:py-6">
                  <div className="space-y-4">
                    {paragraphs.map(
                      (
                        paragraph,
                        index,
                      ) => (
                        <p
                          key={
                            index
                          }
                          className="break-words text-[0.98rem] leading-8 text-foreground/85"
                        >
                          {
                            paragraph
                          }
                        </p>
                      ),
                    )}
                  </div>

                  {bullets.length >
                  0 ? (
                    <div className="rounded-2xl border border-border/50 bg-muted/25 px-5 py-4">
                      <h3 className="mb-3 text-sm font-black text-foreground">
                        {t(
                          "admin.lessons.preview.key_takeaways",
                        )}
                      </h3>

                      <ul className="space-y-2.5">
                        {bullets.map(
                          (
                            bullet,
                          ) => (
                            <li
                              key={
                                bullet
                              }
                              className="flex items-start gap-3"
                            >
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                              <span className="min-w-0 break-words text-sm leading-6 text-foreground/90">
                                {
                                  bullet
                                }
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </PageSectionSurface>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
