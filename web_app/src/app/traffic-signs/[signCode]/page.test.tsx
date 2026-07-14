import { render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios";

import TrafficSignDetailPage from "./page";
import { apiClient } from "@/lib/api";
import type { TrafficSign } from "@/lib/types";

const replaceMock = jest.fn();
const mockFetch = jest.fn();
const useAuthMock = jest.fn();
let requestUrls: string[] = [];
let requestConfigs: Record<string, unknown>[] = [];

jest.mock("next/navigation", () => ({
  useParams: () => ({ signCode: "A1b" }),
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "fr",
    isRTL: false,
  }),
}));

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock("@/components/ui/breadcrumb", () => {
  return function MockBreadcrumb() {
    return <nav data-testid="breadcrumb" />;
  };
});

jest.mock("@/components/ui/page-surface", () => ({
  PageHeroSurface: ({ children }: { children: React.ReactNode }) => (
    <section>{children}</section>
  ),
  PageHeroTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <h1 className={className}>{children}</h1>,
}));

jest.mock("@/components/traffic-signs/sign-image", () => ({
  SignImage: ({ alt }: { alt: string }) => <span aria-label={alt} role="img" />,
}));

jest.mock("@/components/ui/service-unavailable-banner", () => ({
  ServiceUnavailableBanner: () => <div>service unavailable</div>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (asChild ? <>{children}</> : <button>{children}</button>),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <section>{children}</section>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

jest.mock("@/lib/sign-image-resolver", () => ({
  resolveTrafficSignImage: (sign: TrafficSign) => sign.imageUrl,
}));

jest.mock("@/lib/sign-exam-status", () => ({
  getSignExamStatus: () => ({
    tone: "default",
    labelKey: "sign_quiz.not_started",
  }),
  getSignExamStatusClasses: () => "badge-default",
}));

jest.mock("@/lib/traffic-sign-presentation", () => ({
  getTrafficSignDescription: (sign: TrafficSign, language: string) =>
    language === "fr" ? sign.descriptionFr : sign.descriptionEn,
  getTrafficSignDriverGuidance: (sign: TrafficSign, language: string) =>
    language === "fr" ? sign.driverGuidanceFr : sign.driverGuidanceEn,
  getTrafficSignExceptions: (sign: TrafficSign, language: string) =>
    language === "fr" ? sign.exceptionsFr : sign.exceptionsEn,
  getTrafficSignGroupInfo: () => ({
    info: {
      title: {
        en: "Danger signs",
        fr: "Panneaux de danger",
        nl: "Gevaarsborden",
        ar: "إشارات الخطر",
      },
    },
    style: {
      chip: "chip-style",
    },
  }),
  getTrafficSignName: (sign: TrafficSign, language: string) =>
    language === "fr" ? sign.nameFr : sign.nameEn,
  getTrafficSignSummary: (sign: TrafficSign, language: string) =>
    language === "fr" ? sign.summaryFr : sign.summaryEn,
}));

const sampleSign: TrafficSign = {
  signCode: "A1b",
  routeCode: "A1b",
  categoryCode: "A",
  exam1TotalQuestions: 10,
  exam1PassingScore: 7,
  nameEn: "Dangerous bend to the right",
  nameAr: "منعطف خطير إلى اليمين",
  nameNl: "Gevaarlijke bocht naar rechts",
  nameFr: "Virage dangereux à droite",
  summaryEn: "A dangerous right-hand bend lies ahead.",
  summaryAr: "يوجد منعطف خطير إلى اليمين أمامك.",
  summaryNl: "Verderop ligt een gevaarlijke bocht naar rechts.",
  summaryFr: "Un virage dangereux à droite se trouve plus loin.",
  descriptionEn: "Warns about a dangerous bend to the right.",
  descriptionAr: "يحذر من منعطف خطير إلى اليمين.",
  descriptionNl: "Waarschuwt voor een gevaarlijke bocht naar rechts.",
  descriptionFr: "Avertit d'un virage dangereux à droite.",
  driverGuidanceEn: "Reduce speed before the bend and keep control.",
  driverGuidanceAr: "خفف السرعة قبل المنعطف وحافظ على السيطرة.",
  driverGuidanceNl: "Verminder snelheid vóór de bocht en behoud de controle.",
  driverGuidanceFr: "Réduisez la vitesse avant le virage et gardez le contrôle.",
  exceptionsEn: ["A supplementary plate may specify the distance."],
  exceptionsAr: ["قد تحدد لوحة تكميلية المسافة."],
  exceptionsNl: ["Een onderbord kan de afstand vermelden."],
  exceptionsFr: ["Un panneau additionnel peut préciser la distance."],
  imageUrl: "/images/signs/danger_signs/A1b.png",
};

const client = apiClient.getInstance();
const originalAdapter = client.defaults.adapter;

function resetRedirectGuard(): void {
  (apiClient as unknown as { isRedirecting: boolean }).isRedirecting = false;
}

function pageAdapter(sign: TrafficSign): AxiosAdapter {
  return async (config) => {
    const url = config.url ?? "";
    requestUrls.push(url);
    requestConfigs.push(config as unknown as Record<string, unknown>);

    if (url.includes("/traffic-signs/") && !url.includes("/sign-quiz/")) {
      return {
        data: sign,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      };
    }

    if (url.includes("/sign-quiz/signs/") && url.includes("/status")) {
      const response: AxiosResponse = {
        data: { message: "Unauthorized" },
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
        request: {},
      };

      throw new AxiosError(
        "Unauthorized",
        "ERR_BAD_REQUEST",
        config,
        {},
        response,
      );
    }

    throw new Error(`Unhandled test request: ${url}`);
  };
}

describe("TrafficSignDetailPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    mockFetch.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    requestUrls = [];
    requestConfigs = [];
    global.fetch = mockFetch as typeof fetch;
    client.defaults.adapter = pageAdapter(sampleSign);
    resetRedirectGuard();
  });

  afterAll(() => {
    client.defaults.adapter = originalAdapter;
    resetRedirectGuard();
  });

  it("does not request optional progress for anonymous public sign pages", async () => {
    render(<TrafficSignDetailPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Virage dangereux à droite",
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("sign_detail.overview")).toBeInTheDocument();
      expect(
        screen.getByText("Un virage dangereux à droite se trouve plus loin."),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Réduisez la vitesse avant le virage et gardez le contrôle.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Un panneau additionnel peut préciser la distance."),
      ).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    expect(requestUrls).toContain("/traffic-signs/A1b");
    expect(
      requestUrls.some(
        (url) => url.includes("/sign-quiz/signs/") && url.includes("/status"),
      ),
    ).toBe(false);
    expect(replaceMock).not.toHaveBeenCalledWith("/traffic-signs");
    expect(replaceMock).not.toHaveBeenCalledWith("/login");
  });

  it("keeps the public sign page visible when authenticated progress returns 401", async () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(<TrafficSignDetailPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Virage dangereux à droite",
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        requestUrls.some(
          (url) =>
            url.includes("/sign-quiz/signs/") && url.includes("/status"),
        ),
      ).toBe(true);
    });

    expect(
      requestConfigs.some((config) => config.skipAuthRedirect === true),
    ).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalledWith("/login");
  });
});
