import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getRequestLocale } from "@/lib/server/request-locale";
import { getLocalizedTrafficSignSeo } from "@/lib/learning-seo-copy";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  type SiteLocale,
} from "@/lib/site-copy";
import {
  buildAbsoluteUrl,
  toMetadataDescription,
} from "@/lib/seo";
import { getPublicTrafficSign } from "@/lib/server/public-catalog";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";
import type { TrafficSign } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

type SignExamLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{ signCode: string; examNumber: string }>;
}>;

type SignExamSeoCopy = {
  eyebrow: string;
  title: (name: string) => string;
  heading: (name: string) => string;
  intro: (name: string, questionCount: number) => string;
  questionsLabel: string;
  passLabel: string;
};

const EXAM_COPY: Record<SiteLocale, SignExamSeoCopy> = {
  en: {
    eyebrow: "Belgian driving theory · Traffic sign exam",
    title: (name) => "Belgian Traffic Sign Exam: " + name + " | Rijvia",
    heading: (name) => "Test your knowledge of " + name,
    intro: (name, count) =>
      "Prepare for the Belgian driving theory test with this focused exam about " +
      name +
      ". It contains " +
      count +
      " questions to help you review the sign's meaning and the driving rules it represents.",
    questionsLabel: "Questions",
    passLabel: "Correct answers to pass",
  },
  nl: {
    eyebrow: "Belgisch theorie-examen · Verkeersbord",
    title: (name) => "Theorie-examen verkeersbord: " + name + " | Rijvia",
    heading: (name) => "Test je kennis van " + name,
    intro: (name, count) =>
      "Bereid je voor op het Belgische theorie-examen met dit gerichte examen over " +
      name +
      ". Het bevat " +
      count +
      " vragen om de betekenis van het verkeersbord en de bijbehorende verkeersregels te herhalen.",
    questionsLabel: "Vragen",
    passLabel: "Juiste antwoorden om te slagen",
  },
  fr: {
    eyebrow: "Théorie belge · Examen du panneau",
    title: (name) => "Examen théorique du panneau " + name + " | Rijvia",
    heading: (name) => "Testez vos connaissances sur " + name,
    intro: (name, count) =>
      "Préparez l’examen théorique belge avec ce test consacré à " +
      name +
      ". Il comprend " +
      count +
      " questions pour réviser la signification du panneau et les règles de conduite associées.",
    questionsLabel: "Questions",
    passLabel: "Bonnes réponses pour réussir",
  },
  ar: {
    eyebrow: "الامتحان النظري البلجيكي · اختبار الإشارة",
    title: (name) => "امتحان الإشارة المرورية " + name + " | Rijvia",
    heading: (name) => "اختبر معرفتك بإشارة " + name,
    intro: (name, count) =>
      "استعد لامتحان السياقة النظري في بلجيكا من خلال هذا الاختبار المخصص لإشارة " +
      name +
      ". يتضمن الامتحان " +
      count +
      " سؤالًا لمراجعة معنى الإشارة وقواعد القيادة المرتبطة بها.",
    questionsLabel: "عدد الأسئلة",
    passLabel: "الإجابات الصحيحة للنجاح",
  },
};

type SignExamPageData = {
  sign: TrafficSign;
  locale: SiteLocale;
  signSeo: ReturnType<typeof getLocalizedTrafficSignSeo>;
  copy: SignExamSeoCopy;
  pathname: string;
  canonical: string;
  title: string;
  intro: string;
  description: string;
  questionCount: number;
  image?: string;
};

function hasActiveExamOne(
  sign: TrafficSign | null,
): sign is TrafficSign & { exam1TotalQuestions: number } {
  return (
    sign !== null &&
    typeof sign.exam1TotalQuestions === "number" &&
    sign.exam1TotalQuestions > 0
  );
}

