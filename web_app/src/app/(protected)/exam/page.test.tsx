import type { ReactElement } from "react";
import CategoryExamMode from "@/components/exam/category-exam-mode";
import TheoryExamEntry from "@/components/exam/theory-exam-entry";
import TheoryExamPage from "./page";

describe("TheoryExamPage route mode", () => {
  it("keeps the normal exam when no category is requested", async () => {
    const element = (await TheoryExamPage({
      searchParams: Promise.resolve({}),
    })) as ReactElement;

    expect(element.type).toBe(TheoryExamEntry);
  });

  it("uses category mode on the same /exam page", async () => {
    const element = (await TheoryExamPage({
      searchParams: Promise.resolve({ category: "th08" }),
    })) as ReactElement<{ categoryCode: string }>;

    expect(element.type).toBe(CategoryExamMode);
    expect(element.props.categoryCode).toBe("TH08");
  });

  it("does not activate category mode for an invalid category code", async () => {
    const element = (await TheoryExamPage({
      searchParams: Promise.resolve({ category: "INVALID" }),
    })) as ReactElement;

    expect(element.type).toBe(TheoryExamEntry);
  });
});