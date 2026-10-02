import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NewAdminLessonPage from "./page";
import { createAdminLesson } from "@/lib/admin-lessons";

jest.mock("@/lib/admin-lessons", () => ({
  createAdminLesson: jest.fn(),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    language: "en",
    isRTL: false,
    t: (key: string) => key,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

const mockedCreate = createAdminLesson as jest.MockedFunction<typeof createAdminLesson>;

describe("NewAdminLessonPage", () => {
  beforeEach(() => mockedCreate.mockReset());

  it("submits a real lesson creation payload", async () => {
    mockedCreate.mockResolvedValue({ lessonCode: "les-30" } as never);
    render(<NewAdminLessonPage />);

    const fields = screen.getAllByRole("textbox");
    fields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: `value-${index + 1}` } });
    });

    fireEvent.submit(screen.getByRole("button", { name: "admin.lessons.create.submit" }).closest("form")!);

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1));
    expect(mockedCreate.mock.calls[0][0]).toMatchObject({
      lessonCode: "value-1",
      titleAr: "value-3",
      titleNl: "value-4",
      titleFr: "value-5",
      titleEn: "value-6",
      page: {
        titleAr: "value-11",
        titleNl: "value-12",
        titleFr: "value-13",
        titleEn: "value-14",
      },
    });
  });
});
