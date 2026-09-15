import { render } from "@testing-library/react";
import LessonStructuredData from "./lesson-structured-data";
import SignLayout from "@/app/traffic-signs/[signCode]/layout";
import { getRequestLocale } from "@/lib/server/request-locale";
import { getPublicTrafficSign } from "@/lib/server/public-catalog";
import type { LessonDetail, TrafficSign } from "@/lib/types";

jest.mock("@/lib/server/request-locale", () => ({ getRequestLocale: jest.fn() }));
jest.mock("@/lib/server/public-catalog", () => ({ getPublicTrafficSign: jest.fn() }));

const lesson = {
  lessonCode: "les-5", titleNl: "Rijbaan en rijstroken", estimatedMinutes: 10,
  pages: [
    { pageNumber: 2, titleNl: "Rijstroken" },
    { pageNumber: 1, titleNl: "Rijbaan" },
  ],
} as LessonDetail;

beforeEach(() => {
  jest.mocked(getRequestLocale).mockResolvedValue("nl");
});

it("describes visible lesson sections at the consolidated canonical URL in display order", async () => {
  const { container } = render(<>{await LessonStructuredData({ lesson })}</>);
  const schemas = Array.from(container.querySelectorAll('script[type="application/ld+json"]'))
    .map((script) => JSON.parse(script.textContent!));
  const resource = schemas.find((schema) => schema["@type"] === "LearningResource");
  expect(resource["@id"]).toBe("https://rijvia.be/nl/lessons/les-5#lesson");
  expect(resource.mainEntityOfPage).toBe("https://rijvia.be/nl/lessons/les-5");
  expect(resource.hasPart.map((part: { url: string; name: string }) => [part.url, part.name])).toEqual([
    ["https://rijvia.be/nl/lessons/les-5#section-1", "Rijbaan"],
    ["https://rijvia.be/nl/lessons/les-5#section-2", "Rijstroken"],
  ]);
  expect(resource.timeRequired).toBe("PT10M");
  expect(lesson.pages.map((page) => page.pageNumber)).toEqual([2, 1]);
});

it("does not invent a lesson duration when none is available", async () => {
  const { container } = render(<>{await LessonStructuredData({
    lesson: { ...lesson, estimatedMinutes: 0 },
  })}</>);
  const resource = JSON.parse(container.querySelectorAll("script")[1].textContent!);
  expect(resource.timeRequired).toBeUndefined();
});

it("identifies the sign learning resource using the catalog route and sign code", async () => {
  jest.mocked(getPublicTrafficSign).mockResolvedValue({
    signCode: "B1", routeCode: "B1", nameNl: "Voorrang verlenen",
    descriptionNl: "Verleen voorrang.", imageUrl: "/images/signs/B1.png",
  } as TrafficSign);
  const { container } = render(await SignLayout({
    params: Promise.resolve({ signCode: "B1" }), children: <p>Sign content</p>,
  }));
  const resource = JSON.parse(container.querySelectorAll("script")[1].textContent!);
  expect(resource["@id"]).toBe("https://rijvia.be/nl/traffic-signs/B1#learning-resource");
  expect(resource.mainEntityOfPage).toBe("https://rijvia.be/nl/traffic-signs/B1");
  expect(resource.about).toEqual({
    "@type": "DefinedTerm", name: "Voorrang verlenen", termCode: "B1",
  });
});
