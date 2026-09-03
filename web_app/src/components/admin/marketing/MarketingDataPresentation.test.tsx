import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  StructuredData,
  machineLabel,
  marketingDisplayText,
  MarketingList,
  marketingErrorText,
  marketingImportError,
  HumanStatusBadge,
  StructuredRecordCard,
} from "@/components/admin/marketing/MarketingDataPresentation";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import nl from "@/messages/nl.json";
import fr from "@/messages/fr.json";

const t = (key: string) => key;

describe("MarketingDataPresentation", () => {
  it.each([en, ar, nl, fr])("localizes observed settings, schedules and opportunity states", (messages) => {
    const translate = (key: string) => {
      const value = messages[key as keyof typeof messages];
      return typeof value === "string" ? value : key;
    };
    for (const value of ["P0", "P1", "P2", "P3", "MIGRATION_RISK", "CTR_REPAIR", "google.ga4", "opportunity.thresholds", "sync.policy", "analytics.fullSync", "youtube.channelMonitor", "YOUTUBE_CHANNEL_SYNC"]) {
      expect(machineLabel(translate, value)).toBe(translate(`admin.marketing.value_${value.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replaceAll(".", "_").toLowerCase()}`));
      expect(machineLabel(translate, value)).not.toContain("admin.marketing.");
    }
  });

  it("keeps page identity without the retired domain and never renders an empty heading", () => {
    expect(marketingDisplayText("https://readyroad.be/fr/lessons/priority"))
      .toBe("/fr/lessons/priority");
    render(<StructuredRecordCard data={{ query: "", clicks: 1 }} titleField="query" fallbackTitle="Search opportunity" t={t} />);
    expect(screen.getByRole("heading", { name: "Search opportunity" })).toBeVisible();
    render(<StructuredRecordCard data={{ page: "https://readyroad.be/fr/lessons" }} titleField="page" fallbackTitle="Search opportunity" t={t} />);
    expect(screen.getByRole("heading", { name: "/fr/lessons" })).toHaveAttribute("dir", "ltr");
  });
  it("keeps every record reachable through bounded pages", () => {
    render(<MarketingList t={t} pageSize={2}>{[1, 2, 3].map((id) => <p key={id}>Record {id}</p>)}</MarketingList>);
    expect(screen.getByText("Record 1")).toBeVisible();
    expect(screen.queryByText("Record 3")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "admin.marketing.next_page" }));
    expect(screen.getByText("Record 3")).toBeVisible();
    expect(screen.queryByText("Record 1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "admin.marketing.previous_page" }));
    expect(screen.getByText("Record 1")).toBeVisible();
  });

  it("opens nested evidence as readable details without rendering raw JSON or internal fields", async () => {
    const { container } = render(<StructuredData data={{ metrics: { clicks: 12 }, payload: { secret: "not-for-ui" }, empty: null }} t={t} />);
    expect(screen.queryByText("12")).not.toBeInTheDocument();
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    await waitFor(() => expect(screen.getByText("12")).toBeVisible());
    expect(container.querySelector("pre")).toBeNull();
    expect(container).not.toHaveTextContent("not-for-ui");
    expect(container).not.toHaveTextContent("Empty");
  });

  it("distinguishes exhausted credit from a temporary provider limit", () => {
    expect(marketingErrorText(t, "OPENAI_QUOTA_EXHAUSTED")).toBe("admin.marketing.error_openai_quota");
    expect(marketingErrorText(t, "HTTP_429")).toBe("admin.marketing.error_rate_limit");
    const { container } = render(<HumanStatusBadge status="HTTP_429" t={(key) => key.endsWith("value_http_429") ? "Request limit" : key} />);
    expect(screen.getByText("Request limit")).toBeVisible();
    expect(container).not.toHaveTextContent("HTTP_429");
    expect(container.querySelector("code")).toBeNull();
  });

  it.each([
    [400, "The workbook must contain non-empty query and page sheets", "seo_import_wrong_report"],
    [400, "Formula cells are not allowed", "seo_import_unsafe"],
    [400, "The workbook exceeds the configured upload limit", "seo_import_too_large"],
    [403, "", "seo_import_forbidden"],
    [413, "", "seo_import_too_large"],
    [500, "internal-sensitive-details", "seo_import_failed"],
  ])("explains import error %s safely", (status, message, key) => {
    expect(marketingImportError(t, { response: { status, data: { message } } })).toBe(`admin.marketing.${key}`);
  });

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
        t={(key) => key === "admin.marketing.value_legacy_search_console_property" ? "Previous Search Console property" : key}
      />,
    );

    expect(screen.getByText("RijVia Core Data")).toBeInTheDocument();
    expect(screen.getByText("Legacy source domain")).toBeInTheDocument();
    expect(screen.getByText("Previous Search Console property")).toBeInTheDocument();
    expect(screen.getByText("RijVia strategy source")).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/ReadyRoad/i);
  });
});
