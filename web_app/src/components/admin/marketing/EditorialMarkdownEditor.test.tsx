import { fireEvent, render, screen } from "@testing-library/react";
import EditorialMarkdownEditor from "@/components/admin/marketing/EditorialMarkdownEditor";
import { DEFAULT_ARTICLE_TYPOGRAPHY } from "@/components/blog/ArticleMarkdown";

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ language: "en" }),
}));

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
};

const t = (key: string) => translations[key] ?? key;

function editor(value: string, onChange: (next: string) => void, maxLength = 500000) {
  return (
    <EditorialMarkdownEditor
      value={value}
      disabled={false}
      dir="rtl"
      maxLength={maxLength}
      typography={DEFAULT_ARTICLE_TYPOGRAPHY}
      t={t}
      onChange={onChange}
    />
  );
}

describe("EditorialMarkdownEditor", () => {
  it("inserts structured Markdown and renders it in the live preview", () => {
    let value = "";
    const onChange = (next: string) => {
      value = next;
    };
    const { rerender } = render(editor(value, onChange));

    fireEvent.click(screen.getByRole("button", { name: "Heading 2" }));
    rerender(editor(value, onChange));
    expect(value).toBe("## Heading");

    fireEvent.change(screen.getByLabelText("admin.marketing.editorial_body"), {
      target: { value: "## عنوان منظم\n\n- نقطة أولى\n- نقطة ثانية" },
    });
    value = "## عنوان منظم\n\n- نقطة أولى\n- نقطة ثانية";
    rerender(editor(value, onChange));

    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));

    expect(screen.getByRole("heading", { name: "عنوان منظم", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("نقطة أولى")).toBeInTheDocument();
  });

  it("does not allow toolbar output beyond the configured character limit", () => {
    const onChange = jest.fn();
    render(editor("12345", onChange, 5));

    fireEvent.click(screen.getByRole("button", { name: "Heading 2" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("exposes writer tools, omits duplicate H1 and removes visual design controls", () => {
    render(editor("#### Heading", jest.fn()));

    for (const command of [
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
      "Insert · Quote",
      "Insert · —",
    ]) {
      expect(screen.getByRole("button", { name: command })).toBeEnabled();
    }
    expect(screen.queryByRole("button", { name: "Heading 1" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(screen.getByLabelText("admin.marketing.editorial_body")).toHaveAttribute("dir", "rtl");
  });

  it.each([
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
    ["Insert · Quote", "> Paragraph"],
    ["Insert · —", "\n\n---\n\n"],
  ])("applies the %s command", (buttonName, expected) => {
    const onChange = jest.fn();
    render(editor("", onChange));

    fireEvent.click(screen.getByRole("button", { name: buttonName }));
    expect(onChange).toHaveBeenCalledWith(expected);
  });
});
