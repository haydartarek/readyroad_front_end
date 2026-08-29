import {
  buildAuthSwitchHref,
  buildLearningLoginHref,
  validateReturnUrl,
} from "@/lib/auth-return-url";

describe("learning action return URLs", () => {
  it("preserves localized learning routes", () => {
    expect(buildLearningLoginHref("/exam", "en")).toBe(
      "/login?returnUrl=%2Fexam",
    );
    expect(buildLearningLoginHref("/practice/random", "fr")).toBe(
      "/fr/login?returnUrl=%2Ffr%2Fpractice%2Frandom",
    );
    expect(buildLearningLoginHref("/practice/danger", "ar")).toBe(
      "/ar/login?returnUrl=%2Far%2Fpractice%2Fdanger",
    );
  });

  it("rejects external return URLs", () => {
    expect(validateReturnUrl("https://example.com")).toBeUndefined();
    expect(validateReturnUrl("//example.com")).toBeUndefined();
    expect(validateReturnUrl("/exam")).toBe("/exam");
  });

  it("keeps the return route while switching auth forms", () => {
    expect(buildAuthSwitchHref("/register", "/nl/exam", "nl")).toBe(
      "/nl/register?returnUrl=%2Fnl%2Fexam",
    );
  });
});
