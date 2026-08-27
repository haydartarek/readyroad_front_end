import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  LanguageProvider,
  useLanguage,
} from "@/contexts/language-context";
import type { Language } from "@/lib/types";

const mockFetch = jest.fn();

function LanguageHarness() {
  const { language, setLanguage, applyAccountLanguage } = useLanguage();

  return (
    <div>
      <output data-testid="language">{language}</output>
      <button onClick={() => setLanguage("ar")}>choose-ar</button>
      <button onClick={() => applyAccountLanguage("nl", false)}>
        restore-nl
      </button>
    </div>
  );
}

function renderProvider(initialLanguage: Language = "en") {
  return render(
    <LanguageProvider initialLanguage={initialLanguage}>
      <LanguageHarness />
    </LanguageProvider>,
  );
}

describe("account-backed language preference", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true });
    global.fetch = mockFetch;
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/dashboard");
    document.cookie = "csrf_token=test-csrf; path=/";
    document.cookie = "rijvia_locale=; path=/; max-age=0";
  });

  test("persists an explicit signed-in choice through the protected BFF", async () => {
    window.history.replaceState({}, "", "/ar/dashboard");
    renderProvider("ar");

    fireEvent.click(screen.getByText("choose-ar"));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/proxy/users/me/preferred-language",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ preferredLanguage: "ar" }),
          keepalive: true,
        }),
      ),
    );

    expect(window.localStorage.getItem("rijvia_locale")).toBe("ar");
    expect(
      window.sessionStorage.getItem("rijvia_explicit_session_language"),
    ).toBe("ar");
  });

  test("restores the account language when URL and session have no explicit locale", async () => {
    renderProvider();

    act(() => {
      fireEvent.click(screen.getByText("restore-nl"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("language")).toHaveTextContent("nl"),
    );
    expect(window.localStorage.getItem("rijvia_locale")).toBe("nl");
  });

  test("an explicit URL locale remains authoritative", () => {
    window.history.replaceState({}, "", "/ar/dashboard");
    renderProvider("ar");

    fireEvent.click(screen.getByText("restore-nl"));

    expect(screen.getByTestId("language")).toHaveTextContent("ar");
    expect(window.localStorage.getItem("rijvia_locale")).toBe("ar");
  });

  test("an explicit session choice outranks the stored account language", () => {
    window.localStorage.setItem("rijvia_locale", "fr");
    window.sessionStorage.setItem(
      "rijvia_explicit_session_language",
      "fr",
    );
    renderProvider("fr");

    fireEvent.click(screen.getByText("restore-nl"));

    expect(screen.getByTestId("language")).toHaveTextContent("fr");
  });
});
