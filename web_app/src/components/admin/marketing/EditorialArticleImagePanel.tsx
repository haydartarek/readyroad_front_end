"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FileImage, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { editorialCmsCopy } from "@/lib/editorial-cms-copy";
import type { EditorialArticleImageAsset } from "@/lib/marketing-admin";

type Translate = (
  key: string,
  variables?: Record<string, string | number>,
) => string;

interface EditorialArticleImagePanelProps {
  articleId: number;
  suggestedFileName: string;
  image: EditorialArticleImageAsset | null;
  busy: boolean;
  t: Translate;
  onUpload: (articleId: number, formData: FormData) => Promise<void>;
  onRemove: (articleId: number) => Promise<void>;
}

interface ImageForm {
  altTextAr: string;
  altTextNl: string;
  altTextFr: string;
  altTextEn: string;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function localization(
  image: EditorialArticleImageAsset | null,
  language: "AR" | "NL" | "FR" | "EN",
) {
  return image?.localizations.find((item) => item.language === language)?.altText ?? "";
}

function initialForm(image: EditorialArticleImageAsset | null): ImageForm {
  return {
    altTextAr: localization(image, "AR"),
    altTextNl: localization(image, "NL"),
    altTextFr: localization(image, "FR"),
    altTextEn: localization(image, "EN"),
  };
}

function seoFileName(value: string, fallback: string) {
  const normalized = value
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 128);
  return normalized || fallback;
}

export default function EditorialArticleImagePanel(
  props: EditorialArticleImagePanelProps,
) {
  return (
    <EditorialArticleImagePanelContent
      key={`${props.articleId}:${props.image?.id ?? "empty"}`}
      {...props}
    />
  );
}

function EditorialArticleImagePanelContent({
  articleId,
  suggestedFileName,
  image,
  busy,
  t,
  onUpload,
  onRemove,
}: EditorialArticleImagePanelProps) {
  const { language } = useLanguage();
  const copy = editorialCmsCopy(language);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<ImageForm>(() => initialForm(image));

  useEffect(() => {
    if (!previewUrl || typeof URL.revokeObjectURL !== "function") return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const hero = image?.variants.find((variant) => variant.type === "HERO") ?? null;
  const altText = localization(image, "AR") || localization(image, "EN");
  const storedFileName = useMemo(
    () => seoFileName(suggestedFileName || file?.name || "", `article-${articleId}`),
    [articleId, file?.name, suggestedFileName],
  );
  const valid = Boolean(
    file &&
      file.size <= MAX_UPLOAD_BYTES &&
      storedFileName &&
      form.altTextAr.trim() &&
      form.altTextNl.trim() &&
      form.altTextFr.trim() &&
      form.altTextEn.trim(),
  );

  const update = (field: keyof ImageForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectFile = (nextFile: File | null) => {
    setFileError(null);
    if (!nextFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!["image/jpeg", "image/png"].includes(nextFile.type)) {
      setFile(null);
      setPreviewUrl(null);
      setFileError(t("admin.marketing.editorial_image_invalid_type"));
      return;
    }
    if (nextFile.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setPreviewUrl(null);
      setFileError(t("admin.marketing.editorial_image_too_large"));
      return;
    }

    setFile(nextFile);
    setPreviewUrl(
      typeof URL.createObjectURL === "function" ? URL.createObjectURL(nextFile) : null,
    );
  };

  const upload = async () => {
    if (!file || !valid) return;
    const data = new FormData();
    data.append("file", file);
    data.append(
      "metadata",
      new Blob(
        [
          JSON.stringify({
            storedFileName,
            altTextAr: form.altTextAr.trim(),
            altTextNl: form.altTextNl.trim(),
            altTextFr: form.altTextFr.trim(),
            altTextEn: form.altTextEn.trim(),
          }),
        ],
        { type: "application/json" },
      ),
    );
    await onUpload(articleId, data);
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
  };

  const remove = async () => {
    if (!image || !window.confirm(t("admin.marketing.editorial_image_remove_confirm"))) return;
    await onRemove(articleId);
  };

  return (
    <section
      className="min-w-0 space-y-5 border-t border-border/50 pt-5"
      data-testid="editorial-article-image"
      aria-busy={busy}
    >
      <header className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
          <ImageIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-black text-foreground sm:text-lg">
            {copy.imageTitle}
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {copy.imageDescription}
          </p>
        </div>
      </header>

      {image && hero ? (
        <div className="grid min-w-0 gap-4 rounded-2xl border border-primary/15 bg-primary/[0.025] p-4 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
          <div className="relative aspect-video min-w-0 overflow-hidden rounded-xl border border-border/50 bg-muted">
            <Image
              src={hero.publicPath}
              alt={altText}
              fill
              sizes="(max-width: 768px) 100vw, 304px"
              className="object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-col justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{copy.imageAttached}</Badge>
                <Badge variant="outline">
                  {t("admin.marketing.editorial_image_variants", {
                    count: image.variants.length,
                  })}
                </Badge>
              </div>
              <p className="mt-3 break-words font-bold text-foreground">
                {image.originalFileName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {image.originalWidth} × {image.originalHeight}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 sm:w-fit"
              onClick={() => void remove()}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {t("admin.marketing.editorial_image_remove")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-6 text-center text-sm font-semibold text-muted-foreground">
          {copy.imageEmpty}
        </div>
      )}

      {previewUrl ? (
        <div className="space-y-2">
          <p className="text-sm font-bold text-foreground">
            {t("admin.marketing.editorial_image_preview")}
          </p>
          <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-primary/20 bg-muted shadow-sm">
            <Image
              src={previewUrl}
              alt={t("admin.marketing.editorial_image_preview")}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      <div className="min-w-0 space-y-2">
        <span className="block text-sm font-bold text-foreground">
          {copy.imageFile}
        </span>
        <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative min-w-0">
            <FileImage className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={copy.imageFile}
              type="file"
              accept="image/jpeg,image/png"
              disabled={busy}
              className="h-12 w-full ps-10 file:me-3 file:h-9 file:font-bold"
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            type="button"
            className="h-12 min-w-40 gap-2 px-5"
            onClick={() => void upload()}
            disabled={!valid || busy}
            aria-busy={busy}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Upload />}
            {image ? copy.imageReplace : copy.imageUpload}
          </Button>
        </div>
        {fileError ? (
          <p className="text-xs font-semibold text-destructive">{fileError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{copy.imageFileHint}</p>
        )}
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/60 p-4 sm:p-5">
        <div className="mb-4">
          <h4 className="font-black text-foreground">{copy.altTitle}</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {copy.altDescription}
          </p>
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          {(["AR", "NL", "FR", "EN"] as const).map((locale) => {
            const field = `altText${locale[0]}${locale.slice(1).toLowerCase()}` as keyof ImageForm;
            return (
              <ImageField
                key={locale}
                label={`${t("admin.marketing.editorial_image_alt")} ${locale}`}
              >
                <Input
                  dir={locale === "AR" ? "rtl" : "ltr"}
                  value={form[field]}
                  maxLength={500}
                  disabled={busy}
                  onChange={(event) => update(field, event.target.value)}
                />
              </ImageField>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ImageField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0 space-y-1.5 text-sm font-semibold">
      <span className="block break-words text-muted-foreground">
        {label}
        <span className="text-destructive"> *</span>
      </span>
      {children}
    </label>
  );
}
