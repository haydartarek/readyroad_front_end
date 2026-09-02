import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";

type Language = "en" | "nl" | "fr" | "ar";

const mockLogout = jest.fn();
const mockSetLanguage = jest.fn();
const mockRouterPush = jest.fn();
let mockLanguage: Language = "en";
let mockIsAuthenticated = true;
let mockPathname = "/lessons";

const mockUser = {
  userId: 42,
  username: "haydar",
  fullName: "Haydar Tarek",
  email: "haydar.with.a.very.long.address@example.com",
  role: "USER",
  preferredLanguage: "ar",
};

const mockLabels: Record<Language, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.lessons": "Driving Licence Lessons",
    "nav.traffic_signs": "Study Traffic Signs",
    "nav.practice": "Traffic Sign Practice",
    "nav.exam": "Theory Exam Simulator",
    "nav.faq": "FAQ",
    "nav.account_menu": "Account menu",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profile",
    "nav.videos": "Driving Videos",
    "nav.blog": "Blog",
    "nav.compact_home": "Home",
    "nav.compact_lessons": "Lessons",
    "nav.compact_traffic_signs": "Traffic Signs",
    "nav.compact_practice": "Practice",
    "nav.compact_exam": "Exam",
    "nav.compact_videos": "Driving Videos",
    "auth.logout": "Log out",
  },
  nl: {
    "nav.home": "Home",
    "nav.lessons": "Rijbewijslessen",
    "nav.traffic_signs": "Verkeersborden leren",
    "nav.practice": "Verkeersborden oefenen",
    "nav.exam": "Theorie-examensimulator",
    "nav.faq": "FAQ",
    "nav.account_menu": "Accountmenu",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profiel",
    "nav.videos": "Rijlesvideo’s",
    "nav.blog": "Blog",
    "nav.compact_home": "Home",
    "nav.compact_lessons": "Lessen",
    "nav.compact_traffic_signs": "Verkeersborden",
    "nav.compact_practice": "Oefenen",
    "nav.compact_exam": "Examen",
    "nav.compact_videos": "Rijlesvideo’s",
    "auth.logout": "Uitloggen",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.lessons": "Cours du permis de conduire",
    "nav.traffic_signs": "Étudier les panneaux routiers",
    "nav.practice": "Entraînement aux panneaux routiers",
    "nav.exam": "Simulateur d’examen théorique",
    "nav.faq": "FAQ",
    "nav.account_menu": "Menu du compte",
    "nav.dashboard": "Tableau de Bord",
    "nav.profile": "Profil",
    "nav.videos": "Vidéos de conduite",
    "nav.blog": "Articles",
    "nav.compact_home": "Accueil",
    "nav.compact_lessons": "Cours",
    "nav.compact_traffic_signs": "Panneaux",
    "nav.compact_practice": "Entraînement",
    "nav.compact_exam": "Examen",
    "nav.compact_videos": "Vidéos de conduite",
    "auth.logout": "Se déconnecter",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.lessons": "دروس رخصة السياقة",
    "nav.traffic_signs": "دراسة العلامات المرورية",
    "nav.practice": "تدريب العلامات المرورية",
    "nav.exam": "محاكي الامتحان النظري",
    "nav.faq": "الأسئلة الشائعة",
    "nav.account_menu": "قائمة الحساب",
    "nav.dashboard": "لوحة التحكم",
    "nav.profile": "الملف الشخصي",
    "nav.videos": "فيديوهات تعليم السياقة",
    "nav.blog": "المقالات",
    "nav.compact_home": "الرئيسية",
    "nav.compact_lessons": "الدروس",
    "nav.compact_traffic_signs": "العلامات",
    "nav.compact_practice": "التدريب",
    "nav.compact_exam": "الامتحان",
    "nav.compact_videos": "فيديوهات تعليم السياقة",
    "auth.logout": "تسجيل الخروج",
  },
};

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: mockIsAuthenticated ? mockUser : null,
    logout: mockLogout,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    t: (key: string) => mockLabels[mockLanguage][key] ?? key,
    language: mockLanguage,
    setLanguage: mockSetLanguage,
    isRTL: mockLanguage === "ar",
  }),
  useOptionalLanguage: () => mockLanguage,
}));

jest.mock("@/contexts/cookie-consent-context", () => ({
  useCookieConsent: () => ({
    consent: { preferences: true },
    openSettings: jest.fn(),
  }),
}));

