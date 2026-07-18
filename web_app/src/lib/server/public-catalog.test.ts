import { getPublicBackendApiUrl } from "@/lib/server/public-catalog";

describe("public catalog API configuration", () => {
  const originalBackendUrl = process.env.BACKEND_URL;
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    if (originalBackendUrl === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = originalBackendUrl;
    }

    if (originalPublicUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    }
  });

  it("adds the API path when the backend URL is an origin", () => {
    process.env.BACKEND_URL = "https://backend.example.test/";
    expect(getPublicBackendApiUrl()).toBe("https://backend.example.test/api");
  });

  it("does not duplicate an existing API path", () => {
    process.env.BACKEND_URL = "https://backend.example.test/api/";
    expect(getPublicBackendApiUrl()).toBe("https://backend.example.test/api");
  });
});
