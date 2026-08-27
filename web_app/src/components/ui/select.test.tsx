import { render, screen } from "@testing-library/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

describe("Select viewport and direction contract", () => {
  it("keeps a long RTL dropdown inside the viewport with logical spacing", () => {
    render(
      <Select defaultOpen dir="rtl" defaultValue="long-option">
        <SelectTrigger aria-label="اختيار الاستراتيجية">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="long-option">
            خيار استراتيجي طويل قابل للالتفاف داخل حدود الشاشة
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = document.querySelector<HTMLElement>(
      '[data-slot="select-trigger"]',
    );
    const content = document.querySelector<HTMLElement>(
      '[data-slot="select-content"]',
    );
    const viewport = content?.querySelector<HTMLElement>(
      '[data-radix-select-viewport]',
    );
    const option = screen.getByRole("option", {
      name: "خيار استراتيجي طويل قابل للالتفاف داخل حدود الشاشة",
    });

    expect(trigger).toHaveAttribute("aria-label", "اختيار الاستراتيجية");
    expect(trigger).toHaveClass("w-full");
    expect(trigger).toHaveClass("min-h-11");
    expect(
      trigger?.querySelector('[data-slot="select-trigger-value"]'),
    ).toHaveClass(
      "min-w-0",
      "break-words",
      "whitespace-normal",
    );
    expect(content).toHaveClass("max-w-[calc(100vw-2rem)]");
    expect(content).toHaveClass("w-[var(--radix-select-trigger-width)]");
    expect(content).toHaveAttribute("dir", "rtl");
    expect(viewport).toHaveClass("overflow-y-auto", "overscroll-contain");
    expect(option).toHaveClass("ps-9", "pe-3.5", "text-start");
  });
});
