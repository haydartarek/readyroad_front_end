'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { logApiError } from '@/lib/api';
import { getCsrfToken } from '@/lib/auth-token';
import { FALLBACK_IMAGE } from '@/lib/image-utils';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { UploadCloud, Link2, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

function resolvePreviewSrc(url: string): string {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  if (url.startsWith('assets/')) return `/${url}`;
  return `/${url}`;
}

export function ImageUploadField({ value, onChange, error }: Props) {
  const { t } = useLanguage();
  const [mode, setMode]           = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver]   = useState(false);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  const MAX_BYTES     = 5 * 1024 * 1024; // 5 MB

  const handleFile = async (file: File) => {
    setUploadError(null);
    if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
      setUploadError(t('admin.signs.form.upload_type_error'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(t('admin.signs.form.upload_size_error'));
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      // Use native fetch so the browser sets Content-Type: multipart/form-data
      // with the correct boundary — axios default 'application/json' would break this.
      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {};
      if (csrfToken) headers['x-csrf-token'] = csrfToken;
      const response = await fetch('/api/proxy/admin/upload/image', {
        method: 'POST',
        headers,
        body: fd,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? t('admin.signs.form.upload_error'));
      }
      const data = await response.json() as { url: string };
      onChange(data.url);
      setMode('url');
    } catch (err: unknown) {
      logApiError('Image upload failed', err);
      const msg = err instanceof Error ? err.message : t('admin.signs.form.upload_error');
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">

      {/* ── Mode tabs ── */}
      <div className="flex rounded-xl border border-border/50 bg-muted/30 p-0.5 w-fit gap-0.5">
        <button
          type="button"
          onClick={() => { setMode('url'); setUploadError(null); }}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
            mode === 'url'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Link2 className="w-3 h-3" />
          {t('admin.signs.form.tab_url')}
        </button>
        <button
          type="button"
          onClick={() => { setMode('upload'); setUploadError(null); }}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
            mode === 'upload'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <UploadCloud className="w-3 h-3" />
          {t('admin.signs.form.tab_upload')}
        </button>
      </div>

      {/* ── URL mode ── */}
      {mode === 'url' && (
        <div className="space-y-1">
          <input
            id="admin-image-url"
            name="imageUrl"
            value={value}
            autoComplete="url"
            placeholder={t('admin.signs.form.url_placeholder')}
            onChange={e => onChange(e.target.value)}
            className={cn(
              'w-full rounded-xl border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
              error ? 'border-destructive/50' : 'border-border/50',
            )}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}

      {/* ── Upload mode ── */}
      {mode === 'upload' && (
        <div className="space-y-2">
          <input
            id="admin-image-file"
            name="imageFile"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label={t('admin.signs.form.drop_or_click')}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-all select-none outline-none',
              dragOver
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-muted/30 cursor-pointer',
              uploading && 'cursor-wait opacity-70 pointer-events-none',
            )}
          >
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">{t('admin.signs.form.uploading')}</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground text-center">
                  {t('admin.signs.form.drop_or_click')}
                </p>
                <p className="text-xs text-muted-foreground">{t('admin.signs.form.upload_formats_hint')}</p>
              </>
            )}
          </div>

          {uploadError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X className="w-3 h-3 flex-shrink-0" /> {uploadError}
            </p>
          )}
        </div>
      )}

      {/* ── Live preview ── */}
      {value && (
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
          <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/40">
            <Image
              src={resolvePreviewSrc(value)}
              alt={t('admin.signs.form.preview_alt')} fill unoptimized
              className="object-contain p-1"
              sizes="64px"
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">{t('admin.signs.form.image_preview')}</p>
            <p className="text-xs text-muted-foreground break-all mt-0.5 line-clamp-2">{value}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
            title={t('admin.signs.cancel')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
