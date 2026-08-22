import {
  getPublicArticle,
  getPublicArticles,
} from "@/lib/server/articles";

describe("public article API", () => {
  const originalBackendUrl = process.env.BACKEND_URL;

  beforeEach(() => {
    process.env.BACKEND_URL = "https://backend.example.test/api";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalBackendUrl === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = originalBackendUrl;
    }
  });

  it("loads summaries for the requested locale", async () => {
    const summaries = [
      {
        language: "AR",
        slug: "safe-driving",
        title: "Safe driving",
        summary: "Summary",
        publishedAt: "2026-08-22T10:00:00Z",
      },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => summaries,
    });

    await expect(getPublicArticles("ar")).resolves.toEqual(summaries);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://backend.example.test/api/articles?language=AR",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("encodes a detail slug and returns null for an unpublished article", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

    await expect(getPublicArticle("fr", "priorite & route")).resolves.toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://backend.example.test/api/articles/priorite%20%26%20route?language=FR",
      expect.any(Object),
    );
  });
});
