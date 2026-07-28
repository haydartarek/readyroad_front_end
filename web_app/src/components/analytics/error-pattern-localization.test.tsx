import { fireEvent, render, screen } from "@testing-library/react";

import { ErrorPatternList } from "./error-pattern-list";
import { ErrorSummary } from "./error-summary";

const translations: Record<string, string> = {
  "error_patterns.pattern_sign_confusion": "التشابه بين العلامات",
  "error_patterns.desc_sign_confusion": "الخلط بين علامات مرور متشابهة.",
  "error_patterns.grouped_analysis": "التفصيل التاريخي",
  "error_patterns.family_priority": "علامات الأولوية",
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
  uniqueQuestions: 3,
  affectedCategories: [],
  analysisGroups: [],
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

  it("localizes complete-history sign-family groups", () => {
    render(
      <ErrorPatternList
        patterns={[
          {
            ...pattern,
            analysisGroups: [
              {
                groupType: "TRAFFIC_SIGN_FAMILY",
                code: "PRIORITY",
                label: "PRIORITY",
                labelKey: "error_patterns.family_priority",
                count: 4,
              },
            ],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByText("التشابه بين العلامات"));

    expect(screen.getByText("التفصيل التاريخي")).toBeInTheDocument();
    expect(screen.getByText("علامات الأولوية")).toBeInTheDocument();
    expect(screen.queryByText("PRIORITY")).not.toBeInTheDocument();
  });
});