jest.mock("@/hooks/use-localized-router", () => ({
  useLocalizedRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("@/hooks/use-route-pathname", () => ({
  useRoutePathname: () => mockPathname,
}));

jest.mock("@/hooks/use-search", () => ({
  useSearch: () => ({
    query: "",
    results: [],
    isLoading: false,
    isOpen: false,
    highlightedIndex: 0,
    handleQueryChange: jest.fn(),
    handleClear: jest.fn(),
    handleClose: jest.fn(),
    handleKeyDown: jest.fn(),
  }),
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: jest.fn(),
  }),
}));

jest.mock("@/components/layout/notification-panel", () => ({
  NotificationPanel: () => <button type="button">Notifications</button>,
}));

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: jest
    .requireActual<typeof import("react")>("react")
    .forwardRef<
      HTMLAnchorElement,
      AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
        children: ReactNode;
        prefetch?: boolean;
      }
    >(function MockLocalizedLink(
      { href, children, prefetch, onClick, ...props },
      ref,
    ) {
      void prefetch;
      const localizedHref =
        mockLanguage === "en" || href.startsWith("/admin")
          ? href
          : `/${mockLanguage}${href}`;

      return (
        <a
          ref={ref}
          href={localizedHref}
          {...props}
          onClick={(event) => {
            event.preventDefault();
            onClick?.(event);
          }}
        >
          {children}
        </a>
      );
    }),
}));

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
    configurable: true,
    value: jest.fn(() => false),
  });
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: jest.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    configurable: true,
    value: jest.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: jest.fn(),
  });
});

beforeEach(() => {
  mockLanguage = "en";
  mockIsAuthenticated = true;
  mockPathname = "/lessons";
  mockLogout.mockClear();
});

async function openAccountMenu() {
  const trigger = screen.getByRole("button", {
    name: mockLabels[mockLanguage]["nav.account_menu"],
  });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });

  return screen.findByTestId("account-menu-content");
}

