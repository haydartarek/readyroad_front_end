import { getApiErrorMessage } from "@/lib/api";

describe("getApiErrorMessage", () => {
  it("returns the exact backend validation reason", () => {
    expect(getApiErrorMessage({
      isAxiosError: true,
      response: {
        data: {
          message: "Internal article target is not published in AR",
        },
      },
    }, "Request failed")).toBe(
      "Internal article target is not published in AR",
    );
  });

  it("falls back when the response does not expose a safe validation message", () => {
    expect(getApiErrorMessage({ isAxiosError: true }, "Request failed"))
      .toBe("Request failed");
  });
});
