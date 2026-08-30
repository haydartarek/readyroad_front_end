"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Eraser,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
} from "lucide-react";
import ArticleMarkdown, {
  type ArticleTypography,
} from "@/components/blog/ArticleMarkdown";
import { useLanguage } from "@/contexts/language-context";
import { editorialCmsCopy } from "@/lib/editorial-cms-copy";
import { cn } from "@/lib/utils";

interface EditorialMarkdownEditorProps {
  value: string;
  disabled: boolean;
  dir: "rtl" | "ltr";
  maxLength: number;
  typography: ArticleTypography;
  t: (key: string, variables?: Record<string, string | number>) => string;
  onChange: (value: string) => void;
}

type EditorMode = "write" | "preview";
type ToolbarCommand =
  | "heading2"
  | "heading3"
  | "heading4"
  | "paragraph"
  | "bold"
  | "italic"
  | "quote"
  | "bulletList"
  | "orderedList"
  | "link"
  | "separator"
  | "clear";

export default function EditorialMarkdownEditor({
  value,
  disabled,
  dir,
  maxLength,
  typography,
  t,
  onChange,
}: EditorialMarkdownEditorProps) {
  const { language } = useLanguage();
  const copy = editorialCmsCopy(language);
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
      textarea.setSelectionRange(cursorStart, cursorStart + selected.length);
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
    const formatted = selected.split(/\r?\n/).map(transform).join("\n");
    const next = `${value.slice(0, start)}${formatted}${value.slice(end)}`;
    if (next.length > maxLength) return;

    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formatted.length);
    });
  };

  const prefixSelectedLines = (prefix: string, fallback: string) => {
    transformSelectedLines((line) => `${prefix}${line}`, fallback);
  };

  const clearSelectedFormatting = () => {
    transformSelectedLines(
      (line) =>
        line
          .replace(/^\s{0,3}(?:#{1,4}\s+|[-*+]\s+|\d+\.\s+|>\s*)/, "")
          .replace(/^\s*-{3,}\s*$/, "")
          .replace(/\*\*([^*]+)\*\*/g, "$1")
          .replace(/_([^_]+)_/g, "$1")
          .replace(/\[([^\]]+)]\([^)]+\)/g, "$1"),
      t("admin.marketing.editorial_markdown_fallback_plain"),
    );
  };

  const applyToolbarCommand = (command: ToolbarCommand) => {
    const heading = t("admin.marketing.editorial_markdown_fallback_heading");
    const paragraph = t("admin.marketing.editorial_markdown_fallback_paragraph");
    const listItem = t("admin.marketing.editorial_markdown_fallback_list_item");

    if (command === "heading2") return prefixSelectedLines("## ", heading);
    if (command === "heading3") return prefixSelectedLines("### ", heading);
    if (command === "heading4") return prefixSelectedLines("#### ", heading);
    if (command === "paragraph") {
      return transformSelectedLines(
        (line) => line.replace(/^\s{0,3}#{1,4}\s+/, ""),
        paragraph,
      );
    }
    if (command === "bold") {
      return replaceSelection(
        "**",
        "**",
        t("admin.marketing.editorial_markdown_fallback_bold"),
      );
    }
    if (command === "italic") {
      return replaceSelection(
        "_",
        "_",
        t("admin.marketing.editorial_markdown_fallback_italic"),
      );
    }
    if (command === "quote") return prefixSelectedLines("> ", paragraph);
    if (command === "bulletList") return prefixSelectedLines("- ", listItem);
    if (command === "orderedList") return prefixSelectedLines("1. ", listItem);
    if (command === "link") {
      return replaceSelection(
        "[",
        "](/path)",
        t("admin.marketing.editorial_markdown_fallback_link"),
      );
    }
    if (command === "separator") return replaceSelection("\n\n---\n\n");
    clearSelectedFormatting();
  };

  const groups: Array<{
    label: string;
    items: Array<{
      command: ToolbarCommand;
      label: string;
      icon?: typeof Heading2;
      text?: string;
    }>;
  }> = [
    {
      label: copy.editorStructure,
      items: [
        { command: "heading2", label: t("admin.marketing.editorial_markdown_toolbar_h2"), icon: Heading2 },
        { command: "heading3", label: t("admin.marketing.editorial_markdown_toolbar_h3"), icon: Heading3 },
        { command: "heading4", label: t("admin.marketing.editorial_markdown_toolbar_h4"), icon: Heading4 },
        { command: "paragraph", label: t("admin.marketing.editorial_markdown_toolbar_paragraph"), icon: Pilcrow },
      ],
    },
    {
      label: copy.editorFormat,
      items: [
        { command: "bold", label: t("admin.marketing.editorial_markdown_toolbar_bold"), icon: Bold },
        { command: "italic", label: t("admin.marketing.editorial_markdown_toolbar_italic"), icon: Italic },
        { command: "quote", label: copy.editorInsert + " · Quote", icon: Quote },
      ],
    },
    {
      label: t("admin.marketing.editorial_markdown_toolbar_unordered_list"),
      items: [
        { command: "bulletList", label: t("admin.marketing.editorial_markdown_toolbar_unordered_list"), icon: List },
        { command: "orderedList", label: t("admin.marketing.editorial_markdown_toolbar_ordered_list"), icon: ListOrdered },
      ],
    },
    {
      label: copy.editorInsert,
      items: [
        { command: "link", label: t("admin.marketing.editorial_markdown_toolbar_link"), icon: Link2 },
        { command: "separator", label: copy.editorInsert + " · —", icon: Minus },
        { command: "clear", label: t("admin.marketing.editorial_markdown_toolbar_clear"), icon: Eraser },
      ],
    },
  ];

  return (
    <section
      className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm"
      data-testid="editorial-markdown-editor"
    >
      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div
          className="inline-flex w-full rounded-xl border border-border/60 bg-background p-1 sm:w-auto"
          role="tablist"
          aria-orientation="horizontal"
          aria-label={t("admin.marketing.editorial_markdown_mode_label")}
        >
          <ModeTab active={mode === "write"} onClick={() => setMode("write")}>
            {copy.editorWrite}
          </ModeTab>
          <ModeTab active={mode === "preview"} onClick={() => setMode("preview")}>
            {copy.editorPreview}
          </ModeTab>
        </div>
        <span
          className="text-xs font-semibold tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          {value.length.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>

      {mode === "write" ? (
        <>
          <div
            className="flex min-w-0 flex-wrap items-stretch gap-2 border-b border-border/60 bg-card/70 p-3 sm:p-4"
            role="toolbar"
            aria-label={copy.editorTitle}
          >
            {groups.map((group) => (
              <div
                key={group.label}
                className="flex min-w-0 flex-wrap items-center gap-1 rounded-xl border border-border/50 bg-background p-1.5"
                aria-label={group.label}
              >
                {group.items.map(({ command, label, icon: Icon, text }) => (
                  <button
                    key={command}
                    type="button"
                    onClick={() => applyToolbarCommand(command)}
                    disabled={disabled}
                    title={label}
                    aria-label={label}
                    className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg px-2.5 text-sm font-black text-foreground outline-none transition hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {text ?? (Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : null)}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            aria-label={t("admin.marketing.editorial_body")}
            dir={dir}
            value={value}
            disabled={disabled}
            maxLength={maxLength}
            rows={20}
            placeholder={t("admin.marketing.editorial_markdown_placeholder")}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-[34rem] w-full min-w-0 resize-y bg-background px-5 py-5 text-start font-mono text-[15px] leading-8 outline-none placeholder:text-muted-foreground focus:bg-primary/[0.012] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6"
          />

          <p className="border-t border-border/60 bg-muted/20 px-4 py-3 text-xs leading-5 text-muted-foreground sm:px-6">
            {t("admin.marketing.editorial_markdown_help")}
          </p>
        </>
      ) : (
        <div
          dir={dir}
          className="min-h-[34rem] min-w-0 overflow-x-hidden p-5 text-start text-base leading-8 sm:p-6"
        >
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

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        "min-h-10 flex-1 rounded-lg px-4 text-sm font-black outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 sm:flex-none",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
