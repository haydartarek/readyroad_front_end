import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminEditQuizQuestionPage from "./page";
import { apiClient } from "@/lib/api";

const pushMock = jest.fn();
const translate = (key: string) => key;

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
  useSearchParams: () =>
    new URLSearchParams(
      "returnTo=%2Fadmin%2Fquizzes%3Fpage%3D4%26q%3Dpriority",
    ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean; unoptimized?: boolean }) => {
    const imageProps = { ...props };
    const alt = imageProps.alt ?? "";
    delete imageProps.fill;
    delete imageProps.priority;
    delete imageProps.unoptimized;
    delete imageProps.alt;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...imageProps} />;
  },
}));

jest.mock("@/hooks/use-localized-router", () => ({
  useLocalizedRouter: () => ({ push: pushMock }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    language: "en",
    t: translate,
  }),
}));

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/components/admin/AdminPageHeader", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

jest.mock("@/components/admin/AdminSectionCard", () => ({
  __esModule: true,
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section aria-label={title}>{children}</section>
  ),
}));

jest.mock("@/lib/auth-token", () => ({ getCsrfToken: () => null }));

jest.mock("@/lib/api", () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
  isServiceUnavailable: () => false,
  logApiError: jest.fn(),
}));

const question = {
  id: 7,
  version: 3,
  categoryCode: "A",
  categoryNameEn: "Danger signs",
  difficultyLevel: "MEDIUM",
  questionType: "IMAGE_BASED",
  questionEn: "English question",
  questionAr: "سؤال عربي",
  questionNl: "Nederlandse vraag",
  questionFr: "Question française",
  explanationEn: "English explanation",
  explanationAr: "شرح عربي",
  explanationNl: "Nederlandse uitleg",
  explanationFr: "Explication française",
  contentImageUrl: "/images/quiz/question.png",
  isActive: true,
  optionsCount: 2,
  options: [
    {
      id: 101,
      textEn: "Stop",
      textAr: "توقف",
      textNl: "Stop",
      textFr: "Arrêtez",
      isCorrect: true,
      displayOrder: 1,
    },
    {
      id: 102,
      textEn: "Continue",
      textAr: "تابع",
      textNl: "Doorgaan",
      textFr: "Continuez",
      isCorrect: false,
      displayOrder: 2,
    },
  ],
  isReferenced: true,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
};

const mockedGet = apiClient.get as jest.Mock;
const mockedPut = apiClient.put as jest.Mock;

describe("Admin theoretical question editing", () => {
  beforeEach(() => {
    pushMock.mockReset();
    mockedGet.mockReset();
    mockedPut.mockReset();
    mockedGet.mockImplementation((url: string) =>
      Promise.resolve({ data: url === "/admin/quiz/categories" ? [{ code: "A", nameEn: "Danger signs" }] : question }),
    );
    mockedPut.mockResolvedValue({ data: question });
  });

  it("loads referenced answers as editable and submits stable option identities", async () => {
    render(<AdminEditQuizQuestionPage />);

    const englishOptions = await screen.findAllByLabelText(
      "admin.quizzes.form.option_text_en *",
    );
    expect(englishOptions).toHaveLength(2);
    expect(englishOptions[0]).toHaveValue("Stop");
    expect(screen.getAllByRole("radio")[0]).toBeEnabled();
    expect(screen.getByRole("button", { name: /admin.quizzes.form.add_option/ })).toBeEnabled();

    fireEvent.change(englishOptions[0], { target: { value: "Stop now" } });
    fireEvent.click(screen.getAllByRole("radio")[1]);
    fireEvent.click(screen.getByRole("button", { name: /admin.quizzes.form.add_option/ }));

    const fillLast = (label: string, value: string) => {
      const fields = screen.getAllByLabelText(label);
      fireEvent.change(fields[fields.length - 1], { target: { value } });
    };
    fillLast("admin.quizzes.form.option_text_en *", "Wait");
    fillLast("admin.quizzes.form.option_text_ar *", "انتظر");
    fillLast("admin.quizzes.form.option_text_nl *", "Wacht");
    fillLast("admin.quizzes.form.option_text_fr *", "Attendez");

    fireEvent.click(screen.getByRole("button", { name: "admin.quizzes.form.update" }));

    await waitFor(() => expect(mockedPut).toHaveBeenCalledTimes(1));
    expect(mockedPut.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        version: 3,
        explanationAr: "شرح عربي",
        options: [
          expect.objectContaining({ id: 101, textEn: "Stop now", isCorrect: false }),
          expect.objectContaining({ id: 102, isCorrect: true }),
          expect.objectContaining({ id: null, textEn: "Wait", displayOrder: 3 }),
        ],
      }),
    );
  });

  it("shows a translated conflict instead of silently overwriting a newer edit", async () => {
    mockedPut.mockRejectedValue({ response: { status: 409, data: {} } });
    render(<AdminEditQuizQuestionPage />);
    await screen.findAllByLabelText("admin.quizzes.form.option_text_en *");

    fireEvent.click(screen.getByRole("button", { name: /admin.quizzes.form.add_option/ }));
    const fillLast = (label: string, value: string) => {
      const fields = screen.getAllByLabelText(label);
      fireEvent.change(fields[fields.length - 1], { target: { value } });
    };
    fillLast("admin.quizzes.form.option_text_en *", "Wait");
    fillLast("admin.quizzes.form.option_text_ar *", "انتظر");
    fillLast("admin.quizzes.form.option_text_nl *", "Wacht");
    fillLast("admin.quizzes.form.option_text_fr *", "Attendez");
    fireEvent.click(screen.getByRole("button", { name: "admin.quizzes.form.update" }));

    expect(await screen.findByText("admin.quizzes.form.edit_conflict")).toBeInTheDocument();
  });

  it("removes option C and removes the image reference without stale payload data", async () => {
    render(<AdminEditQuizQuestionPage />);
    await screen.findAllByLabelText("admin.quizzes.form.option_text_en *");

    fireEvent.click(screen.getByRole("button", { name: /admin.quizzes.form.add_option/ }));
    fireEvent.click(screen.getByRole("button", { name: "admin.quizzes.form.remove_option C" }));
    fireEvent.click(screen.getByRole("button", { name: "admin.quizzes.upload.remove" }));

    expect(screen.queryByAltText("practice.question_image_alt")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("admin.quizzes.form.option_text_en *")).toHaveLength(2);
  });

  it("shows a neutral translated state when the current image request fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(<AdminEditQuizQuestionPage />);
    const image = await screen.findByAltText("practice.question_image_alt");

    fireEvent.error(image);

    expect(await screen.findByText("admin.quizzes.form.image_preview_error")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to load quiz question image",
      "/images/quiz/question.png",
    );
    consoleError.mockRestore();
  });

  it("keeps every explanation editor visible and warns about missing translations", async () => {
    mockedGet.mockImplementation((url: string) =>
      Promise.resolve({
        data:
          url === "/admin/quiz/categories"
            ? [{ code: "A", nameEn: "Danger signs" }]
            : { ...question, explanationAr: null, explanationFr: "" },
      }),
    );

    render(<AdminEditQuizQuestionPage />);

    expect(await screen.findAllByText("admin.quizzes.missing_translation")).toHaveLength(2);
    expect(screen.getByLabelText("admin.quizzes.form.explanation_ar")).toBeInTheDocument();
    expect(screen.getByLabelText("admin.quizzes.form.explanation_fr")).toBeInTheDocument();
  });
});
