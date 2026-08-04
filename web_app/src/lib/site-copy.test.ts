import { getHomeMetadataCopy } from "@/lib/site-copy";

describe("home metadata titles", () => {
  it.each([
    ["en", "ReadyRoad | Belgian Driving Theory Test Practice"],
    ["ar", "ReadyRoad | امتحان السياقة النظري في بلجيكا"],
    ["nl", "ReadyRoad | Theorie-examen rijbewijs B oefenen België"],
    ["fr", "ReadyRoad | Examen théorique permis B Belgique"],
  ] as const)("uses one pipe-separated ReadyRoad title for %s", (locale, title) => {
    const copy = getHomeMetadataCopy(locale);

    expect(copy.title).toBe(title);
    expect(copy.openGraphTitle).toBe(title);
    expect(copy.title).not.toContain("ReadyRoad:");
    expect(copy.title.match(/ReadyRoad/g)).toHaveLength(1);
  });
});
