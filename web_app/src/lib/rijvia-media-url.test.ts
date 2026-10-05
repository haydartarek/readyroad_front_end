import {
  resolveRijviaMediaUrl,
} from "./image-utils";

describe("resolveRijviaMediaUrl", () => {
  it.each([
    [
      "https://old.example.com/storage/public/images/lessons/les-0/page.png",
      "/images/lessons/les-0/page.png",
    ],
    [
      "https://old.example.com/storage/public/images/quiz/question.png",
      "/images/quiz/question.png",
    ],
    [
      "https://old.example.com/storage/public/images/signs/B1.png",
      "/images/signs/B1.png",
    ],
    [
      "https://old.example.com/storage/public/images/articles/article.png",
      "/images/articles/article.png",
    ],
  ])(
    "maps backend-owned absolute media %s",
    (input, expected) => {
      expect(
        resolveRijviaMediaUrl(input),
      ).toBe(expected);
    },
  );

  it.each([
    [
      "images/lessons/les-0/page.png",
      "/images/lessons/les-0/page.png",
    ],
    [
      "images/quiz/question.png",
      "/images/quiz/question.png",
    ],
    [
      "images/signs/B1.png",
      "/images/signs/B1.png",
    ],
    [
      "images/articles/article.png",
      "/images/articles/article.png",
    ],
  ])(
    "adds a leading slash to %s",
    (input, expected) => {
      expect(
        resolveRijviaMediaUrl(input),
      ).toBe(expected);
    },
  );

  it.each([
    [
      "lessons/les-0/page.png",
      "/images/lessons/les-0/page.png",
    ],
    [
      "quiz/question.png",
      "/images/quiz/question.png",
    ],
    [
      "signs/B1.png",
      "/images/signs/B1.png",
    ],
    [
      "articles/article.png",
      "/images/articles/article.png",
    ],
  ])(
    "normalizes legacy media path %s",
    (input, expected) => {
      expect(
        resolveRijviaMediaUrl(input),
      ).toBe(expected);
    },
  );

  it("preserves unrelated external URLs", () => {
    expect(
      resolveRijviaMediaUrl(
        "https://cdn.example.com/photo.png",
      ),
    ).toBe(
      "https://cdn.example.com/photo.png",
    );
  });

  it("preserves data URLs", () => {
    expect(
      resolveRijviaMediaUrl(
        "data:image/png;base64,abc",
      ),
    ).toBe(
      "data:image/png;base64,abc",
    );
  });

  it("returns null for missing media", () => {
    expect(
      resolveRijviaMediaUrl(null),
    ).toBeNull();

    expect(
      resolveRijviaMediaUrl("   "),
    ).toBeNull();
  });
});
