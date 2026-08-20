import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { AppNotification } from "@/services/userService";
import { NotificationPanel } from "@/components/layout/notification-panel";

type Language = "en" | "nl" | "fr" | "ar";

const mockGetNotifications = jest.fn<Promise<AppNotification[]>, []>();
const mockMarkNotificationAsRead = jest.fn();
const mockMarkAllRead = jest.fn();
let mockLanguage: Language = "en";
let mockRevision = 0;

const labels: Record<Language, Record<string, string>> = {
  en: {
    "notif.title": "Notifications",
    "notif.show_latest_15": "Show latest 15 notifications",
    "common.loading": "Loading",
  },
  nl: {
    "notif.title": "Meldingen",
    "notif.show_latest_15": "Laatste 15 meldingen tonen",
    "common.loading": "Laden",
  },
  fr: {
    "notif.title": "Notifications",
    "notif.show_latest_15": "Afficher les 15 dernières notifications",
    "common.loading": "Chargement",
  },
  ar: {
    "notif.title": "الإشعارات",
    "notif.show_latest_15": "عرض آخر 15 إشعارًا",
    "common.loading": "جارٍ التحميل",
  },
};

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    language: mockLanguage,
    t: (key: string, params?: Record<string, string | number>) =>
      key === "notif.msg.weak_area"
        ? `Weak area: ${params?.category}`
        : key === "notif.msg.lesson_progress"
          ? `Lesson: ${params?.lesson}`
        : labels[mockLanguage][key] ?? key,
  }),
}));

jest.mock("@/contexts/notification-context", () => ({
  useNotifications: () => ({
    unreadCount: 0,
    revision: mockRevision,
    markAllRead: mockMarkAllRead,
  }),
}));

jest.mock("@/services/userService", () => ({
  getNotifications: () => mockGetNotifications(),
  markNotificationAsRead: (...args: unknown[]) =>
    mockMarkNotificationAsRead(...args),
}));

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function notification(id: number): AppNotification {
  return {
    id,
    type: "CUSTOM",
    title: `Notification ${id}`,
    message: `Message ${id}`,
    isRead: true,
    createdAt: new Date(Date.UTC(2026, 6, 30, 12, id)).toISOString(),
  };
}

function notifications(count: number): AppNotification[] {
  return Array.from({ length: count }, (_, index) => notification(index + 1));
}

async function openPanel() {
  fireEvent.click(
    screen.getByRole("button", {
      name: labels[mockLanguage]["notif.title"],
    }),
  );
  await waitFor(() =>
    expect(screen.queryAllByRole("listitem").length).toBeGreaterThan(0),
  );
}

beforeEach(() => {
  mockLanguage = "en";
  mockRevision = 0;
  mockGetNotifications.mockReset();
  mockMarkNotificationAsRead.mockReset();
  mockMarkAllRead.mockReset();
});

describe("NotificationPanel latest notifications action", () => {
  test.each([
    ["en", "Information signs"],
    ["nl", "Informatieborden"],
    ["fr", "Signaux d'information"],
    ["ar", "علامات المعلومات"],
  ] as const)("renders the weak-area category in %s", async (language, expected) => {
    mockLanguage = language;
    mockGetNotifications.mockResolvedValueOnce([
      {
        ...notification(1),
        type: "WEAK_AREA",
        messageKey: "notif.msg.weak_area",
        messageParams: JSON.stringify({
          category: "Information signs",
          categoryEn: "Information signs",
          categoryNl: "Informatieborden",
          categoryFr: "Signaux d'information",
          categoryAr: "علامات المعلومات",
        }),
      },
    ]);

    render(<NotificationPanel />);
    await openPanel();

    expect(screen.getByText(`Weak area: ${expected}`)).toBeInTheDocument();
  });

  test.each([
    ["en", "Priority rules"],
    ["nl", "Voorrangsregels"],
    ["fr", "Règles de priorité"],
    ["ar", "قواعد الأولوية"],
  ] as const)("renders the lesson title in %s", async (language, expected) => {
    mockLanguage = language;
    mockGetNotifications.mockResolvedValueOnce([
      {
        ...notification(1),
        type: "LESSON_PROGRESS",
        messageKey: "notif.msg.lesson_progress",
        messageParams: JSON.stringify({
          lesson: "Priority rules",
          lessonEn: "Priority rules",
          lessonNl: "Voorrangsregels",
          lessonFr: "Règles de priorité",
          lessonAr: "قواعد الأولوية",
        }),
      },
    ]);

    render(<NotificationPanel />);
    await openPanel();

    expect(screen.getByText(`Lesson: ${expected}`)).toBeInTheDocument();
  });

  test("refreshes an open panel when polling detects a new notification", async () => {
    mockGetNotifications
      .mockResolvedValueOnce([notification(1)])
      .mockResolvedValueOnce([notification(2), notification(1)]);

    const view = render(<NotificationPanel />);
    await openPanel();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    mockRevision = 1;
    view.rerender(<NotificationPanel />);

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2));
    expect(mockMarkAllRead).toHaveBeenCalled();
  });

  test.each([
    ["en"],
    ["nl"],
    ["fr"],
    ["ar"],
  ] as const)(
    "loads 15 unique notifications through the interactive action in %s",
    async (language) => {
      mockLanguage = language;
      let resolveLatest:
        | ((value: AppNotification[]) => void)
        | undefined;
      mockGetNotifications
        .mockResolvedValueOnce(notifications(20))
        .mockImplementationOnce(
          () =>
            new Promise<AppNotification[]>((resolve) => {
              resolveLatest = resolve;
            }),
        );

      render(<NotificationPanel />);
      await openPanel();

      expect(screen.getAllByRole("listitem")).toHaveLength(5);
      const action = screen.getByTestId("show-latest-notifications");
      expect(action).toHaveTextContent(
        labels[language]["notif.show_latest_15"],
      );
      expect(action).toHaveAttribute(
        "aria-label",
        labels[language]["notif.show_latest_15"],
      );

      fireEvent.click(action);
      expect(action).toBeDisabled();
      expect(action).toHaveTextContent(labels[language]["common.loading"]);

      const duplicateHeavyResponse = Array.from(
        { length: 15 },
        (_, index) => notification(Math.floor(index / 2) + 1),
      );
      await act(async () => {
        resolveLatest?.(duplicateHeavyResponse);
      });

      await waitFor(() =>
        expect(screen.getAllByRole("listitem")).toHaveLength(15),
      );
      const visibleTitles = screen
        .getAllByRole("listitem")
        .map((item) =>
          within(item).getByText(/^Notification \d+$/).textContent,
        );
      expect(new Set(visibleTitles).size).toBe(15);
      expect(
        screen.queryByTestId("show-latest-notifications"),
      ).not.toBeInTheDocument();
      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    },
  );

  test("does not show a misleading action when fewer than 15 notifications exist", async () => {
    mockGetNotifications.mockResolvedValueOnce(notifications(8));

    render(<NotificationPanel />);
    await openPanel();

    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(
      screen.queryByTestId("show-latest-notifications"),
    ).not.toBeInTheDocument();
  });

  test("keeps the preview and restores the action after a load failure", async () => {
    mockGetNotifications
      .mockResolvedValueOnce(notifications(20))
      .mockRejectedValueOnce(new Error("Temporary notification failure"));

    render(<NotificationPanel />);
    await openPanel();

    const action = screen.getByTestId("show-latest-notifications");
    fireEvent.click(action);

    await waitFor(() => expect(action).toBeEnabled());
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(action).toHaveTextContent(
      labels.en["notif.show_latest_15"],
    );
  });
});
