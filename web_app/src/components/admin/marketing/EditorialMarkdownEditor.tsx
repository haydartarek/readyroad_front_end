"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
} from "lucide-react";
import ArticleMarkdown, {
  type ArticleTypography,
} from "@/components/blog/ArticleMarkdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EditorialMarkdownEditorProps {
  value: string;
  disabled: boolean;
  dir: "rtl" | "ltr";
  maxLength: number;
  typography: ArticleTypography;
  t: (key: string, variables?: Record<string, string | number>) => string;
  onChange: (value: string) => void;
  onTypographyChange: (value: ArticleTypography) => void;
}

type EditorMode = "write" | "preview";

export default function EditorialMarkdownEditor({
  value,
  disabled,
  dir,
  maxLength,
  typography,
  t,
  onChange,
  onTypographyChange,
}: EditorialMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mode, setMode] = useState<EditorMode>("write");

  const replaceSelection = (
    before: string,
    after = "",
    fallback = "",
  ) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;

    if (next.length > maxLength) return;

    onChange(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + selected.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const prefixSelectedLines = (prefix: string, fallback: string) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const formatted = selected
      .split(/\r?\n/)
      .map((line) => `${prefix}${line}`)
      .join("\n");

    const next = `${value.slice(0, start)}${formatted}${value.slice(end)}`;
    if (next.length > maxLength) return;

    onChange(next);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formatted.length);
    });
  };

  const transformSelectedLines = (
    transform: (line: string) => string,
    fallback: string,
  ) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const formatted = selected
      .split(/\r?\n/)
      .map(transform)
      .join("\n");
    const next = `${value.slice(0, start)}${formatted}${value.slice(end)}`;
    if (next.length > maxLength) return;

    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formatted.length);
    });
  };

  const clearSelectedFormatting = () => {
    transformSelectedLines(
      (line) => line
        .replace(/^\s{0,3}(?:#{1,4}|[-*+] |\d+\. )\s*/, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        .replace(/\[([^\]]+)]\([^)]+\)/g, "$1"),
      t("admin.marketing.editorial_markdown_fallback_plain"),
    );
  };

  const toolbar = [
    { label: t("admin.marketing.editorial_markdown_toolbar_h1"), icon: Heading1, command: "heading1", text: null },
    { label: t("admin.marketing.editorial_markdown_toolbar_h2"), icon: Heading2, command: "heading2", text: null },
    { label: t("admin.marketing.editorial_markdown_toolbar_h3"), icon: Heading3, command: "heading3", text: null },
    { label: t("admin.marketing.editorial_markdown_toolbar_h4"), icon: Heading4, command: "heading4", text: null },
    { label: t("admin.marketing.editorial_markdown_toolbar_paragraph"), icon: Pilcrow, command: "paragraph", text: null },
    { label: t("admin.marketing.editorial_markdown_toolbar_bold"), icon: Bold, command: "bold", text: "B" },
    { label: t("admin.marketing.editorial_markdown_toolbar_italic"), icon: Italic, command: "italic", text: "I" },
    { label: t("admin.marketing.editorial_markdown_toolbar_unordered_list"), icon: List, command: "bulletList", text: null },
    { label: t("admin.marketing.editorial_markdown_toolbar_ordered_list"), icon: ListOrdered, command: "orderedList", text: "1." },
    { label: t("admin.marketing.editorial_markdown_toolbar_link"), icon: Link2, command: "link", text: null },
    { label: t("admin.marketing.editorial_markdown_toolbar_clear"), icon: Eraser, command: "clear", text: null },
  ] as const;

  const applyToolbarCommand = (command: (typeof toolbar)[number]["command"]) => {
    if (command === "heading1") {
      prefixSelectedLines("# ", t("admin.marketing.editorial_markdown_fallback_heading"));
      return;
    }

    if (command === "heading2") {
      prefixSelectedLines("## ", t("admin.marketing.editorial_markdown_fallback_heading"));
      return;
    }

    if (command === "heading4") {
      prefixSelectedLines("#### ", t("admin.marketing.editorial_markdown_fallback_heading"));
      return;
    }

    if (command === "paragraph") {
      transformSelectedLines(
        (line) => line.replace(/^\s{0,3}#{1,4}\s+/, ""),
        t("admin.marketing.editorial_markdown_fallback_paragraph"),
      );
      return;
    }

    if (command === "heading3") {
      prefixSelectedLines("### ", t("admin.marketing.editorial_markdown_fallback_heading"));
      return;
    }

    if (command === "bold") {
      replaceSelection("**", "**", t("admin.marketing.editorial_markdown_fallback_bold"));
      return;
    }

    if (command === "italic") {
      replaceSelection("_", "_", t("admin.marketing.editorial_markdown_fallback_italic"));
      return;
    }

    if (command === "bulletList") {
      prefixSelectedLines("- ", t("admin.marketing.editorial_markdown_fallback_list_item"));
      return;
    }

    if (command === "orderedList") {
      prefixSelectedLines("1. ", t("admin.marketing.editorial_markdown_fallback_list_item"));
      return;
    }

    if (command === "clear") {
      clearSelectedFormatting();
      return;
    }

    replaceSelection("[", "](/path)", t("admin.marketing.editorial_markdown_fallback_link"));
  };

  const sizeFields = [
    ["h1Size", "H1"],
    ["h2Size", "H2"],
    ["h3Size", "H3"],
    ["h4Size", "H4"],
    ["paragraphSize", t("admin.marketing.editorial_markdown_paragraph")],
  ] as const;

  return (
    <section
      className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-background"
      data-testid="editorial-markdown-editor"
    >
      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/25 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="inline-flex w-full rounded-xl border border-border/60 bg-background p-1 sm:w-auto"
          role="tablist"
          aria-orientation="horizontal"
          aria-label={t("admin.marketing.editorial_markdown_mode_label")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "write"}
            tabIndex={mode === "write" ? 0 : -1}
            onClick={() => setMode("write")}
            className={cn(
              "min-h-9 flex-1 rounded-lg px-3 text-xs font-black outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 sm:flex-none",
              mode === "write"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t("admin.marketing.editorial_markdown_write")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "preview"}
            tabIndex={mode === "preview" ? 0 : -1}
            onClick={() => setMode("preview")}
            className={cn(
              "min-h-9 flex-1 rounded-lg px-3 text-xs font-black outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 sm:flex-none",
              mode === "preview"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t("admin.marketing.editorial_markdown_live_preview")}
          </button>
        </div>

        <span className="text-xs font-semibold tabular-nums text-muted-foreground" aria-live="polite">
          {value.length.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>

      {mode === "write" ? (
        <>
          <div className="flex flex-wrap gap-1 border-b border-border/60 bg-background p-2" role="toolbar">
            {toolbar.map(({ label, icon: Icon, command, text }) => (
              <button
                key={label}
                type="button"
                onClick={() => applyToolbarCommand(command)}
                disabled={disabled}
                title={label}
                aria-label={label}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border/60 bg-background px-2 text-xs font-black outline-none transition-colors hover:border-primary/30 hover:bg-primary/[0.06] focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {text ?? <Icon className="h-4 w-4" aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div className="grid min-w-0 gap-3 border-b border-border/60 bg-muted/15 p-3 sm:grid-cols-2 xl:grid-cols-3">
            {sizeFields.map(([field, label]) => (
              <label key={field} className="min-w-0 space-y-1.5 text-xs font-bold text-muted-foreground">
                <span className="block break-words">
                  {t("admin.marketing.editorial_markdown_size", { target: label })}
                </span>
                <Select
                  value={typography[field]}
                  disabled={disabled}
                  onValueChange={(next) =>
                    onTypographyChange({
                      ...typography,
                      [field]: next as ArticleTypography[typeof field],
                    })
                  }
                >
                  <SelectTrigger className="w-full min-w-0" dir={dir}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={dir}>
                    <SelectItem value="COMPACT">
                      {t("admin.marketing.editorial_markdown_size_compact")}
                    </SelectItem>
                    <SelectItem value="DEFAULT">
                      {t("admin.marketing.editorial_markdown_size_default")}
                    </SelectItem>
                    <SelectItem value="LARGE">
                      {t("admin.marketing.editorial_markdown_size_large")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </label>
            ))}

            <label className="min-w-0 space-y-1.5 text-xs font-bold text-muted-foreground">
              <span className="block break-words">
                {t("admin.marketing.editorial_markdown_text_color")}
              </span>
              <Select
                value={typography.textColor}
                disabled={disabled}
                onValueChange={(next) =>
                  onTypographyChange({
                    ...typography,
                    textColor: next as ArticleTypography["textColor"],
                  })
                }
              >
                <SelectTrigger className="w-full min-w-0" dir={dir}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir={dir}>
                  {(["DEFAULT", "MUTED", "PRIMARY", "SECONDARY"] as const).map((color) => (
                    <SelectItem key={color} value={color}>
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-3 w-3 shrink-0 rounded-full border border-border/60",
                            color === "DEFAULT" && "bg-foreground",
                            color === "MUTED" && "bg-muted-foreground",
                            color === "PRIMARY" && "bg-primary",
                            color === "SECONDARY" && "bg-secondary",
                          )}
                        />
                        {t(`admin.marketing.editorial_markdown_color_${color.toLowerCase()}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <textarea
            ref={textareaRef}
            aria-label={t("admin.marketing.editorial_body")}
            dir={dir}
            value={value}
            disabled={disabled}
            maxLength={maxLength}
            rows={16}
            placeholder={t("admin.marketing.editorial_markdown_placeholder")}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-80 w-full min-w-0 resize-y bg-background px-4 py-4 text-start font-mono text-sm leading-7 outline-none placeholder:text-muted-foreground focus:bg-primary/[0.015] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <p className="border-t border-border/60 bg-muted/20 px-4 py-3 text-xs leading-5 text-muted-foreground">
            {t("admin.marketing.editorial_markdown_help")}
          </p>
        </>
      ) : (
        <div dir={dir} className="min-h-80 min-w-0 overflow-x-hidden p-4 text-start text-base leading-8">
          {value.trim() ? (
            <ArticleMarkdown body={value} typography={typography} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("admin.marketing.editorial_markdown_placeholder")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
