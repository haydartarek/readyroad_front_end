import { renderHook, waitFor } from "@testing-library/react";
import { apiClient } from "@/lib/api";
import { useExamQuestionPresentation } from "./use-exam-question-presentation";

jest.mock("@/lib/api", () => ({
  apiClient: { post: jest.fn() },
  logApiError: jest.fn(),
}));

const post = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

describe("useExamQuestionPresentation", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({} as Awaited<ReturnType<typeof apiClient.post>>);
  });

  it("records each currently displayed exam question once", async () => {
    const { rerender } = renderHook(
      ({ questionId }) =>
        useExamQuestionPresentation(42, questionId, true),
      { initialProps: { questionId: 11 } },
    );

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        "/exams/simulations/42/questions/11/presented",
      );
    });

    rerender({ questionId: 11 });
    expect(post).toHaveBeenCalledTimes(1);

    rerender({ questionId: 12 });
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post).toHaveBeenLastCalledWith(
      "/exams/simulations/42/questions/12/presented",
    );
  });
});
