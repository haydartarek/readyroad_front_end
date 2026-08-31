import {
  editorialClaimTypeLabel,
  editorialEvidenceSourceTypeLabel,
  editorialLegalReviewStatusLabel,
  editorialStrategyOptionLabel,
  editorialTaskStatusLabel,
  editorialTopicSourceLabel,
} from "@/lib/editorial-ui-labels";

const languages = ["ar", "nl", "fr", "en"] as const;

describe("editorial UI labels", () => {
  it.each(languages)("localizes workflow values for %s", (language) => {
    expect(editorialTaskStatusLabel("FAILED", language)).not.toBe("FAILED");
    expect(editorialTaskStatusLabel("APPROVED", language)).not.toBe("APPROVED");
    expect(editorialTopicSourceLabel("OFFICIAL_STRATEGIC_BACKLOG", language))
      .not.toContain("OFFICIAL_STRATEGIC_BACKLOG");
    expect(editorialClaimTypeLabel("FACTUAL", language)).not.toBe("FACTUAL");
    expect(editorialEvidenceSourceTypeLabel("RIJVIA_CORE_DATA", language))
      .not.toBe("RIJVIA_CORE_DATA");
    expect(editorialLegalReviewStatusLabel("REQUIRES_REVIEW", language))
      .not.toBe("REQUIRES_REVIEW");
  });

  it.each(languages)("localizes every active strategy option for %s", (language) => {
    const options = [
      ["USP", "1", "Four-language support"],
      ["USP", "10", "RijVia learning platform"],
      ["ICP", "ICP-AR-BEGINNER", "Arabic-speaking learner"],
      ["ICP", "ICP-SIGN-SEARCH", "Search learner"],
      ["CONTENT_PILLAR", "THEORY_EXAM", "Theory exam"],
      ["CONTENT_PILLAR", "RIJVIA_EDUCATIONAL_VIDEOS", "RijVia videos"],
      ["FUNNEL_STAGE", "AWARENESS", "Awareness"],
      ["FUNNEL_STAGE", "ADVOCACY", "Advocacy"],
      ["CONVERSION_GOAL", "DISCOVER_RIJVIA", "Discover RijVia"],
      ["CONVERSION_GOAL", "RECOMMEND_RIJVIA", "Recommend RijVia"],
    ] as const;

    options.forEach(([kind, key, fallback]) => {
      const label = editorialStrategyOptionLabel(kind, key, fallback, language);
      expect(label).not.toBe(key);
      expect(label.trim()).not.toBe("");
    });
  });
});
