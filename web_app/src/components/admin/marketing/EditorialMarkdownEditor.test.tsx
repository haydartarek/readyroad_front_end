import { fireEvent, render, screen } from "@testing-library/react";
import EditorialMarkdownEditor from "@/components/admin/marketing/EditorialMarkdownEditor";
import { DEFAULT_ARTICLE_TYPOGRAPHY } from "@/components/blog/ArticleMarkdown";

const translations: Record<string, string> = {
  "admin.marketing.editorial_markdown_toolbar_h1": "Heading 1",
  "admin.marketing.editorial_markdown_toolbar_h2": "Heading 2",
  "admin.marketing.editorial_markdown_toolbar_h3": "Heading 3",
  "admin.marketing.editorial_markdown_toolbar_h4": "Heading 4",
  "admin.marketing.editorial_markdown_toolbar_paragraph": "Paragraph",
  "admin.marketing.editorial_markdown_toolbar_bold": "Bold",
  "admin.marketing.editorial_markdown_toolbar_italic": "Italic",
  "admin.marketing.editorial_markdown_toolbar_unordered_list": "Bulleted list",
  "admin.marketing.editorial_markdown_toolbar_ordered_list": "Numbered list",
  "admin.marketing.editorial_markdown_toolbar_link": "Add link",
  "admin.marketing.editorial_markdown_toolbar_clear": "Clear formatting",
  "admin.marketing.editorial_markdown_fallback_heading": "Heading",
  "admin.marketing.editorial_markdown_fallback_paragraph": "Paragraph",
  "admin.marketing.editorial_markdown_fallback_bold": "bold text",
  "admin.marketing.editorial_markdown_fallback_italic": "italic text",
  "admin.marketing.editorial_markdown_fallback_list_item": "List item",
  "admin.marketing.editorial_markdown_fallback_link": "link text",
  "admin.marketing.editorial_markdown_fallback_plain": "Plain paragraph",
  "admin.marketing.editorial_markdown_size_compact": "Compact",
  "admin.marketing.editorial_markdown_size_default": "Default",
  "admin.marketing.editorial_markdown_size_large": "Large",
};

const t = (key: string) => translations[key] ?? key;

describe("EditorialMarkdownEditor", () => {
  it("inserts structured Markdown and renders it in the live preview", () => {
    let value = "";

    const { rerender } = render(
      <EditorialMarkdownEditor
        value={value}
        disabled={false}
        dir="rtl"
        maxLength={500000}
        typography={DEFAULT_ARTICLE_TYPOGRAPHY}
        t={t}
        onChange={(next) => {
          value = next;
        }}
        onTypographyChange={jest.fn()}
      />,
    );

    const editor = screen.getByLabelText("admin.marketing.editorial_body");

    fireEvent.click(screen.getByRole("button", { name: "Heading 2" }));

    rerender(
      <EditorialMarkdownEditor
        value={value}
        disabled={false}
        dir="rtl"
        maxLength={500000}
        typography={DEFAULT_ARTICLE_TYPOGRAPHY}
        t={t}
        onChange={(next) => {
          value = next;
        }}
        onTypographyChange={jest.fn()}
      />,
    );

    expect(value).toBe("## Heading");

    fireEvent.change(screen.getByLabelText("admin.marketing.editorial_body"), {
      target: { value: "## عنوان منظم\n\n- نقطة أولى\n- نقطة ثانية" },
    });

    rerender(
      <EditorialMarkdownEditor
        value={value}
        disabled={false}
        dir="rtl"
        maxLength={500000}
        typography={DEFAULT_ARTICLE_TYPOGRAPHY}
        t={t}
        onChange={(next) => {
          value = next;
        }}
        onTypographyChange={jest.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("tab", {
        name: "admin.marketing.editorial_markdown_live_preview",
      }),
    );

    expect(screen.getByRole("heading", { name: "عنوان منظم", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("نقطة أولى")).toBeInTheDocument();
    expect(editor).toHaveAttribute("dir", "rtl");
  });

  it("does not allow toolbar output beyond the configured character limit", () => {
    const onChange = jest.fn();

    render(
      <EditorialMarkdownEditor
        value="12345"
        disabled={false}
        dir="ltr"
        maxLength={5}
        typography={DEFAULT_ARTICLE_TYPOGRAPHY}
        t={t}
        onChange={onChange}
        onTypographyChange={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Heading 2" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("exposes the complete safe formatting toolbar and typography controls", () => {
    render(
      <EditorialMarkdownEditor
        value="#### Heading"
        disabled={false}
        dir="ltr"
        maxLength={500000}
        typography={DEFAULT_ARTICLE_TYPOGRAPHY}
        t={t}
        onChange={jest.fn()}
        onTypographyChange={jest.fn()}
      />,
    );

    for (const command of [
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Heading 4",
      "Paragraph",
      "Bold",
      "Italic",
      "Bulleted list",
      "Numbered list",
      "Add link",
      "Clear formatting",
    ]) {
      expect(screen.getByRole("button", { name: command })).toBeEnabled();
    }
    expect(screen.getAllByRole("combobox")).toHaveLength(6);
    expect(screen.getByLabelText("admin.marketing.editorial_body")).toHaveAttribute("dir", "ltr");
  });

  it.each([
    ["Heading 1", "# Heading"],
    ["Heading 2", "## Heading"],
    ["Heading 3", "### Heading"],
    ["Heading 4", "#### Heading"],
    ["Paragraph", "Paragraph"],
    ["Bold", "**bold text**"],
    ["Italic", "_italic text_"],
    ["Bulleted list", "- List item"],
    ["Numbered list", "1. List item"],
    ["Add link", "[link text](/path)"],
    ["Clear formatting", "Plain paragraph"],
  ])("applies the localized %s command", (buttonName, expected) => {
    const onChange = jest.fn();

    render(
      <EditorialMarkdownEditor
        value=""
        disabled={false}
        dir="ltr"
        maxLength={500000}
        typography={DEFAULT_ARTICLE_TYPOGRAPHY}
        t={t}
        onChange={onChange}
        onTypographyChange={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: buttonName }));

    expect(onChange).toHaveBeenCalledWith(expected);
  });
});
