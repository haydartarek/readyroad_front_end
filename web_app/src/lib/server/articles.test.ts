import {
  getPublicArticle,
  getPublicArticles,
  getRelatedPublicArticles,
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
        alternateSlugs: {
          EN: "safe-driving",
          NL: "veilig-rijden",
          FR: "conduite-sure",
          AR: "al-qiyada-al-amina",
        },
      },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => summaries,
    });

    await expect(getPublicArticles("ar")).resolves.toEqual(summaries);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://backend.example.test/api/articles?language=AR",
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
  });

  it("encodes a detail slug and returns null for an unpublished article", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

    await expect(getPublicArticle("fr", "priorite & route")).resolves.toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://backend.example.test/api/articles/priorite%20%26%20route?language=FR",
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
  });

  it("reads the latest published replacement on the same URL", async () => {
    const first = { slug: "published-guide", body: "Original published version" };
    const updated = { ...first, body: "Reviewed replacement" };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => first })
      .mockResolvedValueOnce({ ok: true, json: async () => updated });

    await expect(getPublicArticle("en", "published-guide")).resolves.toEqual(first);
    await expect(getPublicArticle("en", "published-guide")).resolves.toEqual(updated);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    for (const [, options] of (global.fetch as jest.Mock).mock.calls) {
      expect(options).toEqual({ headers: { Accept: "application/json" }, cache: "no-store" });
    }
  });

  it("loads published articles that link back to a real learning asset", async () => {
    const related = [{
      language: "NL",
      slug: "voorrang-van-rechts",
      title: "Voorrang van rechts",
      summary: "Samenvatting",
      publishedAt: "2026-08-22T10:00:00Z",
      alternateSlugs: { NL: "voorrang-van-rechts" },
    }];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => related,
    });

    await expect(getRelatedPublicArticles("nl", "/nl/lessons/les-19/2"))
      .resolves.toEqual(related);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://backend.example.test/api/articles/related?language=NL&targetPath=%2Fnl%2Flessons%2Fles-19%2F2&limit=3",
      expect.any(Object),
    );
  });
});
