import { isMissingPublishedArticle } from "@/lib/server/article-route-status";

describe("public article proxy status", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("marks only a confirmed backend 404 as missing", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 404 }) as jest.Mock;

    await expect(isMissingPublishedArticle("/blog/missing", "nl")).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/articles/missing?language=NL"),
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("does not convert source failures or unrelated routes into article 404s", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ status: 503 })
      .mockRejectedValueOnce(new Error("unavailable")) as jest.Mock;

    await expect(isMissingPublishedArticle("/blog/source-failure", "en")).resolves.toBe(false);
    await expect(isMissingPublishedArticle("/blog/network-failure", "fr")).resolves.toBe(false);
    await expect(isMissingPublishedArticle("/lessons", "ar")).resolves.toBe(false);
  });
});
