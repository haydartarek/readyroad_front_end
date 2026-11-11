import { render, screen } from "@testing-library/react";
import { PilotInlineLink } from "./pilot-inline-link";
import { PilotSignLessonLink } from "./pilot-sign-lesson-link";

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

it("links only the first paragraph that mentions the sign and preserves the text", () => {
  const paragraphs = ["B19 overview", "Other text", "The B19 sign gives way to oncoming drivers."];
  const { container, rerender } = render(
    <PilotInlineLink
      lessonCode="les-15"
      pageNumber={6}
      paragraphIndex={0}
      paragraphs={paragraphs}
      text={paragraphs[0]}
      availableSignCodes={["B19"]}
    />,
  );
  expect(screen.getByRole("link", { name: "B19" })).toHaveAttribute("href", "/traffic-signs/B19");
  expect(container.textContent).toBe(paragraphs[0]);

  rerender(
    <PilotInlineLink
      lessonCode="les-15"
      pageNumber={6}
      paragraphIndex={2}
      paragraphs={paragraphs}
      text={paragraphs[2]}
      availableSignCodes={["B19"]}
    />,
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it("links a single-paragraph lesson page, as the published lessons are structured", () => {
  const text = "What do B19 and B21 mean? B19 means the oncoming traffic has priority.";
  const { container } = render(
    <PilotInlineLink
      lessonCode="les-15"
      pageNumber={6}
      paragraphIndex={0}
      paragraphs={[text]}
      text={text}
      availableSignCodes={["B19", "B21"]}
    />,
  );
  expect(screen.getAllByRole("link")).toHaveLength(2);
  expect(screen.getByRole("link", { name: "B19" })).toHaveAttribute("href", "/traffic-signs/B19");
  expect(screen.getByRole("link", { name: "B21" })).toHaveAttribute("href", "/traffic-signs/B21");
  expect(container.textContent).toBe(text);
});

it("links each published sign once without matching a code inside another code", () => {
  const text = "E9a, E9g and E9a apply here; E1 is another sign.";
  const { container } = render(
    <PilotInlineLink
      lessonCode="les-27"
      pageNumber={1}
      paragraphIndex={0}
      paragraphs={[text]}
      text={text}
      availableSignCodes={["E9a", "E9g"]}
    />,
  );
  expect(screen.getAllByRole("link")).toHaveLength(2);
  expect(screen.getByRole("link", { name: "E9a" })).toHaveAttribute("href", "/traffic-signs/E9a");
  expect(screen.getByRole("link", { name: "E9g" })).toHaveAttribute("href", "/traffic-signs/E9g");
  expect(container.textContent).toBe(text);
});

it("uses the first matching prose paragraph in each translation and omits unavailable signs", () => {
  const paragraphs = ["Intro", "• D10", "The D10 sign applies here."];
  const { rerender } = render(
    <PilotInlineLink
      lessonCode="les-5"
      pageNumber={1}
      paragraphIndex={2}
      paragraphs={paragraphs}
      text={paragraphs[2]}
      availableSignCodes={["D10"]}
    />,
  );
  expect(screen.getByRole("link", { name: "D10" })).toBeInTheDocument();
  rerender(
    <PilotInlineLink
      lessonCode="les-5"
      pageNumber={1}
      paragraphIndex={2}
      paragraphs={paragraphs}
      text={paragraphs[2]}
      availableSignCodes={[]}
    />,
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it.each([
  ["nl", "fietszone"],
  ["fr", "zone cyclable"],
  ["en", "cycle zone"],
  ["ar", "منطقة الدراجات"],
])("links the existing F113 lesson phrase in %s", (language, anchor) => {
  const text = `Before ${anchor} after`;
  const { container } = render(
    <PilotSignLessonLink
      signCode="F113"
      text={text}
      language={language}
      availableLessonCodes={["les-7"]}
    />,
  );
  expect(screen.getByRole("link", { name: anchor })).toHaveAttribute("href", "/lessons/les-7#section-5");
  expect(container.textContent).toBe(text);
});

it("omits a lesson link when the public lesson is unavailable", () => {
  render(
    <PilotSignLessonLink
      signCode="B17"
      text="De voorrang van rechts geldt."
      language="nl"
      availableLessonCodes={[]}
    />,
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
