import { render, screen } from "@testing-library/react";
import ArticleMarkdown from "@/components/blog/ArticleMarkdown";

describe("ArticleMarkdown", () => {
  it("inserts learning content once after the second body paragraph, not inside a list or quote", () => {
    const body = "## Heading\n\nFirst paragraph.\n\n> Quoted paragraph.\n\n- List item\n\nSecond paragraph with **emphasis**.\n\nThird paragraph.";
    const { rerender } = render(
      <ArticleMarkdown body={body} afterSecondParagraph={<aside>Learning cards</aside>} />,
    );

    const cards = screen.getByRole("complementary");
    expect(cards.previousElementSibling).toHaveTextContent("Second paragraph with emphasis.");
    expect(cards.nextElementSibling).toHaveTextContent("Third paragraph.");
    expect(cards.parentElement).toBe(screen.getByTestId("article-markdown"));
    rerender(<ArticleMarkdown body={body} afterSecondParagraph={<aside>Learning cards</aside>} />);
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
  });

  it("leaves editor previews and bodies without a second paragraph unchanged", () => {
    const { rerender } = render(<ArticleMarkdown body={"First.\n\nSecond."} />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    rerender(<ArticleMarkdown body="Only paragraph." afterSecondParagraph={<aside>Learning cards</aside>} />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("renders structured Markdown without accepting raw HTML or unsafe URLs", () => {
    render(
      <ArticleMarkdown
        body={[
          "## Structured heading",
          "",
          "A paragraph with **reviewed evidence**.",
          "",
          "- First point",
          "- Second point",
          "",
          "[Internal lesson](/ar/lessons/les-19/2)",
          "",
          "[Unsafe link](javascript:alert('no'))",
          "",
          "<script>window.alert('blocked')</script>",
        ].join("\n")}
      />,
    );

    expect(screen.getByRole("heading", { name: "Structured heading", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("reviewed evidence")).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();

    const safeLink = screen.getByRole("link", { name: "Internal lesson" });
    expect(safeLink).toHaveAttribute("href", "/ar/lessons/les-19/2");

    expect(screen.queryByRole("link", { name: "Unsafe link" })).not.toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });

  it("continues to render legacy plain-text paragraphs", () => {
    render(<ArticleMarkdown body={"First legacy paragraph.\n\nSecond legacy paragraph."} />);

    expect(screen.getByText("First legacy paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second legacy paragraph.")).toBeInTheDocument();
  });

  it("applies only the approved typography token set", () => {
    render(
      <ArticleMarkdown
        body={"# Main heading\n\n#### Detail\n\nReadable paragraph."}
        typography={{
          h1Size: "LARGE",
          h2Size: "DEFAULT",
          h3Size: "DEFAULT",
          h4Size: "COMPACT",
          paragraphSize: "LARGE",
          textColor: "SECONDARY",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Main heading", level: 1 }))
      .toHaveClass("text-4xl");
    expect(screen.getByRole("heading", { name: "Detail", level: 4 }))
      .toHaveClass("text-sm");
    expect(screen.getByText("Readable paragraph."))
      .toHaveClass("text-lg");
    expect(screen.getByTestId("article-markdown"))
      .toHaveClass("text-secondary");
  });
});
