import {
  formatExamDuration,
  localizeExamText,
} from "@/lib/exam-results-presentation";

describe("exam results presentation", () => {
  it.each([null, undefined, Number.NaN, -1])(
    "keeps missing or invalid duration %s unavailable",
    (value) => {
      expect(formatExamDuration(value)).toBeNull();
    },
  );

  it.each([
    [0, "00:00"],
    [600, "10:00"],
    [3661, "1:01:01"],
  ])("formats a real duration of %s seconds", (seconds, expected) => {
    expect(formatExamDuration(seconds)).toBe(expected);
  });

  it.each([
    ["en", "Priority"],
    ["ar", "الأولوية"],
    ["nl", "Voorrang"],
    ["fr", "Priorité"],
  ] as const)("selects the %s exam text", (language, expected) => {
    expect(
      localizeExamText(language, {
        en: "Priority",
        ar: "الأولوية",
        nl: "Voorrang",
        fr: "Priorité",
      }),
    ).toBe(expected);
  });

  it("uses English when a requested translation is missing", () => {
    expect(localizeExamText("ar", { en: "Priority" })).toBe("Priority");
  });
});
