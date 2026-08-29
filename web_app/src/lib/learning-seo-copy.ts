import type { LessonDetail, TrafficSign } from "@/lib/types";
import type { SiteLocale } from "@/lib/site-copy";

export type LearningIndexSeoCopy = {
  title: string;
  description: string;
  keywords: string[];
  openGraphTitle: string;
  openGraphDescription: string;
  imageAlt: string;
};

type LocalizedLearningResourceCopy = {
  homeLabel: string;
  indexLabel: string;
  contextLabel: string;
  learningResourceType: string;
  educationalUse: string;
};

const TRAFFIC_SIGNS_COPY: Record<SiteLocale, LearningIndexSeoCopy> = {
  en: {
    title: "Belgian Traffic Signs: Meanings and Explanations",
    description:
      "Explore 184 Belgian traffic signs and road signs with meanings, explanations and driver guidance in English, Dutch, French and Arabic, organized by sign family.",
    keywords: [
      "Belgian traffic signs meanings",
      "traffic signs Belgium",
      "Belgian road signs",
      "Belgian road signs meanings",
      "Belgian traffic signs explained",
    ],
    openGraphTitle: "Belgian Traffic Signs and Meanings | RijVia",
    openGraphDescription:
      "Browse 184 Belgian traffic signs by family with clear multilingual meanings and explanations.",
    imageAlt: "Belgian traffic signs and meanings on RijVia",
  },
  nl: {
    title: "Verkeersborden België: betekenis en uitleg",
    description:
      "Bekijk 184 Belgische verkeersborden met betekenis en uitleg voor bestuurders, geordend per categorie en beschikbaar in het Nederlands, Engels, Frans en Arabisch.",
    keywords: [
      "verkeersborden België betekenis",
      "Belgische verkeersborden",
      "betekenis verkeersborden",
      "verkeersborden uitleg",
      "Belgische verkeersborden betekenis",
    ],
    openGraphTitle: "Verkeersborden België: betekenis en uitleg | RijVia",
    openGraphDescription:
      "Bekijk 184 Belgische verkeersborden per familie met duidelijke meertalige betekenis en uitleg.",
    imageAlt: "Belgische verkeersborden met betekenis op RijVia",
  },
  fr: {
    title: "Panneaux de signalisation Belgique : signification",
    description:
      "Consultez 184 panneaux de signalisation et panneaux routiers belges avec leur signification, leurs explications et des conseils pour les conducteurs.",
    keywords: [
      "panneaux de signalisation Belgique",
      "signification panneaux Belgique",
      "panneaux routiers belges",
      "signification panneaux routiers belges",
      "panneaux Belgique explication",
    ],
    openGraphTitle:
      "Panneaux de signalisation Belgique : signification | RijVia",
    openGraphDescription:
      "Parcourez 184 panneaux belges par famille avec des significations et explications multilingues claires.",
    imageAlt: "Panneaux de signalisation belges et leur signification",
  },
  ar: {
    title: "العلامات المرورية في بلجيكا: المعاني والشرح",
    description:
      "تعرّف على 184 علامة وإشارة مرور في بلجيكا مع المعاني والشرح وإرشادات للسائق، بالعربية والهولندية والفرنسية والإنجليزية ومرتبة حسب الفئة.",
    keywords: [
      "العلامات المرورية في بلجيكا",
      "إشارات المرور في بلجيكا",
      "العلامات المرورية في بلجيكا بالعربية",
      "معاني العلامات المرورية البلجيكية",
      "معاني إشارات المرور في بلجيكا",
    ],
    openGraphTitle: "العلامات المرورية في بلجيكا ومعانيها | RijVia",
    openGraphDescription:
      "تصفح 184 علامة مرورية بلجيكية مرتبة حسب الفئة، مع المعاني والشرح بأربع لغات.",
    imageAlt: "العلامات المرورية البلجيكية ومعانيها على RijVia",
  },
};

