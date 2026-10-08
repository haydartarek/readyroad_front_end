import type { LessonDetail, TrafficSign } from "@/lib/types";
import type { SiteLocale } from "@/lib/site-copy";
import { GROUP_INFO } from "@/lib/sign-category-data";
import { translateMessage } from "@/lib/messages";
import { getTrafficSignName } from "@/lib/traffic-sign-presentation";

export type LearningIndexSeoCopy = {
  title: string;
  description: string;
  keywords: string[];
  openGraphTitle: string;
  openGraphDescription: string;
  imageAlt: string;
};

type LearningIndexSeoConfig = Pick<
  LearningIndexSeoCopy,
  "keywords" | "imageAlt"
>;

type LocalizedLearningResourceCopy = {
  homeLabel: string;
  indexLabel: string;
  contextLabel: string;
  learningResourceType: string;
  educationalUse: string;
};

const TRAFFIC_SIGNS_COPY: Record<SiteLocale, LearningIndexSeoConfig> = {
  en: {
    keywords: [
      "Belgian traffic signs meanings",
      "traffic signs Belgium",
      "Belgian road signs",
      "Belgian road signs meanings",
      "Belgian traffic signs explained",
    ],
    imageAlt: "Belgian traffic signs and meanings on Rijvia",
  },
  nl: {
    keywords: [
      "verkeersborden België betekenis",
      "Belgische verkeersborden",
      "betekenis verkeersborden",
      "verkeersborden uitleg",
      "Belgische verkeersborden betekenis",
    ],
    imageAlt: "Belgische verkeersborden met betekenis op Rijvia",
  },
  fr: {
    keywords: [
      "panneaux de signalisation Belgique",
      "signification panneaux Belgique",
      "panneaux routiers belges",
      "signification panneaux routiers belges",
      "panneaux Belgique explication",
    ],
    imageAlt: "Panneaux de signalisation belges et leur signification",
  },
  ar: {
    keywords: [
      "العلامات المرورية في بلجيكا",
      "إشارات المرور في بلجيكا",
      "العلامات المرورية في بلجيكا بالعربية",
      "معاني العلامات المرورية البلجيكية",
      "معاني إشارات المرور في بلجيكا",
    ],
    imageAlt: "العلامات المرورية البلجيكية ومعانيها على Rijvia",
  },
};

const LESSONS_COPY: Record<SiteLocale, LearningIndexSeoConfig> = {
  en: {
    keywords: [
      "Belgian driving theory lessons",
      "Belgian road rules",
      "category B theory lessons Belgium",
      "Belgian traffic rules explained",
      "learn Belgian driving theory",
    ],
    imageAlt: "Belgian category B driving theory lessons on Rijvia",
  },
  nl: {
    keywords: [
      "theorie rijbewijs B leren",
      "theorie rijbewijs B België",
      "rijtheorie lessen België",
      "Belgische verkeersregels leren",
      "Belgische rijtheorie",
    ],
    imageAlt: "Belgische rijtheorie voor rijbewijs B op Rijvia",
  },
  fr: {
    keywords: [
      "cours théorie permis B Belgique",
      "théorie permis B Belgique",
      "code de la route belge",
      "règles de circulation belges",
      "apprendre théorie permis B",
    ],
    imageAlt: "Leçons de théorie du permis B belge sur Rijvia",
  },
  ar: {
    keywords: [
      "تعليم السياقة في بلجيكا بالعربية",
      "دروس السياقة النظرية في بلجيكا",
      "قواعد المرور البلجيكية بالعربية",
      "تعلم قانون السير البلجيكي",
      "دروس امتحان السياقة النظري في بلجيكا",
    ],
    imageAlt: "دروس السياقة النظرية البلجيكية على Rijvia",
  },
};

const RESOURCE_COPY: Record<SiteLocale, LocalizedLearningResourceCopy> = {
  en: {
    homeLabel: "Home",
    indexLabel: "Belgian Traffic Signs",
    contextLabel: "Belgian traffic sign",
    learningResourceType: "Traffic sign reference",
    educationalUse: "Study and revision",
  },
  nl: {
    homeLabel: "Startpagina",
    indexLabel: "Belgische verkeersborden",
    contextLabel: "Belgisch verkeersbord",
    learningResourceType: "Naslagwerk voor verkeersborden",
    educationalUse: "Studie en herhaling",
  },
  fr: {
    homeLabel: "Accueil",
    indexLabel: "Panneaux de signalisation belges",
    contextLabel: "Panneau de signalisation belge",
    learningResourceType: "Référence de panneau de signalisation",
    educationalUse: "Étude et révision",
  },
  ar: {
    homeLabel: "الرئيسية",
    indexLabel: "العلامات المرورية البلجيكية",
    contextLabel: "علامة مرورية بلجيكية",
    learningResourceType: "مرجع لعلامة مرورية",
    educationalUse: "الدراسة والمراجعة",
  },
};

const LESSON_RESOURCE_COPY: Record<
  SiteLocale,
  LocalizedLearningResourceCopy