async function getSignExamPageData(
  signCode: string,
  examNumber: string,
): Promise<SignExamPageData | null> {
  // The current backend exposes only exam 1 for each traffic sign.
  if (Number(examNumber) !== 1) {
    return null;
  }

  const sign = await getPublicTrafficSign(signCode);
  if (!hasActiveExamOne(sign)) {
    return null;
  }

  const locale = await getRequestLocale();
  const signSeo = getLocalizedTrafficSignSeo(sign, locale);
  const copy = EXAM_COPY[locale];
  const routeCode = sign.routeCode || sign.signCode;
  const pathname =
    "/traffic-signs/" + encodeURIComponent(routeCode) + "/exam/1";
  const canonical = buildLocalizedUrl(pathname, locale, APP_URL);
  const questionCount = sign.exam1TotalQuestions;
  const intro = copy.intro(signSeo.name, questionCount);
  const description = toMetadataDescription(
    [intro, signSeo.description].filter(Boolean).join(" "),
    intro,
  );
  const image = sign.imageUrl
    ? buildAbsoluteUrl(sign.imageUrl, APP_URL)
    : undefined;

  return {
    sign,
    locale,
    signSeo,
    copy,
    pathname,
    canonical,
    title: copy.title(signSeo.name),
    intro,
    description,
    questionCount,
    image,
  };
}

function unavailableMetadata(): Metadata {
  return {
    title: { absolute: "Traffic Sign Exam | Rijvia" },
    robots: { index: false, follow: false },
  };
}

export async function generateMetadata({
  params,
}: Pick<SignExamLayoutProps, "params">): Promise<Metadata> {
  const { signCode, examNumber } = await params;
  const data = await getSignExamPageData(signCode, examNumber);

  if (!data) {
    return unavailableMetadata();
  }

  return {
    title: { absolute: data.title },
    description: data.description,
    alternates: getLocalizedAlternates(data.pathname, data.locale, APP_URL),
    openGraph: {
      title: data.title,
      description: data.description,
      url: data.canonical,
      siteName: "Rijvia",
      locale: getOpenGraphLocale(data.locale),
      alternateLocale: getAlternateOpenGraphLocales(data.locale),
      type: "website",
      ...(data.image
        ? { images: [{ url: data.image, alt: data.signSeo.imageAlt }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
      ...(data.image ? { images: [data.image] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function SignExamLayout({
  children,
  params,
}: SignExamLayoutProps) {
  const { signCode, examNumber } = await params;
  const data = await getSignExamPageData(signCode, examNumber);

  if (!data) {
    return children;
  }

  const passScore = data.sign.exam1PassingScore;
  const signDescription = data.signSeo.description.trim();

  return (
    <>
      <section
        dir={data.locale === "ar" ? "rtl" : "ltr"}
        aria-labelledby="sign-exam-seo-heading"
        className="container mx-auto max-w-6xl px-4 pt-5"
      >
        <div className="rounded-[1.5rem] border border-border/60 bg-card/85 p-4 shadow-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {data.copy.eyebrow}
          </p>
          <h1
            id="sign-exam-seo-heading"
            className="mt-2 text-xl font-black leading-tight text-foreground sm:text-2xl"
          >
            {data.copy.heading(data.signSeo.name)}
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">
            {data.intro}
          </p>
          {signDescription ? (
            <p className="mt-2 max-w-4xl text-sm leading-7 text-foreground/85">
              {signDescription}
            </p>
          ) : null}
          <dl className="mt-4 flex flex-wrap gap-2">
            <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2">
              <dt className="text-xs font-semibold text-muted-foreground">
                {data.copy.questionsLabel}
              </dt>
              <dd className="mt-1 text-base font-black tabular-nums text-foreground">
                {data.questionCount}
              </dd>
            </div>
            {typeof passScore === "number" ? (
              <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2">
                <dt className="text-xs font-semibold text-muted-foreground">
                  {data.copy.passLabel}
                </dt>
                <dd className="mt-1 text-base font-black tabular-nums text-foreground">
                  {passScore} / {data.questionCount}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>
      {children}
    </>
  );
}
