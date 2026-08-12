import { fireEvent, render, screen } from "@testing-library/react";
import AdminSidebar from "./AdminSidebar";

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, isRTL: false }),
}));

jest.mock("@/hooks/use-route-pathname", () => ({
  useRoutePathname: () => "/admin/dashboard",
}));

describe("AdminSidebar", () => {
  it("renders the navigation without the removed introduction and account blocks", () => {
    render(<AdminSidebar variant="drawer" />);

    const aside = screen.getByRole("complementary");
    expect(aside).toHaveClass("flex", "max-w-[calc(100vw-2rem)]");
    expect(aside).not.toHaveClass("hidden");
    expect(screen.queryByText("admin.sidebar.panel_title")).not.toBeInTheDocument();
    expect(screen.queryByText("admin.sidebar.back_to_site")).not.toBeInTheDocument();
    expect(screen.queryByText("auth.logout")).not.toBeInTheDocument();
    expect(screen.getByText("admin.sidebar.marketing")).toBeInTheDocument();
  });

  it("closes the drawer for a navigation action", () => {
    const onNavigate = jest.fn();
    render(<AdminSidebar variant="drawer" onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText("admin.sidebar.dashboard"));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
