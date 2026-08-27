import { redirect } from "next/navigation";

import ExamIndexPage from "./page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("ExamIndexPage", () => {
  it("redirects the legacy exam route to the default sign exam", async () => {
    await ExamIndexPage({
      params: Promise.resolve({ signCode: "A11" }),
    });

    expect(redirect).toHaveBeenCalledWith("/traffic-signs/A11/exam/1");
  });
});