> = {
  en: {
    homeLabel: "Home",
    indexLabel: "Belgian Driving Theory Lessons",
    contextLabel: "Belgian Driving Theory",
    learningResourceType: "Driving theory lesson",
    educationalUse: "Study and revision",
  },
  nl: {
    homeLabel: "Startpagina",
    indexLabel: "Belgische rijtheorielessen",
    contextLabel: "Belgische rijtheorie",
    learningResourceType: "Rijtheorieles",
    educationalUse: "Studie en herhaling",
  },
  fr: {
    homeLabel: "Accueil",
    indexLabel: "Leçons de théorie routière belge",
    contextLabel: "Théorie routière belge",
    learningResourceType: "Leçon de théorie routière",
    educationalUse: "Étude et révision",
  },
  ar: {
    homeLabel: "الرئيسية",
    indexLabel: "دروس السياقة النظرية البلجيكية",
    contextLabel: "قواعد السياقة البلجيكية",
    learningResourceType: "درس في قواعد السياقة",
    educationalUse: "الدراسة والمراجعة",
  },
};

export function getTrafficSignsSeoCopy(
  locale: SiteLocale,
): LearningIndexSeoCopy {
  const config = TRAFFIC_SIGNS_COPY[locale];
  const title = translateMessage(locale, "traffic_signs.page_title");
  const description = translateMessage(locale, "traffic_signs.page_subtitle");

  return {
    ...config,
    title,
    description,
    openGraphTitle: title,
    openGraphDescription: description,
  };
}

export function getLessonsSeoCopy(locale: SiteLocale): LearningIndexSeoCopy {
  const config = LESSONS_COPY[locale];
  const title = translateMessage(locale, "lessons.page_title");
  const description = translateMessage(locale, "lessons.page_subtitle");

  return {
    ...config,
    title,
    description,
    openGraphTitle: title,
    openGraphDescription: description,
  };
}

export function getLocalizedTrafficSignSeo(
  sign: TrafficSign,
  locale: SiteLocale,
) {
  const localized = {
    en: {
      summary: sign.summaryEn,
      description: sign.descriptionEn,
      guidance: sign.driverGuidanceEn,
    },
    nl: {
      summary: sign.summaryNl,
      description: sign.descriptionNl,
      guidance: sign.driverGuidanceNl,
    },
    fr: {
      summary: sign.summaryFr,
      description: sign.descriptionFr,
      guidance: sign.driverGuidanceFr,
    },
    ar: {
      summary: sign.summaryAr,
      description: sign.descriptionAr,
      guidance: sign.driverGuidanceAr,
    },
  }[locale];
  const resource = RESOURCE_COPY[locale];
  const name = getTrafficSignName(sign, locale) || sign.nameEn || sign.signCode;
  const categoryCode = sign.categoryCode?.trim().toUpperCase();
  const category = categoryCode ? GROUP_INFO[categoryCode] : undefined;
  const categoryTitle = category?.title[locale] || resource.contextLabel;
  const baseDescription =
    localized.description ||
    localized.summary ||
    sign.descriptionEn ||
    sign.summaryEn ||
    "";
  const guidance = localized.guidance || sign.driverGuidanceEn || "";
  const description = [baseDescription, guidance].filter(Boolean).join(" ");

  return {
    name,
    categoryTitle,
    description,
    title: `${name} | ${categoryTitle} | Rijvia`,
    fallbackDescription: `${resource.contextLabel}: ${name}.`,
    imageAlt: name,
    ...resource,
  };
}

type LessonSearchCopy = Readonly<{
  title: string;
  description: string;
  heading: string;
  paragraphs: readonly string[];
}>;