describe("Navbar responsive account navigation", () => {
  test.each([
    [
      "en",
      [
        "Home",
        "Lessons",
        "Traffic Signs",
        "Practice",
        "Exam",
        "Driving Videos",
        "Blog",
      ],
    ],
    [
      "nl",
      [
        "Home",
        "Lessen",
        "Verkeersborden",
        "Oefenen",
        "Examen",
        "Rijlesvideo’s",
        "Blog",
      ],
    ],
    [
      "fr",
      [
        "Accueil",
        "Cours",
        "Panneaux",
        "Entraînement",
        "Examen",
        "Vidéos de conduite",
        "Articles",
      ],
    ],
    [
      "ar",
      [
        "الرئيسية",
        "الدروس",
        "العلامات",
        "التدريب",
        "الامتحان",
        "فيديوهات تعليم السياقة",
        "المقالات",
      ],
    ],
  ] as const)("uses the learner journey order in %s", (language, labels) => {
    mockLanguage = language;
    render(<Navbar />);

    const links = within(
      screen.getByTestId("desktop-primary-navigation"),
    ).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(labels);
  });

  test.each([
    ["en", "Dashboard", "/dashboard"],
    ["nl", "Dashboard", "/nl/dashboard"],
    ["fr", "Tableau de Bord", "/fr/dashboard"],
    ["ar", "لوحة التحكم", "/ar/dashboard"],
  ] as const)(
    "keeps dashboard only in the %s account menu for authenticated users",
    async (language, label, href) => {
      mockLanguage = language;
      render(<Navbar />);

      const primaryNavigation = screen.getByTestId(
        "desktop-primary-navigation",
      );
      expect(
        within(primaryNavigation).queryByRole("link", {
          name: label,
        }),
      ).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "nav.open_menu" }),
      );
      const mobileNavigation = await screen.findByTestId(
        "mobile-navigation-dialog",
      );
      expect(
        within(mobileNavigation).queryByRole("link", {
          name: label,
        }),
      ).not.toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() =>
        expect(
          screen.queryByTestId("mobile-navigation-dialog"),
        ).not.toBeInTheDocument(),
      );

      const accountMenu = await openAccountMenu();
      expect(
        within(accountMenu).getByRole("menuitem", {
          name: label,
        }),
      ).toHaveAttribute("href", href);
    },
  );

  test.each([
    ["en", "Dashboard"],
    ["nl", "Dashboard"],
    ["fr", "Tableau de Bord"],
    ["ar", "لوحة التحكم"],
  ] as const)(
    "keeps dashboard out of the %s guest navigation",
    async (language, label) => {
      mockLanguage = language;
      mockIsAuthenticated = false;
      render(<Navbar />);

      const primaryNavigation = screen.getByTestId(
        "desktop-primary-navigation",
      );
      expect(
        within(primaryNavigation).queryByRole("link", {
          name: label,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: mockLabels[language]["nav.account_menu"],
        }),
      ).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "nav.open_menu" }),
      );
      const mobileNavigation = await screen.findByTestId(
        "mobile-navigation-dialog",
      );
      expect(
        within(mobileNavigation).queryByRole("link", {
          name: label,
        }),
      ).not.toBeInTheDocument();
      expect(
        within(mobileNavigation).getByRole("link", { name: "auth.login" }),
      ).toBeInTheDocument();
      expect(
        within(mobileNavigation).getByRole("link", { name: "auth.register" }),
      ).toBeInTheDocument();
    },
  );

  test("keeps the full desktop navigation and opens search from an icon", async () => {
    render(<Navbar />);

    const primaryNavigation = screen.getByTestId(
      "desktop-primary-navigation",
    );
    for (const link of within(primaryNavigation).getAllByRole("link")) {
      expect(link).toHaveClass("whitespace-nowrap");
      expect(link).toHaveClass("shrink-0");
    }

    expect(
      within(primaryNavigation).queryByRole("link", { name: "FAQ" }),
    ).not.toBeInTheDocument();
    const searchTrigger = screen.getByRole("button", { name: "nav.search" });
    expect(searchTrigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("textbox", { name: "nav.search" })).not.toBeInTheDocument();
    fireEvent.click(searchTrigger);
    expect(searchTrigger).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByRole("textbox", { name: "nav.search" })).toHaveFocus();
    expect(screen.getByTestId("site-navbar").firstElementChild).toHaveClass(
      "h-[58px]",
    );
    expect(primaryNavigation).toHaveClass("xl:flex");
    expect(
      screen.getByRole("button", { name: "nav.open_menu" }).parentElement,
    ).toHaveClass("xl:hidden");

    fireEvent.keyDown(screen.getByRole("textbox", { name: "nav.search" }), {
      key: "Escape",
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: "nav.search" }),
      ).not.toBeInTheDocument(),
    );
  });

  test.each([
    ["en", "Driving Videos", "/videos"],
    ["nl", "Rijlesvideo’s", "/nl/videos"],
    ["fr", "Vidéos de conduite", "/fr/videos"],
    ["ar", "فيديوهات تعليم السياقة", "/ar/videos"],
  ] as const)(
    "replaces about with one videos link in the %s desktop and mobile navigation",
    async (language, label, href) => {
      mockLanguage = language;
      mockPathname = "/videos";
      render(<Navbar />);

      const desktopLink = within(
        screen.getByTestId("desktop-primary-navigation"),
      ).getByRole("link", { name: label });
      expect(desktopLink).toHaveAttribute("href", href);
      expect(desktopLink).toHaveClass("bg-primary");

      fireEvent.click(screen.getByRole("button", { name: "nav.open_menu" }));
      const mobileNavigation = within(
        await screen.findByTestId("mobile-navigation-dialog"),
      );
      expect(mobileNavigation.getAllByRole("link", { name: label })).toHaveLength(
        1,
      );
      expect(mobileNavigation.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    },
  );

  test.each([
    ["en", "Blog", "/blog"],
    ["nl", "Blog", "/nl/blog"],
    ["fr", "Articles", "/fr/blog"],
    ["ar", "المقالات", "/ar/blog"],
  ] as const)("links to the %s blog in both menus and stays active on articles", async (language, label, href) => {
    mockLanguage = language;
    mockPathname = "/blog/published-article";
    render(<Navbar />);
    const desktopLink = within(screen.getByTestId("desktop-primary-navigation"))
      .getByRole("link", { name: label });
    expect(desktopLink).toHaveAttribute("href", href);
    expect(desktopLink).toHaveClass("bg-primary");
    fireEvent.click(screen.getByRole("button", { name: "nav.open_menu" }));
    const menu = within(await screen.findByTestId("mobile-navigation-dialog"));
    expect(menu.getAllByRole("link", { name: label })).toHaveLength(1);
    expect(menu.getByRole("link", { name: label })).toHaveAttribute("href", href);
  });

  test("keeps one notification trigger available outside the mobile menu", () => {
    render(<Navbar />);

    const mobileNotifications = screen.getByTestId("mobile-notifications");
    expect(mobileNotifications).toHaveClass("lg:hidden");
    expect(
      within(mobileNotifications).getByRole("button", {
        name: "Notifications",
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("navbar-actions")).getAllByRole("button", {
        name: "Notifications",
      }),
    ).toHaveLength(2);
    expect(
      screen.queryByTestId("mobile-navigation-dialog"),
    ).not.toBeInTheDocument();
  });

  test.each([
    ["en", "Dashboard", "/dashboard"],
    ["nl", "Dashboard", "/nl/dashboard"],
    ["fr", "Tableau de Bord", "/fr/dashboard"],
    ["ar", "لوحة التحكم", "/ar/dashboard"],
  ] as const)(
    "places the dashboard first in the %s account menu",
    async (language, label, href) => {
      mockLanguage = language;
      render(<Navbar />);

      const menu = await openAccountMenu();
      const items = within(menu).getAllByRole("menuitem");
      expect(items[0]).toHaveTextContent(label);
      expect(items[0]).toHaveAttribute("href", href);
      expect(items[0]).toHaveClass("min-h-12", "whitespace-nowrap");

      const email = within(menu).getByText(mockUser.email);
      expect(email).toHaveAttribute("title", mockUser.email);
      expect(email).toHaveAttribute("dir", "ltr");
      expect(email).toHaveClass("truncate");
    },
  );

  test("closes the account menu with Escape and keeps logout last", async () => {
    render(<Navbar />);

    let menu = await openAccountMenu();
    const items = within(menu).getAllByRole("menuitem");
    expect(items.at(-1)).toHaveTextContent("Log out");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByTestId("account-menu-content")).not.toBeInTheDocument(),
    );

    menu = await openAccountMenu();
    fireEvent.pointerDown(document.body);
    await waitFor(() =>
      expect(screen.queryByTestId("account-menu-content")).not.toBeInTheDocument(),
    );

    menu = await openAccountMenu();
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Log out" }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
