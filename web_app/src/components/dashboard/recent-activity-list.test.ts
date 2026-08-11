import { formatActivityDate } from "./recent-activity-list";

describe("formatActivityDate", () => {
  test.each(["en", "nl", "fr", "ar"])(
    "uses the Gregorian calendar for %s",
    (language) => {
      const formatted = formatActivityDate("2026-07-29T16:52:00Z", language);

      expect(formatted).toMatch(/2026|٢٠٢٦/);
      expect(formatted).not.toMatch(/هـ|AH/i);
    },
  );
});
