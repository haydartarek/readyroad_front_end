import { getTrafficSignName } from "./traffic-sign-presentation";

describe("public traffic sign names", () => {
  const sign = {
    signCode: "A53", routeCode: "A53", categoryCode: "A", imageUrl: "/images/signs/A53.png",
    descriptionAr: "", descriptionNl: "", descriptionEn: "", descriptionFr: "",
    nameAr: "A53 - أعمدة قابلة للسحب", nameNl: "A53 - Verzinkbare paaltjes",
    nameEn: "A53 - Retractable bollards", nameFr: "A53 - Bornes escamotables",
  };

  it.each([
    ["ar", "أعمدة قابلة للسحب"], ["nl", "Verzinkbare paaltjes"],
    ["en", "Retractable bollards"], ["fr", "Bornes escamotables"],
  ] as const)("removes only the matching code in %s", (locale, expected) => {
    expect(getTrafficSignName(sign, locale)).toBe(expected);
    expect(sign.signCode).toBe("A53");
  });

  it.each(["-", "\u2013", "\u2014", ":"])("accepts a %s separator", (separator) => {
    expect(getTrafficSignName({ ...sign, nameEn: ` A53 ${separator} Bollards` }, "en")).toBe("Bollards");
  });

  it.each(["A530 - Different code", "Bollards near A53", "Traffic-calming bollards"])("preserves meaningful text: %s", (nameEn) => {
    expect(getTrafficSignName({ ...sign, nameEn }, "en")).toBe(nameEn);
  });
});
