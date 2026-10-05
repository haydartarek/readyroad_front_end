import {
  resolveLessonImageUrl,
} from "./lesson-image-url";

describe("resolveLessonImageUrl", () => {
  it("converts old Supabase lesson URLs to the internal lesson route", () => {
    expect(
      resolveLessonImageUrl(
        "https://example.supabase.co/storage/v1/object/public/rijvia-public/images/lessons/les-0/page-1.png",
      ),
    ).toBe(
      "/images/lessons/les-0/page-1.png",
    );
  });

  it("preserves an existing internal lesson route", () => {
    expect(
      resolveLessonImageUrl(
        "/images/lessons/les-0/page-1.png",
      ),
    ).toBe(
      "/images/lessons/les-0/page-1.png",
    );
  });

  it("adds a leading slash when needed", () => {
    expect(
      resolveLessonImageUrl(
        "images/lessons/les-0/page-1.png",
      ),
    ).toBe(
      "/images/lessons/les-0/page-1.png",
    );
  });

  it("normalizes legacy lessons paths", () => {
    expect(
      resolveLessonImageUrl(
        "lessons/les-0/page-1.png",
      ),
    ).toBe(
      "/images/lessons/les-0/page-1.png",
    );
  });

  it("does not rewrite unrelated external images", () => {
    expect(
      resolveLessonImageUrl(
        "https://cdn.example.com/image.png",
      ),
    ).toBe(
      "https://cdn.example.com/image.png",
    );
  });

  it("returns null when no usable source exists", () => {
    expect(resolveLessonImageUrl(null)).toBeNull();
    expect(resolveLessonImageUrl("   ")).toBeNull();
  });
});