const LESSONS_COPY: Record<SiteLocale, LearningIndexSeoCopy> = {
  en: {
    title: "Belgian Driving Theory Lessons & Road Rules",
    description:
      "Study 30 structured Belgian driving theory lessons for category B covering Belgian road rules, traffic signs, priority, speed, parking and safety.",
    keywords: [
      "Belgian driving theory lessons",
      "Belgian road rules",
      "category B theory lessons Belgium",
      "Belgian traffic rules explained",
      "learn Belgian driving theory",
    ],
    openGraphTitle: "Belgian Driving Theory Lessons & Road Rules | RijVia",
    openGraphDescription:
      "Study 30 structured category B lessons about Belgian road rules in English, Dutch, French and Arabic.",
    imageAlt: "Belgian category B driving theory lessons on RijVia",
  },
  nl: {
    title: "Theorie Rijbewijs B België: Lessen & Verkeersregels",
    description:
      "Leer theorie rijbewijs B in België met 30 gestructureerde lessen over Belgische verkeersregels, verkeersborden, voorrang, snelheid, parkeren en veiligheid.",
    keywords: [
      "theorie rijbewijs B leren",
      "theorie rijbewijs B België",
      "rijtheorie lessen België",
      "Belgische verkeersregels leren",
      "Belgische rijtheorie",
    ],
    openGraphTitle: "Theorie Rijbewijs B België: Lessen | RijVia",
    openGraphDescription:
      "Leer Belgische verkeersregels met 30 gestructureerde rijtheorielessen in vier talen.",
    imageAlt: "Belgische rijtheorie voor rijbewijs B op RijVia",
  },
  fr: {
    title: "Cours Théorie Permis B Belgique & Code de la Route",
    description:
      "Étudiez 30 cours de théorie permis B en Belgique sur le code de la route belge : panneaux, priorités, vitesse, stationnement et sécurité.",
    keywords: [
      "cours théorie permis B Belgique",
      "théorie permis B Belgique",
      "code de la route belge",
      "règles de circulation belges",
      "apprendre théorie permis B",
    ],
    openGraphTitle: "Cours Théorie Permis B Belgique | RijVia",
    openGraphDescription:
      "Étudiez le code de la route belge avec 30 leçons structurées en quatre langues.",
    imageAlt: "Leçons de théorie du permis B belge sur RijVia",
  },
  ar: {
    title: "تعليم السياقة في بلجيكا بالعربية: دروس النظري",
    description:
      "تعلّم قواعد المرور البلجيكية بالعربية من خلال 30 درسًا منظمًا للنظري من الفئة B، تشمل العلامات والأولوية والسرعة والركن والسلامة.",
    keywords: [
      "تعليم السياقة في بلجيكا بالعربية",
      "دروس السياقة النظرية في بلجيكا",
      "قواعد المرور البلجيكية بالعربية",
      "تعلم قانون السير البلجيكي",
      "دروس امتحان السياقة النظري في بلجيكا",
    ],
    openGraphTitle: "تعليم السياقة في بلجيكا بالعربية | RijVia",
    openGraphDescription:
      "تعلّم قواعد المرور البلجيكية من خلال 30 درسًا منظمًا للنظري بأربع لغات.",
    imageAlt: "دروس السياقة النظرية البلجيكية على RijVia",
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
  return TRAFFIC_SIGNS_COPY[locale];
}

export function getLessonsSeoCopy(locale: SiteLocale): LearningIndexSeoCopy {
  return LESSONS_COPY[locale];
}

export function getLocalizedTrafficSignSeo(
  sign: TrafficSign,
  locale: SiteLocale,
) {
  const localized = {
    en: {
      name: sign.nameEn,
      summary: sign.summaryEn,
      description: sign.descriptionEn,
    },
    nl: {
      name: sign.nameNl,
      summary: sign.summaryNl,
      description: sign.descriptionNl,
    },
    fr: {
      name: sign.nameFr,
      summary: sign.summaryFr,
      description: sign.descriptionFr,
    },
    ar: {
      name: sign.nameAr,
      summary: sign.summaryAr,
      description: sign.descriptionAr,
    },
  }[locale];
  const resource = RESOURCE_COPY[locale];
  const name = localized.name || sign.nameEn || sign.signCode;
  const description =
    localized.description ||
    localized.summary ||
    sign.descriptionEn ||
    sign.summaryEn;

  return {
    name,
    description,
    title: `${sign.signCode}: ${name} | RijVia`,
    fallbackDescription: `${resource.contextLabel} ${sign.signCode}: ${name}.`,
    imageAlt: `${sign.signCode}: ${name}`,
    ...resource,
  };
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
    title: `${title} | ${resource.contextLabel} | RijVia`,
    fallbackDescription: `${resource.contextLabel}: ${title}.`,
    imageAlt: `${title} | RijVia`,
    ...resource,
  };
}
