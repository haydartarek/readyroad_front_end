"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  storedFileName: string;
  sourceName: string;
  sourceUrl: string;
  licenseName: string;
  licenseUrl: string;
  approvalReason: string;
  rightsConfirmed: boolean;
  altTextAr: string;
  altTextNl: string;
  altTextFr: string;
  altTextEn: string;
  captionAr: string;
  captionNl: string;
  captionFr: string;
  captionEn: string;
  focalPointX: string;
  focalPointY: string;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function emptyForm(suggestedFileName: string): ImageForm {
  return {
    storedFileName: suggestedFileName,
    sourceName: "",
    sourceUrl: "",
    licenseName: "",
    licenseUrl: "",
    approvalReason: "",
    rightsConfirmed: false,
    altTextAr: "",
    altTextNl: "",
    altTextFr: "",
    altTextEn: "",
    captionAr: "",
    captionNl: "",
    captionFr: "",
    captionEn: "",
    focalPointX: "0.5",
    focalPointY: "0.5",
  };
}

export default function EditorialArticleImagePanel(
  props: EditorialArticleImagePanelProps,
) {
  return (
    <EditorialArticleImagePanelContent
      key={`${props.articleId}:${props.suggestedFileName}`}
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
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<ImageForm>(() => emptyForm(suggestedFileName));

  useEffect(() => {
    if (!previewUrl || typeof URL.revokeObjectURL !== "function") {
      return;
    }
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const hero = image?.variants.find((variant) => variant.type === "HERO") ?? null;
  const altText =
    image?.localizations.find((localization) => localization.language === "EN")
      ?.altText ??
    image?.localizations[0]?.altText ??
    "";

  const valid = useMemo(() => {
    return Boolean(
      file &&
        file.size <= MAX_UPLOAD_BYTES &&
        form.storedFileName.trim() &&
        form.sourceName.trim() &&
        form.licenseName.trim() &&
        form.approvalReason.trim() &&
        form.rightsConfirmed &&
        form.altTextAr.trim() &&
        form.altTextNl.trim() &&
        form.altTextFr.trim() &&
        form.altTextEn.trim() &&
        Number(form.focalPointX) >= 0 &&
        Number(form.focalPointX) <= 1 &&
        Number(form.focalPointY) >= 0 &&
        Number(form.focalPointY) <= 1,
    );
  }, [file, form]);

  const update = <Field extends keyof ImageForm>(
    field: Field,
    value: ImageForm[Field],
  ) => {
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

    const nextPreviewUrl =
      typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(nextFile)
        : null;

    setFile(nextFile);
    setPreviewUrl(nextPreviewUrl);
  };

  const upload = async () => {
    if (!file || !valid) return;
    const metadata = {
      storedFileName: form.storedFileName.trim(),
      sourceName: form.sourceName.trim(),
      sourceUrl: form.sourceUrl.trim() || null,
      licenseName: form.licenseName.trim(),
      licenseUrl: form.licenseUrl.trim() || null,
      approvalReason: form.approvalReason.trim(),
      rightsConfirmed: form.rightsConfirmed,
      altTextAr: form.altTextAr.trim(),
      altTextNl: form.altTextNl.trim(),
      altTextFr: form.altTextFr.trim(),
      altTextEn: form.altTextEn.trim(),
      captionAr: form.captionAr.trim() || null,
      captionNl: form.captionNl.trim() || null,
      captionFr: form.captionFr.trim() || null,
      captionEn: form.captionEn.trim() || null,
      focalPointX: Number(form.focalPointX),
      focalPointY: Number(form.focalPointY),
    };
    const data = new FormData();
    data.append("file", file);
    data.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    );
    await onUpload(articleId, data);
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
  };

  const remove = async () => {
    if (!image || !window.confirm(t("admin.marketing.editorial_image_remove_confirm"))) {
      return;
    }
    await onRemove(articleId);
  };

  return (
    <section className="min-w-0 space-y-5 border-t border-border/50 pt-5" data-testid="editorial-article-image" aria-busy={busy}>
      <header>
        <h3 className="flex items-center gap-2 font-black">
          <ImageIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {t("admin.marketing.editorial_image_title")}
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t("admin.marketing.editorial_image_description")}
        </p>
      </header>

      {image && hero ? (
        <div className="grid min-w-0 gap-4 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:bg-emerald-950/10 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          <div className="relative aspect-video min-w-0 overflow-hidden rounded-lg bg-muted">
            <Image src={hero.publicPath} alt={altText} fill sizes="(max-width: 768px) 100vw, 256px" className="object-cover" />
          </div>
          <div className="min-w-0 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{image.status}</Badge>
              <Badge variant="outline">{t("admin.marketing.editorial_image_variants", { count: image.variants.length })}</Badge>
              <Badge variant="outline">{t("admin.marketing.editorial_image_alt_count", { count: image.localizations.length })}</Badge>
            </div>
            <p className="mt-3 break-words font-bold">{image.originalFileName}</p>
            {image.storedFileName ? (
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {image.storedFileName}
              </p>
            ) : null}
            <p className="mt-1 text-muted-foreground">{image.originalWidth} × {image.originalHeight}</p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-4 w-full sm:w-auto"
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
        <p className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
          {t("admin.marketing.editorial_image_empty")}
        </p>
      )}

      {previewUrl ? (
        <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-xl border border-border/60 bg-muted">
          <Image src={previewUrl} alt={t("admin.marketing.editorial_image_preview")} fill unoptimized className="object-cover" />
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <ImageField label={t("admin.marketing.editorial_image_file")} required>
          <Input aria-label={t("admin.marketing.editorial_image_file")} type="file" accept="image/jpeg,image/png" disabled={busy} onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
          {fileError ? <p className="pt-1 text-xs font-semibold text-destructive">{fileError}</p> : null}
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_stored_filename")} required>
          <Input dir="ltr" value={form.storedFileName} maxLength={128} onChange={(event) => update("storedFileName", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_source_name")} required>
          <Input value={form.sourceName} maxLength={255} onChange={(event) => update("sourceName", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_source_url_optional")}>
          <Input dir="ltr" type="url" value={form.sourceUrl} maxLength={2000} onChange={(event) => update("sourceUrl", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_license")} required>
          <Input value={form.licenseName} maxLength={255} onChange={(event) => update("licenseName", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_license_url_optional")}>
          <Input dir="ltr" type="url" value={form.licenseUrl} maxLength={2000} onChange={(event) => update("licenseUrl", event.target.value)} />
        </ImageField>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        {(["AR", "NL", "FR", "EN"] as const).map((locale) => {
          const field = `altText${locale[0]}${locale.slice(1).toLowerCase()}` as keyof ImageForm;
          return (
            <ImageField key={locale} label={`${t("admin.marketing.editorial_image_alt")} ${locale}`} required>
              <Input value={String(form[field])} maxLength={500} onChange={(event) => update(field, event.target.value)} />
            </ImageField>
          );
        })}
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        {(["AR", "NL", "FR", "EN"] as const).map((locale) => {
          const field = `caption${locale[0]}${locale.slice(1).toLowerCase()}` as keyof ImageForm;
          return (
            <ImageField key={locale} label={`${t("admin.marketing.editorial_image_caption")} ${locale}`}>
              <Input value={String(form[field])} maxLength={2000} onChange={(event) => update(field, event.target.value)} />
            </ImageField>
          );
        })}
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <ImageField label={t("admin.marketing.editorial_image_focal_x")}>
          <Input type="number" min="0" max="1" step="0.01" value={form.focalPointX} onChange={(event) => update("focalPointX", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_focal_y")}>
          <Input type="number" min="0" max="1" step="0.01" value={form.focalPointY} onChange={(event) => update("focalPointY", event.target.value)} />
        </ImageField>
      </div>

      <ImageField label={t("admin.marketing.editorial_image_approval_reason")} required>
        <textarea value={form.approvalReason} rows={3} maxLength={1000} disabled={busy} required aria-required="true" onChange={(event) => update("approvalReason", event.target.value)} className="w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60" />
      </ImageField>

      <label className="flex min-w-0 items-start gap-3 rounded-xl border border-border/60 bg-muted/25 p-3 text-sm font-semibold leading-6">
        <input type="checkbox" checked={form.rightsConfirmed} disabled={busy} onChange={(event) => update("rightsConfirmed", event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-primary disabled:cursor-not-allowed disabled:opacity-60" />
        <span>{t("admin.marketing.editorial_image_confirm")}</span>
      </label>

      <Button type="button" className="w-full sm:w-auto" onClick={() => void upload()} disabled={!valid || busy} aria-busy={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {t(image ? "admin.marketing.editorial_image_replace" : "admin.marketing.editorial_image_upload")}
      </Button>
    </section>
  );
}

function ImageField({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="min-w-0 space-y-1.5 text-sm font-semibold">
      <span className="block break-words text-muted-foreground">
        {label}{required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
