import { renderToStaticMarkup } from "react-dom/server";
import SignExamLayout, {
  generateMetadata,
} from "@/app/traffic-signs/[signCode]/exam/[examNumber]/layout";
import { getPublicTrafficSign } from "@/lib/server/public-catalog";
import { getRequestLocale } from "@/lib/server/request-locale";
import { DEFAULT_APP_URL } from "@/lib/site-copy";
import type { TrafficSign } from "@/lib/types";

jest.mock("@/lib/server/public-catalog", () => ({
  getPublicTrafficSign: jest.fn(),
}));
jest.mock("@/lib/server/request-locale", () => ({
  getRequestLocale: jest.fn(),
}));

const mockedGetPublicTrafficSign = jest.mocked(getPublicTrafficSign);
const mockedGetRequestLocale = jest.mocked(getRequestLocale);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

const sign = {
  signCode: "F45L",
  routeCode: "F45L",
  categoryCode: "F",
  exam1TotalQuestions: 8,
  exam1PassingScore: 6,
  nameEn: "End of prohibition of overtaking",
  nameNl: "Einde van het inhaalverbod",
  nameFr: "Fin de l'interdiction de dépasser",
  nameAr: "نهاية منع التجاوز",
  summaryEn: "The prohibition on overtaking ends.",
  summaryNl: "Het inhaalverbod eindigt.",
  summaryFr: "L'interdiction de dépasser prend fin.",
  summaryAr: "تنتهي إشارة منع التجاوز.",
  descriptionEn: "This sign marks the end of the prohibition on overtaking.",
  descriptionNl: "Dit bord geeft het einde van het inhaalverbod aan.",
  descriptionFr: "Ce panneau indique la fin de l'interdiction de dépasser.",
  descriptionAr: "تشير هذه العلامة إلى نهاية منع التجاوز.",
  driverGuidanceEn: "Drivers may overtake when it is safe and otherwise permitted.",
  driverGuidanceNl: "Bestuurders mogen inhalen wanneer dit veilig en toegestaan is.",
  driverGuidanceFr: "Le dépassement est permis lorsque la manœuvre est sûre et autorisée.",
  driverGuidanceAr: "يمكن التجاوز عندما تكون المناورة آمنة ومسموحًا بها.",
  exceptionsEn: [],
  exceptionsNl: [],
  exceptionsFr: [],
  exceptionsAr: [],
  imageUrl: "/images/signs/F45L.png",
} as TrafficSign;

describe("traffic sign exam metadata and server content", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPublicTrafficSign.mockResolvedValue(sign);
    mockedGetRequestLocale.mockResolvedValue("en");
  });

  it("uses a self-referencing canonical and localized metadata for an active sign exam", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ signCode: "F45L", examNumber: "1" }),
    });

    expect(metadata.title).toEqual({
      absolute:
        "Belgian Traffic Sign Exam: End of prohibition of overtaking | Rijvia",
    });
    expect(metadata.alternates?.canonical).toBe(
      appUrl + "/traffic-signs/F45L/exam/1",
    );
    expect(metadata.alternates?.languages).toEqual({
      en: appUrl + "/traffic-signs/F45L/exam/1",
      "nl-BE": appUrl + "/nl/traffic-signs/F45L/exam/1",
      "fr-BE": appUrl + "/fr/traffic-signs/F45L/exam/1",
      ar: appUrl + "/ar/traffic-signs/F45L/exam/1",
      "x-default": appUrl + "/traffic-signs/F45L/exam/1",
    });
    expect(metadata.description).toContain("8 questions");
    expect(metadata.description).toContain(
      "This sign marks the end of the prohibition on overtaking.",
    );
    expect(metadata.openGraph?.url).toBe(
      appUrl + "/traffic-signs/F45L/exam/1",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("uses the localized French canonical and Open Graph locale", async () => {
    mockedGetRequestLocale.mockResolvedValue("fr");

    const metadata = await generateMetadata({
      params: Promise.resolve({ signCode: "F45L", examNumber: "1" }),
    });

    expect(metadata.title).toEqual({
      absolute:
        "Examen théorique du panneau Fin de l'interdiction de dépasser | Rijvia",
    });
    expect(metadata.alternates?.canonical).toBe(
      appUrl + "/fr/traffic-signs/F45L/exam/1",
    );
    expect(metadata.openGraph?.locale).toBe("fr_BE");
  });

  it("keeps unsupported exam numbers out of the index", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ signCode: "F45L", examNumber: "2" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(mockedGetPublicTrafficSign).not.toHaveBeenCalled();
  });

  it("keeps signs without an active exam out of the index", async () => {
    mockedGetPublicTrafficSign.mockResolvedValue({
      ...sign,
      exam1TotalQuestions: null,
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ signCode: "F45L", examNumber: "1" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders unique Arabic exam context in the initial server HTML", async () => {
    mockedGetRequestLocale.mockResolvedValue("ar");

    const markup = renderToStaticMarkup(
      await SignExamLayout({
        children: <div>Exam UI</div>,
        params: Promise.resolve({ signCode: "F45L", examNumber: "1" }),
      }),
    );

    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain("اختبر معرفتك بإشارة نهاية منع التجاوز");
    expect(markup).toContain("8");
    expect(markup).toContain("6 / 8");
    expect(markup).toContain("Exam UI");
  });
});
