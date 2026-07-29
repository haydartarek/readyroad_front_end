import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";

type Language = "en" | "nl" | "fr" | "ar";

const mockLogout = jest.fn();
const mockSetLanguage = jest.fn();
const mockRouterPush = jest.fn();
let mockLanguage: Language = "en";
let mockIsAuthenticated = true;

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
    "nav.account_menu": "Account menu",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profile",
    "auth.logout": "Log out",
  },
  nl: {
    "nav.account_menu": "Accountmenu",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profiel",
    "auth.logout": "Uitloggen",
  },
  fr: {
    "nav.account_menu": "Menu du compte",
    "nav.dashboard": "Tableau de Bord",
    "nav.profile": "Profil",
    "auth.logout": "Se déconnecter",
  },
  ar: {
    "nav.account_menu": "قائمة الحساب",
    "nav.dashboard": "لوحة التحكم",
    "nav.profile": "الملف الشخصي",
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
  useRoutePathname: () => "/lessons",
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
  test("keeps primary navigation labels on one line and reduces search width", () => {
    render(<Navbar />);

    const primaryNavigation = screen.getByTestId(
      "desktop-primary-navigation",
    );
    for (const link of within(primaryNavigation).getAllByRole("link")) {
      expect(link).toHaveClass("whitespace-nowrap");
      expect(link).toHaveClass("shrink-0");
    }

    const search = screen.getByRole("textbox", { name: "nav.search" });
    expect(search).toHaveClass("w-32");
    expect(search).toHaveClass("2xl:w-36");
    expect(search).not.toHaveClass("w-40");
    expect(search).not.toHaveClass("2xl:w-48");
    expect(screen.getByTestId("site-navbar").firstElementChild).toHaveClass(
      "h-[74px]",
    );
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
