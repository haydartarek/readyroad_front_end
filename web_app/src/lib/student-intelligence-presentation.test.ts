import {
  durationValue,
  intelligenceMetricValue,
  localizedPriorityName,
  signedMetricValue,
} from "./student-intelligence-presentation";

const priority = {
  categoryId: 1,
  categoryCode: "PRIORITY",
  categoryNameEn: "Priority",
  categoryNameNl: "Voorrang",
  categoryNameFr: "Priorité",
  categoryNameAr: "الأولوية",
  accuracy: 62,
  questionsAttempted: 20,
  priorityScore: 74,
  confidenceScore: 100,
  trend: "DECLINING" as const,
  trendChange: -12,
  daysSincePractice: 2,
};

describe("student intelligence presentation", () => {
  it("uses the active language without leaking English", () => {
    expect(localizedPriorityName(priority, "ar")).toBe("الأولوية");
    expect(localizedPriorityName(priority, "nl")).toBe("Voorrang");
    expect(localizedPriorityName(priority, "fr")).toBe("Priorité");
    expect(localizedPriorityName(priority, "en")).toBe("Priority");
  });

  it("shows unavailable state instead of a fake zero", () => {
    expect(intelligenceMetricValue(null, "غير متوفر")).toBe("غير متوفر");
    expect(intelligenceMetricValue(0, "غير متوفر")).toBe("0%");
    expect(intelligenceMetricValue(82.4, "Not available")).toBe("82%");
    expect(durationValue(null, "Not available")).toBe("Not available");
    expect(durationValue(125, "Not available")).toBe("2m 05s");
    expect(signedMetricValue(null, "%", "Not available")).toBe("Not available");
    expect(signedMetricValue(-4.6, "%", "Not available")).toBe("-5%");
    expect(signedMetricValue(3.2, "s", "Not available")).toBe("+3s");
  });
});
