import { render, screen } from "@testing-library/react";

import { ErrorPatternList } from "./error-pattern-list";
import { ErrorSummary } from "./error-summary";

const translations: Record<string, string> = {
  "error_patterns.pattern_sign_confusion": "التشابه بين العلامات",
  "error_patterns.desc_sign_confusion": "الخلط بين علامات مرور متشابهة.",
};

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    t: (key: string) => translations[key] ?? key,
    language: "ar",
  }),
}));

jest.mock("@/components/localized-link", () => {
  return function MockLink({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return <a href={href}>{children}</a>;
  };
});

const pattern = {
  pattern: "SIGN_CONFUSION",
  patternKey: "error_patterns.pattern_sign_confusion",
  descriptionKey: "error_patterns.desc_sign_confusion",
  count: 5,
  percentage: 100,
  severity: "HIGH" as const,
  affectedCategories: [],
  recommendation: "",
  recommendationKey: "error_patterns.rec_sign_confusion",
  exampleQuestions: [],
};

describe("error pattern localization", () => {
  it("renders the Arabic title and description without backend English copy", () => {
    render(<ErrorPatternList patterns={[pattern]} />);

    expect(screen.getByText("التشابه بين العلامات")).toBeInTheDocument();
    expect(
      screen.getByText("الخلط بين علامات مرور متشابهة."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Sign Confusion")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Confusion between similar traffic signs."),
    ).not.toBeInTheDocument();
  });

  it("localizes the top-pattern label in the summary", () => {
    render(<ErrorSummary totalErrors={5} patterns={[pattern]} />);

    expect(screen.getByText("التشابه بين العلامات")).toBeInTheDocument();
    expect(screen.queryByText("SIGN_CONFUSION")).not.toBeInTheDocument();
  });
});
