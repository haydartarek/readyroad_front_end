import robots from "@/app/robots";
import { DEFAULT_APP_URL } from "@/lib/site-copy";

describe("robots policy", () => {
  it("keeps public content crawlable and private surfaces blocked", () => {
    const policy = robots();
    const defaultRule = Array.isArray(policy.rules)
      ? policy.rules.find((rule) => rule.userAgent === "*")
      : policy.rules;

    expect(defaultRule).toEqual(
      expect.objectContaining({
        allow: expect.arrayContaining(["/", "/traffic-signs/", "/lessons/"]),
        disallow: expect.arrayContaining(["/admin", "/api/", "/dashboard"]),
      }),
    );
    expect(defaultRule?.disallow).not.toContain("/_next/");
    expect(policy.sitemap).toBe(
      `${process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL}/sitemap.xml`,
    );
    expect(policy.host).toBe(process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL);
  });
});
