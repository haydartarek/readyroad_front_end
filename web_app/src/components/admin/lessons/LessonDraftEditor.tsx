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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  saveAdminLessonDraft,
  purgeAdminLessonMedia,
  uploadAdminLessonMedia,
  type AdminLessonDocument,
  type AdminLessonDraft,
  type AdminLessonMediaAsset,
} from "@/lib/admin-lessons";
import { adminLessonMediaUrl } from "@/lib/admin-lesson-media";
import { logApiError } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import {
  AlertTriangle,
  Check,
  Eye,
  ImageIcon,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Save,
  Send,
  Trash2,
} from "lucide-react";

type SupportedLanguage =
  | "ar"
  | "nl"
  | "fr"
  | "en";

type LessonDraftEditorProps = {
  idOrCode: string;
  draft: AdminLessonDraft;
  mediaAssets?: AdminLessonMediaAsset[];
  onSaved: (
    draft: AdminLessonDraft,
  ) => void;
  onDirtyChange?: (
    dirty: boolean,
  ) => void;
  externalConflict?: boolean;
  onConflictChange?: (
    conflict: boolean,
  ) => void;
  publishing?: boolean;
  onPublish?: () => void;
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
  mediaAssets,
  onSaved,
  onDirtyChange,
  externalConflict = false,
  onConflictChange,
  publishing = false,
  onPublish,
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
    availableMediaAssets,
    setAvailableMediaAssets,
  ] = useState<AdminLessonMediaAsset[]>(
    () => mediaAssets ?? [],
  );

  const [
    uploadingPageNumber,
    setUploadingPageNumber,
  ] = useState<number | null>(
    null,
  );

  const [
    deletingAssetId,
    setDeletingAssetId,
  ] = useState<number | null>(
    null,
  );
  const [
    pendingDeleteAssetId,
    setPendingDeleteAssetId,
  ] = useState<number | null>(null);

  const [
    imageUploadError,
    setImageUploadError,
  ] = useState<string | null>(
    null,
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

  const effectiveConflict =
    conflict ||
    externalConflict;

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

  const skipNextDraftHydrationRevisionRef =
    useRef<number | null>(
      null,
    );

  const fileInputRefs =
    useRef<
      Record<
        number,
        HTMLInputElement | null
      >
    >({});

  useEffect(() => {
    if (mediaAssets) {
      setAvailableMediaAssets(
        mediaAssets,
      );
    }
  }, [mediaAssets]);

  useEffect(() => {
    if (
      skipNextDraftHydrationRevisionRef.current ===
      draft.revision
    ) {
      skipNextDraftHydrationRevisionRef.current =
        null;

      setRevision(
        draft.revision,
      );

      setSaveError(null);
      setConflict(false);
      onConflictChange?.(false);
      return;
    }

    const nextDocument =
      cloneDocument(
        draft.document,
      );

    setDocument(nextDocument);

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
    onConflictChange?.(false);

    const echoedLocalSave =
      lastSavedRevisionRef.current ===
      draft.revision;

    if (!echoedLocalSave) {
      setSaveSuccess(false);
    }

    lastSavedRevisionRef.current =
      null;
  }, [
    draft,
    onConflictChange,
  ]);

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

  const mediaById =
    useMemo(
      () =>
        new Map(
          availableMediaAssets.map(
            (asset) => [
              asset.id,
              asset,
            ],
          ),
        ),
      [availableMediaAssets],
    );
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

  const uploadPageImage =
    async (
      pageNumber: number,
      file: File,
    ) => {
      if (
        uploadingPageNumber !==
        null || deletingAssetId !== null
      ) {
        return;
      }

      try {
        setUploadingPageNumber(
          pageNumber,
        );

        setImageUploadError(
          null,
        );

        const uploadedAsset =
          await uploadAdminLessonMedia(
            idOrCode,
            file,
            `${document.lesson.lessonCode}-page-${pageNumber}`,
          );

        setAvailableMediaAssets(
          (current) => [
            uploadedAsset,
            ...current.filter(
              (asset) =>
                asset.id !==
                uploadedAsset.id,
            ),
          ],
        );

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
                        imageAssetId:
                          uploadedAsset.id,
                      }
                    : page,
              ),
          }),
        );
      } catch (error) {
        logApiError(
          "Lesson image upload failed",
          error,
        );

        setImageUploadError(
          t(
            "admin.lessons.editor.image_upload_error",
          ),
        );
      } finally {
        setUploadingPageNumber(
          null,
        );
      }
    };

  const deletePageImage =
    async (
      assetId: number,
    ) => {
      if (
        uploadingPageNumber !== null ||
        deletingAssetId !== null ||
        saving ||
        publishing ||
        effectiveConflict
      ) {
        return;
      }

      try {
        setDeletingAssetId(assetId);
        setImageUploadError(null);

        const updatedDraft =
          await purgeAdminLessonMedia(
            assetId,
          );

        setAvailableMediaAssets(
          (current) =>
            current.filter(
              (asset) => asset.id !== assetId,
            ),
        );

        const clearReferences = (current: AdminLessonDocument): AdminLessonDocument => ({
          ...current,
          pages: current.pages.map((page) =>
            page.imageAssetId === assetId
              ? { ...page, imageAssetId: null }
              : page,
          ),
        });
        setDocument(clearReferences);
        setBaseline((current) => JSON.stringify(clearReferences(JSON.parse(current))));
        if (updatedDraft) {
          setRevision(
            updatedDraft.revision,
          );

          skipNextDraftHydrationRevisionRef.current =
            updatedDraft.revision;

          onSaved(
            updatedDraft,
          );
        }
        setPendingDeleteAssetId(null);
      } catch (error) {
        logApiError(
          "Lesson image purge failed",
          error,
        );
        setImageUploadError(
          t(
            "admin.lessons.editor.image_delete_error",
          ),
        );
      } finally {
        setDeletingAssetId(null);
      }
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
  const updateTitle =
    (
      value: string,
    ) => {
      clearTransientStatus();

      setDocument(
        (current) => ({
          ...current,

          lesson: {
            ...current.lesson,

            title: {
              ...current.lesson.title,

              [contentLanguage]:
                value,
            },
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


  const validateDocument =
    (): string | null => {
      const invalidLessonTitle =
        CONTENT_LANGUAGES.some(
          ({ code }) =>
            !document.lesson.title[
              code
            ].trim(),
        );

      if (invalidLessonTitle) {
        return t(
          "admin.lessons.editor.validation_lesson_title",
        );
      }

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
        effectiveConflict
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
        onConflictChange?.(false);

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
          onConflictChange?.(true);
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

  const titleValue =
    document.lesson.title[
      contentLanguage
    ] ?? "";

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
            variant={
              dirty
                ? "default"
                : "outline"
            }
            className="gap-2"
            disabled={
              !dirty ||
              saving ||
              effectiveConflict
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

          <Button
            type="button"
            variant={
              dirty
                ? "outline"
                : "default"
            }
            className="gap-2"
            disabled={
              dirty ||
              saving ||
              effectiveConflict ||
              publishing ||
              !onPublish
            }
            onClick={onPublish}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}

            {publishing
              ? t(
                  "admin.lessons.publish.publishing",
                )
              : t(
                  "admin.lessons.publish.button",
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

      {effectiveConflict ? (
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

      {imageUploadError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive"
        >
          {imageUploadError}
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
          htmlFor="lesson-draft-title"
          className="text-sm font-bold text-foreground"
        >
          {t(
            "admin.lessons.editor.field_title",
          )}
        </label>

        <input
          id="lesson-draft-title"
          aria-label={t(
            "admin.lessons.editor.field_title",
          )}
          dir={fieldDirection}
          value={titleValue}
          onChange={(event) =>
            updateTitle(
              event.target.value,
            )
          }
          className="h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-semibold shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

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


            const imageInputId =
              `lesson-page-${page.pageNumber}-image`;

            const imageAsset =
              page.imageAssetId
                ? mediaById.get(
                    page.imageAssetId,
                  )
                : undefined;

            const imageUrl =
              adminLessonMediaUrl(
                imageAsset,
              );

            const isUploadingImage =
              uploadingPageNumber ===
              page.pageNumber;

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

                <div className="space-y-3 rounded-xl border border-border/50 bg-muted/15 p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {t(
                          "admin.lessons.editor.page_image",
                        )}
                      </p>

                      <p className="text-xs leading-5 text-muted-foreground">
                        {t(
                          "admin.lessons.editor.page_image_help",
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 gap-2"
                        disabled={
                          uploadingPageNumber !==
                            null ||
                          deletingAssetId !== null ||
                          saving ||
                          publishing ||
                          effectiveConflict
                        }
                        onClick={() =>
                          fileInputRefs.current[
                            page.pageNumber
                          ]?.click()
                        }
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4" />
                        )}

                        {isUploadingImage
                          ? t(
                              "admin.lessons.editor.uploading_image",
                            )
                          : imageUrl
                            ? t(
                                "admin.lessons.editor.change_image",
                              )
                            : t(
                                "admin.lessons.editor.upload_image",
                              )}
                      </Button>

                      {imageUrl && page.imageAssetId ? (
                        <Button
                          type="button"
                          variant="destructive"
                          className="shrink-0 gap-2"
                          disabled={
                            uploadingPageNumber !== null ||
                            deletingAssetId !== null ||
                            saving ||
                            publishing ||
                            effectiveConflict
                          }
                          onClick={() => setPendingDeleteAssetId(page.imageAssetId as number)}
                        >
                          {deletingAssetId === page.imageAssetId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {t(
                            "admin.lessons.editor.delete_image_permanently",
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <input
                    ref={(node) => {
                      fileInputRefs.current[
                        page.pageNumber
                      ] = node;
                    }}
                    id={imageInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={
                      uploadingPageNumber !==
                      null
                    }
                    onChange={(event) => {
                      const file =
                        event.currentTarget
                          .files?.[0];

                      event.currentTarget.value =
                        "";

                      if (file) {
                        void uploadPageImage(
                          page.pageNumber,
                          file,
                        );
                      }
                    }}
                  />

                  {imageUrl ? (
                    <div
                      role="img"
                      aria-label={`${t(
                        "admin.lessons.editor.page_image",
                      )} ${page.pageNumber}`}
                      className="aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-muted bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage:
                          `url("${imageUrl}")`,
                      }}
                    />
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 text-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/60" />

                      <p className="text-sm font-semibold text-muted-foreground">
                        {t(
                          "admin.lessons.editor.no_page_image",
                        )}
                      </p>
                    </div>
                  )}
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

              </article>
            );
          },
        )}
      </div>

      <Dialog
        open={pendingDeleteAssetId !== null}
        onOpenChange={(open) => {
          if (!open && deletingAssetId === null) {
            setPendingDeleteAssetId(null);
          }
        }}
      >
        <DialogContent
          dir={contentLanguage === "ar" ? "rtl" : "ltr"}
          className="w-[calc(100vw-2rem)] max-w-lg rounded-3xl"
        >
          <DialogHeader className="text-start">
            <DialogTitle className="text-start">
              {t("admin.lessons.editor.delete_image_permanently")}
            </DialogTitle>
            <DialogDescription className="text-start leading-6">
              {t("admin.lessons.editor.confirm_delete_image")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={deletingAssetId !== null}
              onClick={() => setPendingDeleteAssetId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                deletingAssetId !== null ||
                pendingDeleteAssetId === null ||
                saving ||
                publishing ||
                effectiveConflict
              }
              onClick={() => {
                if (pendingDeleteAssetId !== null) {
                  void deletePageImage(pendingDeleteAssetId);
                }
              }}
            >
              {deletingAssetId !== null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {t("admin.lessons.editor.delete_image_permanently")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
        mediaAssets={
          availableMediaAssets
        }
      />
    </AdminSectionCard>
  );
}
