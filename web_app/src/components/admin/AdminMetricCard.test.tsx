import { render, screen } from "@testing-library/react";
import AdminMetricCard from "./AdminMetricCard";

describe("AdminMetricCard", () => {
  it("shows an em dash instead of a misleading zero when the value is unavailable", () => {
    render(<AdminMetricCard icon={<span>icon</span>} label="Users" />);

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("keeps the metric content hidden while its loading skeleton is visible", () => {
    const { container } = render(
      <AdminMetricCard icon={<span>icon</span>} label="Users" value="42" loading />,
    );

    expect(screen.queryByText("42")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
