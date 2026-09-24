"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AdminSectionCard from "@/components/admin/AdminSectionCard";
import LessonDraftPreviewDialog from "@/components/admin/lessons/LessonDraftPreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  saveAdminLessonDraft,
  type AdminLessonDocument,
  type AdminLessonDraft,
} from "@/lib/admin-lessons";
import { logApiError } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import {
  AlertTriangle,
  Check,
  Eye,
  Loader2,
  LockKeyhole,
  Save,
} from "lucide-react";

type SupportedLanguage =
  | "ar"
  | "nl"
  | "fr"
  | "en";

type LessonDraftEditorProps = {
  idOrCode: string;
  draft: AdminLessonDraft;
  onSaved: (
    draft: AdminLessonDraft,
  ) => void;
  onDirtyChange?: (
    dirty: boolean,
  ) => void;
};

const CONTENT_LANGUAGES: Array<{
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

const REQUIRED_TITLE_LANGUAGES: SupportedLanguage[] = [
  "ar",
  "nl",
  "fr",
  "en",
];

function isSupportedLanguage(
  value: string,
): value is SupportedLanguage {
  return CONTENT_LANGUAGES.some(
    ({ code }) => code === value,
  );
}

function cloneDocument(
  document: AdminLessonDocument,
): AdminLessonDocument {
  return JSON.parse(
    JSON.stringify(document),
  ) as AdminLessonDocument;
}

function getErrorStatus(
  error: unknown,
): number | undefined {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return undefined;
  }

  if (
    "status" in error &&
    typeof (
      error as {
        status?: unknown;
      }
    ).status === "number"
  ) {
    return (
      error as {
        status: number;
      }
    ).status;
  }

  if ("response" in error) {
    const response =
      (
        error as {
          response?: {
            status?: unknown;
          };
        }
      ).response;

    if (
      response &&
      typeof response.status === "number"
    ) {
      return response.status;
    }
  }

  return undefined;
}

function optionalText(
  value: string,
): string | null {
  return value === ""
    ? null
    : value;
}