// Editorial search summaries; lesson content and titles remain in the public catalog.
const LESSON_SEARCH_COPY: Record<string, Partial<Record<SiteLocale, LessonSearchCopy>>> = {
  "les-5": {
    "nl": {
      "title": "Rijbaan en rijstrook: verschil en wegmarkeringen | Rijvia",
      "description": "Wat is een rijbaan en wat is een rijstrook? Leer het verschil, herken wegmarkeringen en bereid je voor op het Belgische theorie-examen.",
      "heading": "Wat is het verschil tussen een rijbaan en een rijstrook?",
      "paragraphs": [
        "De rijbaan is het deel van de openbare weg dat voor het verkeer van voertuigen in het algemeen is ingericht. Een rijstrook is een in de lengterichting afgebakend deel van die rijbaan, gemarkeerd met witte doorlopende of onderbroken lijnen. Eén rijbaan kan dus meerdere rijstroken hebben.",
        "Een weg zonder rijstrookmarkeringen kan wel een rijbaan zijn. Kijk bij een examenvraag afzonderlijk naar de rijbaan, de gemarkeerde rijstroken en de pijlen of lijnen die aangeven waar je mag rijden. Deze les legt de wegindeling en de markeringen uit."
      ]
    }
  },
  "les-9": {
    "fr": {
      "title": "Route pour automobiles ou autoroute : différences | Rijvia",
      "description": "Quelle différence entre route pour automobiles et autoroute en Belgique ? Comparez les panneaux F9 et F5, les accès et les règles à reconnaître.",
      "heading": "Quelle différence entre route pour automobiles et autoroute ?",
      "paragraphs": [
        "En Belgique, le panneau F9 annonce une route pour automobiles et le panneau F5 une autoroute. Ce sont deux catégories de routes différentes : la présence du panneau F9 ne signifie donc pas que toutes les règles propres à l’autoroute s’appliquent.",
        "Une route pour automobiles peut comporter des carrefours à niveau ou des feux. Pour déterminer la vitesse autorisée, l’accès et le comportement à adopter, vérifiez le type de route et la signalisation présente. Comparez ces situations dans les sections de cette leçon."
      ]
    }
  },
  "les-6": {
    "en": {
      "title": "Belgian Traffic Rules: Lights, Safety and Accidents | Rijvia",
      "description": "Study Belgium's general traffic rules: using vehicle lights, driving safely, alcohol risks and what to do after an accident. Prepare for your theory exam.",
      "heading": "Which general traffic rules should you study in Belgium?",
      "paragraphs": [
        "General traffic rules connect safe driving with the condition of your vehicle and the situation on the road. This lesson covers the basic rules, correct use of lights, alcohol and driving, and the steps to take after an accident.",
        "Use each section to connect the rule to a practical situation. For example, changing visibility affects the lights you need, while an accident requires you to think about immediate safety and assistance. Read the full explanation before practising related questions."
      ]
    }
  },
  "les-12": {
    "nl": {
      "title": "Maximaal toegelaten massa (MTM): uitleg en voorbeelden | Rijvia",
      "description": "Wat betekent maximaal toegelaten massa (MTM)? Leer het verschil met de werkelijke massa en hoe inzittenden en lading meetellen bij het theorie-examen.",
      "heading": "Wat betekent maximaal toegelaten massa (MTM)?",
      "paragraphs": [
        "De maximaal toegelaten massa, afgekort MTM, is de toegelaten bovengrens voor de massa van het beladen voertuig. De werkelijke massa is wat het voertuig op dat moment weegt, met de aanwezige inzittenden en lading. De MTM verandert dus niet telkens wanneer je iets in- of uitlaadt.",
        "Een voertuig kan in werkelijkheid minder wegen dan zijn MTM. Lees daarom bij een examenvraag zorgvuldig of het gaat over de toegelaten maximumwaarde of over de actuele massa. De betekenis van het verkeersbord en een eventueel onderbord bepaalt welke waarde je moet beoordelen."
      ]
    }
  },
  "les-17": {
    "ar": {
      "title": "حالات منع التجاوز في بلجيكا: العلامات والرؤية | Rijvia",
      "description": "تعلّم حالات منع التجاوز في بلجيكا: ضعف الرؤية وعلامات C35 وC39 والخطوط والتقاطعات، مع شرح الشروط والاستثناءات استعدادًا للامتحان النظري.",
      "heading": "ما حالات منع التجاوز في بلجيكا؟",
      "paragraphs": [
        "من حالات منع التجاوز من اليسار عدم القدرة على رؤية المركبات القادمة في الاتجاه المعاكس من مسافة كافية لإتمام المناورة بأمان. لذلك تُقيَّم الرؤية الفعلية عند المنعطفات والمرتفعات، ولا يكفي أن يبدو المسار المقابل خاليًا للحظة.",
        "انتبه أيضًا إلى علامتَي C35 وC39، وإلى الخطوط الأرضية والتقاطعات والمعابر. يختلف نطاق المنع بحسب العلامة ونوع المركبة والموقف؛ اقرأ شروط كل حالة واستثناءاتها في الدرس قبل اختيار الإجابة، ولا تفترض أن جميع حالات التجاوز تخضع للقاعدة نفسها."
      ]
    }
  }
};

export function getLessonSearchCopy(lessonCode: string, locale: string) {
  return LESSON_SEARCH_COPY[lessonCode]?.[locale as SiteLocale];
}

export function getLocalizedLessonSeo(
  lesson: LessonDetail,
  locale: SiteLocale,
) {
  const localized = {
    en: { title: lesson.titleEn, description: lesson.descriptionEn },
    nl: { title: lesson.titleNl, description: lesson.descriptionNl },
    fr: { title: lesson.titleFr, description: lesson.descriptionFr },
    ar: { title: lesson.titleAr, description: lesson.descriptionAr },
  }[locale];
  const resource = LESSON_RESOURCE_COPY[locale];
  const title = localized.title || lesson.titleEn || lesson.lessonCode;
  const description = localized.description || lesson.descriptionEn;

  return {
    name: title,
    description,
    title: `${title} | ${resource.contextLabel} | Rijvia`,
    fallbackDescription: `${resource.contextLabel}: ${title}.`,
    imageAlt: `${title} | Rijvia`,
    ...resource,
  };
}
