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
        "Practice Belgian driving theory questions by category and topic, strengthen your category B knowledge, and save your progress after signing in.",
      keywords: [
        "Belgian driving theory practice",
        "driving theory practice Belgium",
        "category B theory practice",
        "Belgian theory practice questions",
      ],
    },
    signExam: {
      title: "Belgian Traffic Signs Test",
      description:
        "Test your knowledge with 50 Belgian traffic sign questions covering road signs, timed answers, and a clear result after the test.",
      keywords: [
        "Belgian traffic signs test",
        "Belgian road signs quiz",
        "traffic signs practice Belgium",
        "traffic sign questions Belgium",
      ],
    },
    theoryExam: {
      title: "Belgian Driving Theory Practice Test",
      description:
        "Take a RijVia Belgian driving theory practice test with 50 questions, 15 seconds to answer after each question is read, and a pass score of 41 out of 50.",
      keywords: [
        "Belgian driving theory practice test",
        "Belgian theory exam simulation",
        "mock driving theory exam Belgium",
        "category B theory test Belgium",
      ],
    },
  },
  nl: {
    practice: {
      title: "Theorie Rijbewijs B Oefenen per Onderwerp",
      description:
        "Oefen Belgische theorievragen per onderwerp en verkeersbordcategorie, versterk je kennis voor rijbewijs B en bewaar je voortgang na het inloggen.",
      keywords: [
        "theorie rijbewijs B oefenen",
        "theorievragen oefenen",
        "oefenvragen rijbewijs B",
        "theorie oefenen per onderwerp",
      ],
    },
    signExam: {
      title: "Verkeersborden Oefenen België",
      description:
        "Test je kennis met 50 vragen over Belgische verkeersborden, getimede antwoorden en een duidelijk resultaat na de test.",
      keywords: [
        "verkeersborden oefenen België",
        "verkeersborden test",
        "verkeersborden quiz rijbewijs B",
        "Belgische verkeersborden oefenen",
      ],
    },
    theoryExam: {
      title: "Proefexamen Rijbewijs B België",
      description:
        "Maak een RijVia-proefexamen voor rijbewijs B met 50 vragen, 15 seconden antwoordtijd na het voorlezen en een slaagscore van 41 op 50.",
      keywords: [
        "proefexamen rijbewijs B",
        "theorie-examen oefenen",
        "proefexamen theorie België",
        "theorie examen simulatie",
      ],
    },
  },
  fr: {
    practice: {
      title: "Exercices Théorie Permis B Belgique",
      description:
        "Entraînez-vous avec des questions de théorie par thème et catégorie de panneaux pour préparer le permis B belge et conserver votre progression après connexion.",
      keywords: [
        "exercices théorie permis B Belgique",
        "questions d'exercice permis B",
        "entraînement théorie permis B",
        "exercices code de la route Belgique",
      ],
    },
    signExam: {
      title: "Test Panneaux de Signalisation Belgique",
      description:
        "Testez vos connaissances avec 50 questions sur les panneaux routiers belges, des réponses chronométrées et un résultat clair après le test.",
      keywords: [
        "test panneaux de signalisation Belgique",
        "quiz panneaux routiers belges",
        "exercices panneaux permis B",
        "test panneaux permis B",
      ],
    },
    theoryExam: {
      title: "Examen Blanc Permis B Belgique",
      description:
        "Passez un examen blanc RijVia de 50 questions pour le permis B, avec 15 secondes pour répondre après la lecture et un seuil de réussite de 41 sur 50.",
      keywords: [
        "examen blanc permis B Belgique",
        "test théorique belge",
        "simulation examen théorique",
        "examen théorique permis B en ligne",
      ],
    },
  },
  ar: {
    practice: {
      title: "أسئلة تدريبية لامتحان السياقة النظري في بلجيكا",
      description:
        "تدرّب على أسئلة السياقة النظرية حسب الموضوع وفئة العلامات، وطوّر معرفتك بقواعد المرور البلجيكية مع حفظ تقدمك بعد تسجيل الدخول.",
      keywords: [
        "أسئلة تدريبية لامتحان السياقة النظري في بلجيكا",
        "التدريب على أسئلة السياقة في بلجيكا",
        "أسئلة رخصة السياقة في بلجيكا",
        "أسئلة قواعد المرور البلجيكية",
      ],
    },
    signExam: {
      title: "اختبار العلامات المرورية في بلجيكا",
      description:
        "اختبر معرفتك من خلال 50 سؤالًا عن العلامات المرورية البلجيكية، مع وقت محدد للإجابة ونتيجة واضحة بعد انتهاء الاختبار.",
      keywords: [
        "اختبار العلامات المرورية في بلجيكا",
        "اختبار إشارات المرور في بلجيكا",
        "أسئلة العلامات المرورية البلجيكية",
        "تدريب العلامات المرورية",
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
