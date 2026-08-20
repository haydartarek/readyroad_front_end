import { fireEvent, render, screen } from "@testing-library/react";
import { LocalizedErrorScreen } from "@/components/ui/localized-error-screen";

describe("RijVia error identity", () => {
  beforeEach(() => {
    document.cookie = "readyroad_locale=en; path=/";
  });

  it("keeps the brand visible and exposes working recovery actions", () => {
    const reset = jest.fn();
    const { container } = render(
      <LocalizedErrorScreen reset={reset} fullscreen />,
    );

    expect(container).toHaveTextContent("RijVia");
    expect(
      container.querySelector('img[src*="logo.png"][aria-hidden="true"]'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
