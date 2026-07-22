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
      "Explore 184 Belgian traffic signs with meanings and driver guidance in English, Dutch, French, and Arabic, organized by sign family.",
    keywords: [
      "Belgian traffic signs meanings",
      "traffic signs Belgium",
      "Belgian road signs",
    ],
    openGraphTitle: "Belgian Traffic Signs and Meanings | ReadyRoad",
    openGraphDescription:
      "Browse 184 Belgian traffic signs by family with clear multilingual explanations.",
    imageAlt: "Belgian traffic signs and meanings on ReadyRoad",
  },
  nl: {
    title: "Verkeersborden België: betekenis en uitleg",
    description:
      "Bekijk 184 Belgische verkeersborden met hun betekenis en uitleg voor bestuurders in het Nederlands, Engels, Frans en Arabisch.",
    keywords: [
      "verkeersborden België betekenis",
      "Belgische verkeersborden",
      "verkeersborden België oefenen",
    ],
    openGraphTitle: "Verkeersborden België: betekenis en uitleg | ReadyRoad",
    openGraphDescription:
      "Bekijk 184 Belgische verkeersborden per familie met duidelijke meertalige uitleg.",
    imageAlt: "Belgische verkeersborden met betekenis op ReadyRoad",
  },
  fr: {
    title: "Panneaux de signalisation Belgique : signification",
    description:
      "Consultez 184 panneaux de signalisation belges avec leur signification et des conseils en français, néerlandais, anglais et arabe.",
    keywords: [
      "panneaux de signalisation Belgique",
      "signification panneaux Belgique",
      "panneaux routiers belges",
    ],
    openGraphTitle:
      "Panneaux de signalisation Belgique : signification | ReadyRoad",
    openGraphDescription:
      "Parcourez 184 panneaux belges par famille avec des explications multilingues claires.",
    imageAlt: "Panneaux de signalisation belges et leur signification",
  },
  ar: {
    title: "إشارات المرور في بلجيكا: المعاني والشرح",
    description:
      "تعرّف على 184 إشارة مرور بلجيكية ومعانيها وإرشاداتها بالعربية والهولندية والفرنسية والإنجليزية، مرتبة حسب الفئة.",
    keywords: [
      "إشارات المرور في بلجيكا",
      "علامات المرور في بلجيكا بالعربي",
      "معاني إشارات المرور البلجيكية",
    ],
    openGraphTitle: "إشارات المرور في بلجيكا ومعانيها | ReadyRoad",
    openGraphDescription:
      "تصفح 184 إشارة مرور بلجيكية حسب الفئة مع شرح واضح بأربع لغات.",
    imageAlt: "إشارات المرور البلجيكية ومعانيها على ReadyRoad",
  },
};

const LESSONS_COPY: Record<SiteLocale, LearningIndexSeoCopy> = {
  en: {
    title: "Belgian Driving Theory Lessons for Category B",
    description:
      "Study 30 structured Belgian category B theory lessons covering traffic signs, priority, speed, parking, safety, and other core road rules.",
    keywords: [
      "Belgian driving theory lessons",
      "category B theory Belgium",
      "Belgian road rules explained",
    ],
    openGraphTitle: "Belgian Category B Driving Theory Lessons | ReadyRoad",
    openGraphDescription:
      "Study 30 structured lessons about Belgian road rules in English, Dutch, French, and Arabic.",
    imageAlt: "Belgian category B driving theory lessons on ReadyRoad",
  },
  nl: {
    title: "Theorie rijbewijs B België: 30 lessen",
    description:
      "Bestudeer 30 gestructureerde lessen voor het Belgische rijbewijs B over verkeersborden, voorrang, snelheid, parkeren en verkeersveiligheid.",
    keywords: [
      "theorie rijbewijs B België",
      "rijtheorie lessen België",
      "Belgische verkeersregels leren",
    ],
    openGraphTitle: "Theorie rijbewijs B België: 30 lessen | ReadyRoad",
    openGraphDescription:
      "Bestudeer Belgische verkeersregels in 30 gestructureerde lessen en vier talen.",
    imageAlt: "Belgische rijtheorie voor rijbewijs B op ReadyRoad",
  },
  fr: {
    title: "Théorie permis B Belgique : 30 leçons",
    description:
      "Étudiez 30 leçons structurées pour le permis B belge sur les panneaux, les priorités, la vitesse, le stationnement et la sécurité.",
    keywords: [
      "théorie permis B Belgique",
      "cours théorie permis B Belgique",
      "règles de circulation Belgique",
    ],
    openGraphTitle: "Théorie permis B Belgique : 30 leçons | ReadyRoad",
    openGraphDescription:
      "Étudiez les règles de circulation belges avec 30 leçons structurées en quatre langues.",
    imageAlt: "Leçons de théorie du permis B belge sur ReadyRoad",
  },
  ar: {
    title: "دروس امتحان القيادة النظري في بلجيكا",
    description:
      "ادرس 30 درسًا منظمًا لرخصة القيادة B في بلجيكا حول الإشارات والأولوية والسرعة والركن والسلامة وقواعد المرور الأساسية.",
    keywords: [
      "دروس القيادة النظرية في بلجيكا",
      "امتحان رخصة القيادة النظري في بلجيكا",
      "قواعد المرور البلجيكية بالعربية",
    ],
    openGraphTitle: "دروس القيادة النظرية في بلجيكا | ReadyRoad",
    openGraphDescription:
      "ادرس قواعد المرور البلجيكية عبر 30 درسًا منظمًا بأربع لغات.",
    imageAlt: "دروس القيادة النظرية البلجيكية على ReadyRoad",
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
    indexLabel: "إشارات المرور البلجيكية",
    contextLabel: "إشارة مرور بلجيكية",
    learningResourceType: "مرجع لإشارة مرور",
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
    indexLabel: "دروس القيادة النظرية البلجيكية",
    contextLabel: "نظرية القيادة البلجيكية",
    learningResourceType: "درس في نظرية القيادة",
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
    title: `${sign.signCode}: ${name} | ReadyRoad`,
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
    title: `${title} | ${resource.contextLabel} | ReadyRoad`,
    fallbackDescription: `${resource.contextLabel}: ${title}.`,
    imageAlt: `${title} | ReadyRoad`,
    ...resource,
  };
}
