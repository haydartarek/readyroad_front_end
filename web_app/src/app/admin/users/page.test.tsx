import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminUsersPage from "./page";
import apiClient from "@/lib/api";

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en" }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { username: "admin" } }),
}));

jest.mock("@/components/admin/AdminPageHeader", () => ({
  __esModule: true,
  default: ({ title, actions }: { title: string; actions: React.ReactNode }) => (
    <header><h1>{title}</h1>{actions}</header>
  ),
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
  isServiceUnavailable: () => false,
  logApiError: jest.fn(),
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;

describe("Admin user creation", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedGet.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.endsWith("/summary")
          ? { total: 0, active: 0, locked: 0, inactive: 0, newThisWeek: 0, newSince: "" }
          : { users: [], total: 0, page: 0, size: 20, totalPages: 0 },
      }),
    );
    mockedPost.mockResolvedValue({ data: { id: 1 } });
  });

  it("submits every required account and permission field", async () => {
    render(<AdminUsersPage />);
    await screen.findByRole("heading", { name: "admin.users.title" });

    fireEvent.click(screen.getByRole("button", { name: "admin.users.create" }));
    fireEvent.change(screen.getByLabelText("admin.users.first_name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("admin.users.last_name"), { target: { value: "Lovelace" } });
    fireEvent.change(screen.getByLabelText("admin.users.email"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText("admin.users.username"), { target: { value: "ada_admin" } });
    fireEvent.change(screen.getByLabelText("admin.users.password"), { target: { value: "Strong#Pass1" } });
    fireEvent.change(screen.getByLabelText("admin.users.col_role"), { target: { value: "MODERATOR" } });
    fireEvent.click(screen.getByText("admin.users.email_verified"));
    fireEvent.click(screen.getAllByRole("button", { name: "admin.users.create" }).at(-1)!);

    await waitFor(() => expect(mockedPost).toHaveBeenCalledTimes(1));
    expect(mockedPost).toHaveBeenCalledWith(
      "/admin/users",
      expect.objectContaining({
        firstName: "Ada",
        lastName: "Lovelace",
        role: "MODERATOR",
        emailVerified: true,
        isActive: true,
      }),
    );
  });
});
