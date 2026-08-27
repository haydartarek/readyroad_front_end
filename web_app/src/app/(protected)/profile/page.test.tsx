import { render, screen } from "@testing-library/react";
import { ProfilePageContent } from "./page";

let mockUser: Record<string, unknown>;

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/hooks/use-localized-router", () => ({
  useLocalizedRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ user: mockUser, fetchUser: jest.fn() }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "en",
    setLanguage: jest.fn(),
  }),
}));

jest.mock("@/services", () => ({
  getOverallProgress: () => new Promise(() => undefined),
  updateProfile: jest.fn(),
}));

jest.mock("@/components/auth/google-auth-button", () => ({
  GoogleAuthButton: ({ label }: { label: string }) => <button>{label}</button>,
}));

jest.mock("@/components/ui/delete-account-modal", () => ({
  DeleteAccountModal: () => null,
}));

const baseUser = {
  userId: 1,
  username: "owner",
  email: "owner@rijvia.be",
  fullName: "Ready Road",
  isActive: true,
  emailVerified: true,
  createdAt: "2026-01-01T00:00:00Z",
  googleLinked: false,
};

describe("role-aware profile", () => {
  it("shows administrator permissions and removes self-deletion and Google linking", async () => {
    mockUser = { ...baseUser, role: "ADMIN" };

    render(<ProfilePageContent embedded />);

    expect(screen.getByText("profile.admin_profile_title")).toBeInTheDocument();
    expect(screen.getByText("profile.permission_users")).toBeInTheDocument();
    expect(screen.getByText("profile.admin_security_help")).toBeInTheDocument();
    expect(screen.queryByText("profile.delete_account")).not.toBeInTheDocument();
    expect(screen.queryByText("profile.connect_google")).not.toBeInTheDocument();
  });

  it("keeps deletion and Google linking available for regular users", () => {
    mockUser = { ...baseUser, role: "USER" };

    render(<ProfilePageContent embedded />);

    expect(screen.getByText("profile.delete_account")).toBeInTheDocument();
    expect(screen.getByText("profile.connect_google")).toBeInTheDocument();
    expect(screen.queryByText("profile.permissions_summary")).not.toBeInTheDocument();
  });
});
