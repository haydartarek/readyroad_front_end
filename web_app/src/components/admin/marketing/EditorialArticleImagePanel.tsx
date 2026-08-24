"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ExternalLink, ImageIcon, Loader2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EditorialArticleImageAsset } from "@/lib/marketing-admin";

type Translate = (key: string, variables?: Record<string, string | number>) => string;

interface EditorialArticleImagePanelProps {
  articleId: number;
  image: EditorialArticleImageAsset | null;
  busy: boolean;
  t: Translate;
  onUpload: (articleId: number, formData: FormData) => Promise<void>;
}

interface ImageForm {
  sourcePlatform: "UNSPLASH" | "PIXABAY" | "PEXELS";
  sourceAssetId: string;
  sourceUrl: string;
  photographerName: string;
  photographerUrl: string;
  licenseName: string;
  licenseUrl: string;
  licenseVerifiedAt: string;
  downloadedAt: string;
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
  approvalReason: string;
}

const EMPTY_FORM: ImageForm = {
  sourcePlatform: "UNSPLASH",
  sourceAssetId: "",
  sourceUrl: "",
  photographerName: "",
  photographerUrl: "",
  licenseName: "",
  licenseUrl: "",
  licenseVerifiedAt: "",
  downloadedAt: "",
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
  approvalReason: "",
};

const REQUIRED_TEXT_FIELDS: Array<keyof ImageForm> = [
  "sourceAssetId",
  "sourceUrl",
  "photographerName",
  "photographerUrl",
  "licenseName",
  "licenseUrl",
  "licenseVerifiedAt",
  "downloadedAt",
  "altTextAr",
  "altTextNl",
  "altTextFr",
  "altTextEn",
  "approvalReason",
];

export default function EditorialArticleImagePanel({
  articleId,
  image,
  busy,
  t,
  onUpload,
}: EditorialArticleImagePanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState<ImageForm>(EMPTY_FORM);

  const hero = image?.variants.find((variant) => variant.type === "HERO") ?? null;
  const altText =
    image?.localizations.find((localization) => localization.language === "EN")?.altText
    ?? image?.localizations[0]?.altText
    ?? "";
  const valid = useMemo(
    () =>
      Boolean(file)
      && confirmed
      && REQUIRED_TEXT_FIELDS.every((field) => form[field].trim())
      && Number(form.focalPointX) >= 0
      && Number(form.focalPointX) <= 1
      && Number(form.focalPointY) >= 0
      && Number(form.focalPointY) <= 1,
    [confirmed, file, form],
  );

  const update = (field: keyof ImageForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const upload = async () => {
    if (!file || !valid) return;
    const metadata = {
      ...form,
      captionAr: form.captionAr.trim() || null,
      captionNl: form.captionNl.trim() || null,
      captionFr: form.captionFr.trim() || null,
      captionEn: form.captionEn.trim() || null,
      focalPointX: Number(form.focalPointX),
      focalPointY: Number(form.focalPointY),
      licenseVerifiedAt: new Date(form.licenseVerifiedAt).toISOString(),
      downloadedAt: new Date(form.downloadedAt).toISOString(),
    };
    const data = new FormData();
    data.append("file", file);
    data.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    await onUpload(articleId, data);
  };

  return (
    <section className="space-y-5 border-t border-border/50 pt-5" data-testid="editorial-article-image">
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
        <div className="grid min-w-0 gap-4 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          <div className="relative aspect-video min-w-0 overflow-hidden rounded-lg bg-muted">
            <Image
              src={hero.publicPath}
              alt={altText}
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{image.status}</Badge>
              <Badge variant="outline">{image.variants.length}/4</Badge>
              <Badge variant="outline">{image.localizations.length}/4 ALT</Badge>
            </div>
            <p className="mt-3 break-words font-bold">{image.originalFileName}</p>
            <p className="mt-1 text-muted-foreground">
              {image.originalWidth} × {image.originalHeight}
            </p>
            {image.license ? (
              <div className="mt-3 space-y-1 text-muted-foreground">
                <p>{image.license.sourcePlatform} · {image.license.photographerName}</p>
                <a
                  href={image.license.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  {t("admin.marketing.editorial_image_source")}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
          {t("admin.marketing.editorial_image_empty")}
        </p>
      )}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <ImageField label={t("admin.marketing.editorial_image_file")} required>
          <Input type="file" accept="image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_platform")} required>
          <select
            dir="auto"
            value={form.sourcePlatform}
            onChange={(event) => update("sourcePlatform", event.target.value)}
            className="h-11 min-w-0 w-full max-w-full truncate rounded-xl border border-input bg-background ps-3 pe-10 text-start text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            <option value="UNSPLASH">Unsplash</option>
            <option value="PIXABAY">Pixabay</option>
            <option value="PEXELS">Pexels</option>
          </select>
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_source_id")} required>
          <Input value={form.sourceAssetId} onChange={(event) => update("sourceAssetId", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_source_url")} required>
          <Input dir="ltr" type="url" value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_photographer")} required>
          <Input value={form.photographerName} onChange={(event) => update("photographerName", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_photographer_url")} required>
          <Input dir="ltr" type="url" value={form.photographerUrl} onChange={(event) => update("photographerUrl", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_license")} required>
          <Input value={form.licenseName} onChange={(event) => update("licenseName", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_license_url")} required>
          <Input dir="ltr" type="url" value={form.licenseUrl} onChange={(event) => update("licenseUrl", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_license_verified")} required>
          <Input type="datetime-local" value={form.licenseVerifiedAt} onChange={(event) => update("licenseVerifiedAt", event.target.value)} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_downloaded")} required>
          <Input type="datetime-local" value={form.downloadedAt} onChange={(event) => update("downloadedAt", event.target.value)} />
        </ImageField>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <ImageField label={t("admin.marketing.editorial_image_alt") + " AR"} required>
          <Input value={form.altTextAr} onChange={(event) => update("altTextAr", event.target.value)} maxLength={500} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_alt") + " NL"} required>
          <Input value={form.altTextNl} onChange={(event) => update("altTextNl", event.target.value)} maxLength={500} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_alt") + " FR"} required>
          <Input value={form.altTextFr} onChange={(event) => update("altTextFr", event.target.value)} maxLength={500} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_alt") + " EN"} required>
          <Input value={form.altTextEn} onChange={(event) => update("altTextEn", event.target.value)} maxLength={500} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_caption") + " AR"}>
          <Input value={form.captionAr} onChange={(event) => update("captionAr", event.target.value)} maxLength={2000} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_caption") + " NL"}>
          <Input value={form.captionNl} onChange={(event) => update("captionNl", event.target.value)} maxLength={2000} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_caption") + " FR"}>
          <Input value={form.captionFr} onChange={(event) => update("captionFr", event.target.value)} maxLength={2000} />
        </ImageField>
        <ImageField label={t("admin.marketing.editorial_image_caption") + " EN"}>
          <Input value={form.captionEn} onChange={(event) => update("captionEn", event.target.value)} maxLength={2000} />
        </ImageField>
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
        <textarea
          value={form.approvalReason}
          onChange={(event) => update("approvalReason", event.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
      </ImageField>

      <label className="flex items-start gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span>{t("admin.marketing.editorial_image_confirm")}</span>
      </label>

      <Button type="button" onClick={() => void upload()} disabled={!valid || busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {image ? t("admin.marketing.editorial_image_replace") : t("admin.marketing.editorial_image_upload")}
      </Button>
    </section>
  );
}

function ImageField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0 space-y-1.5 text-sm font-semibold">
      <span className="block text-muted-foreground">{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}
