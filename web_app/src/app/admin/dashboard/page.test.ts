import { getVisibleDifficultyCounts } from "./page";

describe("admin dashboard theory difficulty counters", () => {
  it("remains compatible when an older response omits UNCLASSIFIED", () => {
    expect(
      getVisibleDifficultyCounts({ EASY: 28, MEDIUM: 48, HARD: 28 }),
    ).toEqual([
      ["EASY", 28],
      ["MEDIUM", 48],
      ["HARD", 28],
    ]);
  });

  it("shows a real unclassified count without highlighting an empty tier", () => {
    expect(
      getVisibleDifficultyCounts({
        EASY: 28,
        MEDIUM: 48,
        HARD: 28,
        UNCLASSIFIED: 10,
      }),
    ).toEqual([
      ["EASY", 28],
      ["MEDIUM", 48],
      ["HARD", 28],
      ["UNCLASSIFIED", 10],
    ]);
  });
});
