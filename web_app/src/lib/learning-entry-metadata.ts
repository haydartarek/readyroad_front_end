import "server-only";

import type { Metadata } from "next";
import type { Language } from "@/lib/constants";
import { getRequestLocale } from "@/lib/server/request-locale";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  getSharedOgImage,
} from "@/lib/site-copy";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";
import { translateMessage } from "@/lib/messages";
import { normalizeSeoBrand, toBrandedMetadataTitle } from "@/lib/seo";

export type LearningEntryPage = "practice" | "signExam" | "theoryExam";

interface LearningEntryCopy {
  title: string;
  description: string;
  keywords: string[];
}

interface LearningEntryKeywords {
  keywords: string[];
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

const ENTRY_MESSAGE_KEYS: Record<
  LearningEntryPage,
  { title: string; description: string }
> = {
  practice: {
    title: "practice.title",
    description: "practice.hub.subtitle",
  },
  signExam: {
    title: "sign_practice.intro_title",
    description: "sign_practice.intro_subtitle",
  },
  theoryExam: {
    title: "practice_exam.intro_title",
    description: "practice_exam.intro_subtitle",
  },
};

const KEYWORD_COPY: Record<
  Language,
  Record<LearningEntryPage, LearningEntryKeywords>
> = {
  en: {
    practice: {
      keywords: [
        "Belgian driving theory practice",
        "driving theory practice Belgium",
        "category B theory practice",
        "Belgian theory practice questions",
        "practice driving theory questions Belgium",
        "Belgian traffic rules practice",
      ],
    },
    signExam: {
      keywords: [
        "Belgian traffic signs test",
        "Belgian road signs quiz",
        "traffic signs practice Belgium",
        "Belgian traffic signs quiz",
        "traffic sign questions Belgium",
        "Belgian road signs test",
      ],
    },
    theoryExam: {
      keywords: [
        "Belgian driving theory practice test",
        "Belgian theory exam simulation",
        "mock driving theory exam Belgium",
        "Belgian driving theory mock test",
        "category B theory test Belgium",
        "Belgian theory exam questions",
      ],
    },
  },
  nl: {
    practice: {
      keywords: [
        "theorie rijbewijs B oefenen",
        "theorievragen oefenen",
        "oefenvragen rijbewijs B",
        "Belgische rijtheorie oefenen",
        "theorie oefenen per onderwerp",
        "Belgische verkeersregels oefenen",
      ],
    },
    signExam: {
      keywords: [
        "verkeersborden oefenen België",
        "verkeersborden test",
        "verkeersborden quiz rijbewijs B",
        "Belgische verkeersborden oefenen",
        "verkeersborden theorie oefenen",
        "Belgische verkeersborden test",
      ],
    },
    theoryExam: {
      keywords: [
        "proefexamen rijbewijs B",
        "theorie-examen oefenen",
        "theorie-examen rijbewijs B oefenen",
        "proefexamen theorie België",
        "theorie examen simulatie",
        "Belgisch theorie-examen oefenen",
      ],
    },
  },
  fr: {
    practice: {
      keywords: [
        "exercices théorie permis B Belgique",
        "questions d'exercice permis B",
        "entraînement théorie permis B",
        "exercices code de la route Belgique",
        "exercices permis B Belgique",
        "questions permis B Belgique",
      ],
    },
    signExam: {
      keywords: [
        "test panneaux de signalisation Belgique",
        "quiz panneaux routiers belges",
        "exercices panneaux permis B",
        "test panneaux permis B",
        "panneaux de signalisation permis B",
        "questions panneaux routiers Belgique",
      ],
    },
    theoryExam: {
      keywords: [
        "examen blanc permis B Belgique",
        "test théorique belge",
        "simulation examen théorique",
        "examen théorique permis B en ligne",
        "test permis B Belgique",
        "examen théorique permis B Belgique",
      ],
    },
  },
  ar: {
    practice: {
      keywords: [
        "أسئلة تدريبية لامتحان السياقة النظري في بلجيكا",
        "التدريب على أسئلة السياقة في بلجيكا",
        "أسئلة رخصة السياقة في بلجيكا",
        "تدريب نظري للسياقة في بلجيكا",
        "أسئلة قواعد المرور البلجيكية",
        "أسئلة تيوري بلجيكا",
      ],
    },
    signExam: {
      keywords: [
        "اختبار العلامات المرورية في بلجيكا",
        "اختبار إشارات المرور في بلجيكا",
        "أسئلة العلامات المرورية البلجيكية",
        "أسئلة إشارات المرور في بلجيكا",
        "تدريب العلامات المرورية",
        "اختبار إشارات المرور",
      ],
    },
    theoryExam: {
      keywords: [
        "أسئلة امتحان السياقة النظري في بلجيكا",
        "محاكاة امتحان السياقة النظري",
        "اختبار السياقة النظري في بلجيكا",
        "امتحان تجريبي للسياقة في بلجيكا",
        "اختبار رخصة السياقة النظري",
        "امتحان تيوري بلجيكا",
      ],
    },
  },
};

export function getLearningEntryCopy(
  locale: Language,
  page: LearningEntryPage,
): LearningEntryCopy {
  const source = ENTRY_MESSAGE_KEYS[page];

  return {
    title: translateMessage(locale, source.title),
    description: translateMessage(locale, source.description),
    keywords: KEYWORD_COPY[locale][page].keywords,
  };
}

export async function createLearningEntryMetadata(
  page: LearningEntryPage,
  path: string,
): Promise<Metadata> {
  const locale = (await getRequestLocale()) as Language;
  const copy = getLearningEntryCopy(locale, page);
  const canonical = buildLocalizedUrl(path, locale, APP_URL);
  const image = {
    ...getSharedOgImage(locale),
    alt: `${copy.title} | Rijvia`,
  };

  return {
    title: { absolute: toBrandedMetadataTitle(copy.title) },
    description: normalizeSeoBrand(copy.description),
    keywords: copy.keywords,
    alternates: getLocalizedAlternates(path, locale, APP_URL),
    robots: { index: true, follow: true },
    openGraph: {
      title: toBrandedMetadataTitle(copy.title),
      description: normalizeSeoBrand(copy.description),
      url: canonical,
      siteName: "Rijvia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [image],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: toBrandedMetadataTitle(copy.title),
      description: normalizeSeoBrand(copy.description),
      images: [image.url],
    },
  };
}