export default function LessonDraftEditor({
  idOrCode,
  draft,
  onSaved,
  onDirtyChange,
}: LessonDraftEditorProps) {
  const {
    t,
    language,
  } = useLanguage();

  const initialLanguage:
    SupportedLanguage =
      isSupportedLanguage(language)
        ? language
        : "en";

  const [
    contentLanguage,
    setContentLanguage,
  ] = useState<SupportedLanguage>(
    initialLanguage,
  );

  const [
    document,
    setDocument,
  ] = useState<AdminLessonDocument>(
    () =>
      cloneDocument(
        draft.document,
      ),
  );

  const [
    baseline,
    setBaseline,
  ] = useState(
    () =>
      JSON.stringify(
        draft.document,
      ),
  );

  const [
    revision,
    setRevision,
  ] = useState(
    draft.revision,
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saveError,
    setSaveError,
  ] = useState<string | null>(
    null,
  );

  const [
    conflict,
    setConflict,
  ] = useState(false);

  const [
    saveSuccess,
    setSaveSuccess,
  ] = useState(false);

  const [
    previewOpen,
    setPreviewOpen,
  ] = useState(false);

  const lastSavedRevisionRef =
    useRef<number | null>(
      null,
    );

  useEffect(() => {
    const nextDocument =
      cloneDocument(
        draft.document,
      );

    setDocument(
      nextDocument,
    );

    setBaseline(
      JSON.stringify(
        nextDocument,
      ),
    );

    setRevision(
      draft.revision,
    );

    setSaveError(null);
    setConflict(false);

    const echoedLocalSave =
      lastSavedRevisionRef.current ===
      draft.revision;

    if (!echoedLocalSave) {
      setSaveSuccess(false);
    }

    lastSavedRevisionRef.current =
      null;
  }, [draft]);

  const serializedDocument =
    useMemo(
      () =>
        JSON.stringify(
          document,
        ),
      [document],
    );

  const dirty =
    serializedDocument !== baseline;
  useEffect(() => {
    onDirtyChange?.(
      dirty,
    );
  }, [
    dirty,
    onDirtyChange,
  ]);

  useEffect(
    () => () => {
      onDirtyChange?.(
        false,
      );
    },
    [onDirtyChange],
  );

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const handleBeforeUnload =
      (
        event: BeforeUnloadEvent,
      ) => {
        event.preventDefault();
        event.returnValue = "";
      };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );
    };
  }, [dirty]);

  const fieldDirection =
    contentLanguage === "ar"
      ? "rtl"
      : "ltr";

  const clearTransientStatus =
    () => {
      setSaveError(null);
      setSaveSuccess(false);
    };

  const updateIcon =
    (
      value: string,
    ) => {
      clearTransientStatus();

      setDocument(
        (current) => ({
          ...current,

          lesson: {
            ...current.lesson,
            icon:
              optionalText(
                value,
              ),
          },
        }),
      );
    };

  const updateDisplayOrder =
    (
      value: string,
    ) => {
      const parsed =
        Number(value);

      if (
        !Number.isInteger(parsed) ||
        parsed < 0
      ) {
        return;
      }

      clearTransientStatus();

      setDocument(
        (current) => ({
          ...current,

          lesson: {
            ...current.lesson,
            displayOrder:
              parsed,
          },
        }),
      );
    };

  const updateEstimatedMinutes =
    (
      value: string,
    ) => {
      const parsed =
        Number(value);

      if (
        !Number.isInteger(parsed) ||
        parsed < 1
      ) {
        return;
      }

      clearTransientStatus();

      setDocument(
        (current) => ({
          ...current,

          lesson: {
            ...current.lesson,
            estimatedMinutes:
              parsed,
          },
        }),
      );
    };
  const updateDescription =
    (
      value: string,
    ) => {
      clearTransientStatus();

      setDocument(
        (current) => ({
          ...current,

          lesson: {
            ...current.lesson,

            description: {
              ...current.lesson.description,

              [contentLanguage]:
                optionalText(
                  value,
                ),
            },
          },
        }),
      );
    };

  const updatePageTitle =
    (
      pageNumber: number,
      value: string,
    ) => {
      clearTransientStatus();

      setDocument(
        (current) => ({
          ...current,

          pages:
            current.pages.map(
              (page) =>
                page.pageNumber ===
                pageNumber
                  ? {
                      ...page,

                      title: {
                        ...page.title,

                        [contentLanguage]:
                          value,
                      },
                    }
                  : page,
            ),
        }),
      );
    };

  const updatePageContent =
    (
      pageNumber: number,
      value: string,
    ) => {
      clearTransientStatus();

      setDocument(
        (current) => ({
          ...current,

          pages:
            current.pages.map(
              (page) =>
                page.pageNumber ===
                pageNumber
                  ? {
                      ...page,

                      content: {
                        ...page.content,

                        [contentLanguage]:
                          optionalText(
                            value,
                          ),
                      },
                    }
                  : page,
            ),
        }),
      );
    };

  const updatePageBullets =
    (
      pageNumber: number,
      value: string,
    ) => {
      clearTransientStatus();

      setDocument(
        (current) => ({
          ...current,

          pages:
            current.pages.map(
              (page) =>
                page.pageNumber ===
                pageNumber
                  ? {
                      ...page,

                      bulletPointsRaw: {
                        ...page.bulletPointsRaw,

                        [contentLanguage]:
                          optionalText(
                            value,
                          ),
                      },
                    }
                  : page,
            ),
        }),
      );
    };

  const validateDocument =
    (): string | null => {
      if (
        !Number.isInteger(
          document.lesson.displayOrder,
        ) ||
        document.lesson.displayOrder < 0
      ) {
        return t(
          "admin.lessons.editor.validation_display_order",
        );
      }

      if (
        !Number.isInteger(
          document.lesson.estimatedMinutes,
        ) ||
        document.lesson.estimatedMinutes < 1
      ) {
        return t(
          "admin.lessons.editor.validation_estimated_minutes",
        );
      }

      if (
        document.pages.length === 0
      ) {
        return t(
          "admin.lessons.editor.validation_no_pages",
        );
      }

      const invalidPageTitle =
        document.pages.some(
          (page) =>
            REQUIRED_TITLE_LANGUAGES.some(
              (code) =>
                !page.title[
                  code
                ].trim(),
            ),
        );

      if (invalidPageTitle) {
        return t(
          "admin.lessons.editor.validation_page_title",
        );
      }

      return null;
    };

  const saveDraft =
    async () => {
      if (
        !dirty ||
        saving ||
        conflict
      ) {
        return;
      }

      const validationError =
        validateDocument();

      if (validationError) {
        setSaveError(
          validationError,
        );

        setSaveSuccess(false);
        return;
      }

      try {
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        const savedDraft =
          await saveAdminLessonDraft(
            idOrCode,
            {
              expectedRevision:
                revision,

              document:
                cloneDocument(
                  document,
                ),
            },
          );

        const nextDocument =
          cloneDocument(
            savedDraft.document,
          );

        setDocument(
          nextDocument,
        );

        setBaseline(
          JSON.stringify(
            nextDocument,
          ),
        );

        setRevision(
          savedDraft.revision,
        );

        setConflict(false);

        lastSavedRevisionRef.current =
          savedDraft.revision;

        setSaveSuccess(true);

        onSaved(
          savedDraft,
        );
      } catch (error) {
        if (
          getErrorStatus(
            error,
          ) === 409
        ) {
          setConflict(true);
          setSaveError(null);
          setSaveSuccess(false);
        } else {
          logApiError(
            "Failed to save Admin lesson draft",
            error,
          );

          setSaveError(
            t(
              "admin.lessons.editor.save_error",
            ),
          );

          setSaveSuccess(false);
        }
      } finally {
        setSaving(false);
      }
    };

  const descriptionValue =
    document.lesson.description[
      contentLanguage
    ] ?? "";

  return (
    <AdminSectionCard
      title={t(
        "admin.lessons.editor.draft_editor_title",
      )}
      description={t(
        "admin.lessons.editor.draft_editor_description",
      )}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono"
          >
            R{revision}
          </Badge>

          <Badge
            variant="outline"
          >
            {dirty
              ? t(
                  "admin.lessons.editor.unsaved_changes",
                )
              : t(
                  "admin.lessons.editor.saved_state",
                )}
          </Badge>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() =>
              setPreviewOpen(
                true,
              )
            }
          >
            <Eye className="h-4 w-4" />

            {t(
              "admin.lessons.preview.open",
            )}
          </Button>

          <Button
            type="button"
            className="gap-2"
            disabled={
              !dirty ||
              saving ||
              conflict
            }
            onClick={() =>
              void saveDraft()
            }
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving
              ? t(
                  "admin.lessons.editor.saving_draft",
                )
              : t(
                  "admin.lessons.editor.save_draft",
                )}
          </Button>
        </div>
      }
    >
      <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

          <p className="text-sm leading-6 text-muted-foreground">
            {t(
              "admin.lessons.editor.locked_fields_notice",
            )}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-border/50 bg-background p-4">
        <h3 className="font-black text-foreground">
          {t(
            "admin.lessons.editor.metadata_title",
          )}
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label
              htmlFor="lesson-draft-icon"
              className="text-sm font-bold text-foreground"
            >
              {t(
                "admin.lessons.editor.field_icon",
              )}
            </label>

            <input
              id="lesson-draft-icon"
              aria-label={t(
                "admin.lessons.editor.field_icon",
              )}
              dir="ltr"
              value={
                document.lesson.icon ??
                ""
              }
              onChange={(event) =>
                updateIcon(
                  event.target.value,
                )
              }
              className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="lesson-draft-display-order"
              className="text-sm font-bold text-foreground"
            >
              {t(
                "admin.lessons.editor.field_display_order",
              )}
            </label>

            <input
              id="lesson-draft-display-order"
              type="number"
              min={0}
              step={1}
              aria-label={t(
                "admin.lessons.editor.field_display_order",
              )}
              dir="ltr"
              value={
                document.lesson.displayOrder
              }
              onChange={(event) =>
                updateDisplayOrder(
                  event.target.value,
                )
              }
              className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="lesson-draft-estimated-minutes"
              className="text-sm font-bold text-foreground"
            >
              {t(
                "admin.lessons.editor.field_estimated_minutes",
              )}
            </label>

            <input
              id="lesson-draft-estimated-minutes"
              type="number"
              min={1}
              step={1}
              aria-label={t(
                "admin.lessons.editor.field_estimated_minutes",
              )}
              dir="ltr"
              value={
                document.lesson.estimatedMinutes
              }
              onChange={(event) =>
                updateEstimatedMinutes(
                  event.target.value,
                )
              }
              className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-foreground">
          {t(
            "admin.lessons.editor.content_language",
          )}
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CONTENT_LANGUAGES.map(
            ({
              code,
              labelKey,
            }) => (
              <Button
                key={code}
                type="button"
                variant={
                  contentLanguage ===
                  code
                    ? "default"
                    : "outline"
                }
                aria-pressed={
                  contentLanguage ===
                  code
                }
                onClick={() =>
                  setContentLanguage(
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

      {conflict ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

            <div className="space-y-1">
              <p className="font-bold text-destructive">
                {t(
                  "admin.lessons.editor.conflict_title",
                )}
              </p>

              <p className="text-sm leading-6 text-muted-foreground">
                {t(
                  "admin.lessons.editor.conflict_description",
                )}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {saveError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive"
        >
          {saveError}
        </p>
      ) : null}

      {saveSuccess &&
      !dirty ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground"
        >
          <Check className="h-4 w-4" />

          {t(
            "admin.lessons.editor.saved_success",
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="lesson-draft-description"
          className="text-sm font-bold text-foreground"
        >
          {t(
            "admin.lessons.editor.field_description",
          )}
        </label>

        <textarea
          id="lesson-draft-description"
          aria-label={t(
            "admin.lessons.editor.field_description",
          )}
          dir={fieldDirection}
          value={descriptionValue}
          onChange={(event) =>
            updateDescription(
              event.target.value,
            )
          }
          className="min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-6 shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-4">
        {document.pages.map(
          (page) => {
            const titleId =
              `lesson-page-${page.pageNumber}-title`;

            const contentId =
              `lesson-page-${page.pageNumber}-content`;

            const bulletsId =
              `lesson-page-${page.pageNumber}-bullets`;

            return (
              <article
                key={
                  page.pageNumber
                }
                className="space-y-4 rounded-2xl border border-border/50 bg-background p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-foreground">
                    {t(
                      "admin.lessons.editor.page_label",
                    )}{" "}
                    {page.pageNumber}
                  </h3>

                  <Badge
                    variant="outline"
                    className="font-mono"
                  >
                    #{page.pageNumber}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor={titleId}
                    className="text-sm font-bold text-foreground"
                  >
                    {t(
                      "admin.lessons.editor.page_title",
                    )}
                  </label>

                  <input
                    id={titleId}
                    aria-label={`${t(
                      "admin.lessons.editor.page_title",
                    )} ${page.pageNumber}`}
                    dir={fieldDirection}
                    value={
                      page.title[
                        contentLanguage
                      ]
                    }
                    onChange={(event) =>
                      updatePageTitle(
                        page.pageNumber,
                        event.target.value,
                      )
                    }
                    className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor={
                      contentId
                    }
                    className="text-sm font-bold text-foreground"
                  >
                    {t(
                      "admin.lessons.editor.page_content",
                    )}
                  </label>

                  <textarea
                    id={contentId}
                    aria-label={`${t(
                      "admin.lessons.editor.page_content",
                    )} ${page.pageNumber}`}
                    dir={fieldDirection}
                    value={
                      page.content[
                        contentLanguage
                      ] ?? ""
                    }
                    onChange={(event) =>
                      updatePageContent(
                        page.pageNumber,
                        event.target.value,
                      )
                    }
                    className="min-h-40 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-6 shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor={
                      bulletsId
                    }
                    className="text-sm font-bold text-foreground"
                  >
                    {t(
                      "admin.lessons.editor.page_bullets",
                    )}
                  </label>

                  <textarea
                    id={bulletsId}
                    aria-label={`${t(
                      "admin.lessons.editor.page_bullets",
                    )} ${page.pageNumber}`}
                    dir={fieldDirection}
                    value={
                      page.bulletPointsRaw[
                        contentLanguage
                      ] ?? ""
                    }
                    onChange={(event) =>
                      updatePageBullets(
                        page.pageNumber,
                        event.target.value,
                      )
                    }
                    className="min-h-24 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-6 shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>
              </article>
            );
          },
        )}
      </div>

      <LessonDraftPreviewDialog
        key={`${contentLanguage}-${previewOpen ? "open" : "closed"}`}
        document={document}
        open={previewOpen}
        onOpenChange={
          setPreviewOpen
        }
        initialLanguage={
          contentLanguage
        }
      />
    </AdminSectionCard>
  );
}
