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

export type LearningEntryPage = "practice" | "signExam" | "theoryExam";

interface LearningEntryCopy {
  title: string;
  description: string;
  keywords: string[];
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

const COPY: Record<Language, Record<LearningEntryPage, LearningEntryCopy>> = {
  en: {
    practice: {
      title: "Belgian Driving Theory Practice by Category",
      description:
        "Practice Belgian driving theory questions by topic, work on category B theory and Belgian traffic rules, and save your progress after signing in.",
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
      title: "Belgian Traffic Signs Test",
      description:
        "Take a 50-question Belgian traffic signs test and road signs quiz with timed answers, then review your result and continue studying sign meanings.",
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
      title: "Belgian Driving Theory Practice Test",
      description:
        "Take a 50-question Belgian driving theory practice test and exam simulation with 15 seconds to answer after each question is read and a 41 out of 50 pass target.",
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
      title: "Theorie Rijbewijs B Oefenen per Onderwerp",
      description:
        "Theorie rijbewijs B oefenen met theorievragen en oefenvragen per onderwerp, Belgische verkeersregels versterken en je voortgang bewaren na het inloggen.",
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
      title: "Verkeersborden Oefenen België",
      description:
        "Verkeersborden oefenen België met een test van 50 vragen, een verkeersborden quiz voor rijbewijs B, getimede antwoorden en een duidelijk resultaat.",
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
      title: "Proefexamen Rijbewijs B België",
      description:
        "Maak een proefexamen rijbewijs B met 50 vragen als theorie-examensimulatie, 15 seconden antwoordtijd na het voorlezen en een slaagscore van 41 op 50.",
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
      title: "Exercices Théorie Permis B Belgique",
      description:
        "Faites des exercices de théorie permis B Belgique et des questions d’exercice par thème pour travailler le code de la route belge et conserver votre progression après connexion.",
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
      title: "Test Panneaux de Signalisation Belgique",
      description:
        "Passez un test de 50 questions sur les panneaux de signalisation en Belgique, avec quiz de panneaux routiers belges, réponses chronométrées et résultat clair.",
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
      title: "Examen Blanc Permis B Belgique",
      description:
        "Passez un examen blanc permis B Belgique de 50 questions comme simulation de l’examen théorique, avec 15 secondes pour répondre après la lecture et un seuil de 41 sur 50.",
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
      title: "أسئلة تدريبية لامتحان السياقة النظري في بلجيكا",
      description:
        "تدرّب على أسئلة السياقة النظرية وأسئلة رخصة السياقة في بلجيكا حسب الموضوع، وطوّر معرفتك بقواعد المرور البلجيكية مع حفظ تقدمك بعد تسجيل الدخول.",
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
      title: "اختبار العلامات المرورية في بلجيكا",
      description:
        "اختبر معرفتك من خلال 50 سؤالًا عن العلامات المرورية البلجيكية وإشارات المرور في بلجيكا، مع وقت محدد للإجابة ونتيجة واضحة بعد الاختبار.",
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
      title: "أسئلة امتحان السياقة النظري في بلجيكا",
      description:
        "اختبر نفسك بمحاكاة RijVia من 50 سؤالًا لامتحان السياقة النظري في بلجيكا، مع 15 ثانية للإجابة بعد القراءة ودرجة نجاح 41 من 50.",
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
  return COPY[locale][page];
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
    alt: `${copy.title} | RijVia`,
  };

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: getLocalizedAlternates(path, locale, APP_URL),
    robots: { index: true, follow: true },
    openGraph: {
      title: `${copy.title} | RijVia`,
      description: copy.description,
      url: canonical,
      siteName: "RijVia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [image],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} | RijVia`,
      description: copy.description,
      images: [image.url],
    },
  };
}
