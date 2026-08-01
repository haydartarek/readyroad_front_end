import { fireEvent, render, screen } from "@testing-library/react";
import AdminSidebar from "./AdminSidebar";

const logout = jest.fn();

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    logout,
    user: {
      fullName: "A Very Long Administrator Name",
      email: "administrator.with.a.long.address@example.com",
      role: "ADMIN",
    },
  }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, isRTL: false }),
}));

jest.mock("@/hooks/use-route-pathname", () => ({
  useRoutePathname: () => "/admin/dashboard",
}));

describe("AdminSidebar", () => {
  beforeEach(() => logout.mockClear());

  it("renders as a mobile drawer without truncating administrator identity", () => {
    render(<AdminSidebar variant="drawer" />);

    const aside = screen.getByRole("complementary");
    expect(aside).toHaveClass("flex", "max-w-[calc(100vw-2rem)]");
    expect(aside).not.toHaveClass("hidden");
    expect(screen.getByText("A Very Long Administrator Name")).toHaveClass("break-words");
    expect(screen.getByText("administrator.with.a.long.address@example.com")).toHaveClass("break-all");
  });

  it("closes the drawer for navigation and logout actions", () => {
    const onNavigate = jest.fn();
    render(<AdminSidebar variant="drawer" onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText("admin.sidebar.dashboard"));
    expect(onNavigate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("auth.logout"));
    expect(onNavigate).toHaveBeenCalledTimes(2);
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
