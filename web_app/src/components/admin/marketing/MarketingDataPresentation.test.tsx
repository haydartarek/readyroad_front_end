import { render, screen } from "@testing-library/react";
import {
  StructuredData,
  machineLabel,
  marketingDisplayText,
} from "@/components/admin/marketing/MarketingDataPresentation";

const t = (key: string) => key;

describe("MarketingDataPresentation", () => {
  it("presents the current RijVia identity without exposing legacy brand identifiers", () => {
    expect(machineLabel(t, "READYROAD_CORE_DATA")).toBe("RijVia Core Data");
    expect(marketingDisplayText("readyroad.be-Performance-on-Search.xlsx"))
      .toBe("RijVia.be-Performance-on-Search.xlsx");
    expect(marketingDisplayText('["OLD_BRAND_READYROAD","READYROAD_CORE_DATA"]'))
      .toBe('["LEGACY_SOURCE_DOMAIN","RIJVIA_CORE_DATA"]');

    const { container } = render(
      <StructuredData
        data={{
          sourceType: "READYROAD_CORE_DATA",
          brand: "OLD_BRAND_READYROAD",
          property: "sc-domain:readyroad.be",
          description: "ReadyRoad strategy source",
        }}
        t={t}
      />,
    );

    expect(screen.getByText("RijVia Core Data")).toBeInTheDocument();
    expect(screen.getByText("Legacy source domain")).toBeInTheDocument();
    expect(screen.getByText("Legacy Search Console property")).toBeInTheDocument();
    expect(screen.getByText("RijVia strategy source")).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/ReadyRoad/i);
  });
});
