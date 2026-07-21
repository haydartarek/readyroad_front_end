export type SiteLocale = "en" | "ar" | "fr" | "nl";

export const DEFAULT_APP_URL = "https://readyroad.be";
export const DEFAULT_SITE_LOCALE: SiteLocale = "en";

const SHARED_KEYWORDS = [
  "Belgian driving license exam",
  "Belgian driving theory test",
  "traffic signs Belgium",
  "ReadyRoad",
  "rijbewijs theorie examen",
  "rijexamen oefenen",
  "verkeerstekens België",
  "permis de conduire belgique",
  "examen théorique permis conduire",
  "panneaux signalisation belgique",
  "رخصة القيادة في بلجيكا",
  "امتحان القيادة في بلجيكا",
  "إشارات المرور البلجيكية",
];

const OPEN_GRAPH_LOCALES: Record<SiteLocale, string> = {
  en: "en_BE",
  ar: "ar_BE",
  fr: "fr_BE",
  nl: "nl_BE",
};

const SITE_COPY: Record<
  SiteLocale,
  {
    sharedOgAlt: string;
    homeMetadata: {
      title: string;
      description: string;
      keywords: string[];
      openGraphTitle: string;
      openGraphDescription: string;
    };
    layoutMetadata: {
      defaultTitle: string;
      description: string;
      keywords: string[];
      openGraphDescription: string;
      twitterDescription: string;
      organizationDescription: string;
      websiteDescription: string;
      softwareDescription: string;
    };
  }
> = {
  en: {
    sharedOgAlt: "ReadyRoad | Belgian driving theory exam preparation",
    homeMetadata: {
      title: "ReadyRoad | Belgian Driving Theory Exam Preparation",
      description:
        "Prepare for the Belgian driving theory exam with traffic signs, structured lessons, focused practice, and one clear progress dashboard.",
      keywords: SHARED_KEYWORDS,
      openGraphTitle: "ReadyRoad | Belgian Driving Theory Exam Preparation",
      openGraphDescription:
        "Study traffic signs, review theory lessons, practise by category, and track your progress in one place.",
    },
    layoutMetadata: {
      defaultTitle: "ReadyRoad | Belgian Driving Theory Exam Preparation",
      description:
        "ReadyRoad helps learners prepare for the Belgian driving theory exam with traffic signs, lessons, timed practice, and progress insights.",
      keywords: SHARED_KEYWORDS,
      openGraphDescription:
        "Practice Belgian theory topics, study traffic signs, and track your progress from one dashboard.",
      twitterDescription:
        "Practice theory topics, study traffic signs, and track your progress with ReadyRoad.",
      organizationDescription:
        "ReadyRoad is an independent learning platform for Belgian driving theory exam preparation.",
      websiteDescription: "Belgian driving theory exam preparation platform.",
      softwareDescription:
        "Prepare for the Belgian driving theory exam with practice flows, traffic signs, lessons, and progress analytics.",
    },
  },
  ar: {
    sharedOgAlt: "ReadyRoad | التحضير لامتحان القيادة النظري في بلجيكا",
    homeMetadata: {
      title: "ReadyRoad | التحضير لامتحان القيادة النظري في بلجيكا",
      description:
        "استعد لامتحان القيادة النظري في بلجيكا عبر إشارات المرور، والدروس المنظمة، والتدريب الموجّه، ولوحة تقدم واضحة في مكان واحد.",
      keywords: SHARED_KEYWORDS,
      openGraphTitle: "ReadyRoad | التحضير لامتحان القيادة النظري في بلجيكا",
      openGraphDescription:
        "ادرس إشارات المرور، وراجع الدروس النظرية، وتدرّب حسب الفئة، وتابع تقدمك من مكان واحد.",
    },
    layoutMetadata: {
      defaultTitle: "ReadyRoad | التحضير لامتحان القيادة النظري في بلجيكا",
      description:
        "يساعد ReadyRoad المتعلمين على الاستعداد لامتحان القيادة النظري في بلجيكا عبر إشارات المرور، والدروس، والتدريب الموقّت، وتحليلات التقدم.",
      keywords: SHARED_KEYWORDS,
      openGraphDescription:
        "تدرّب على محاور النظرية البلجيكية، وادرس العلامات المرورية، وتابع تقدمك من لوحة تحكم واحدة.",
      twitterDescription:
        "تدرّب على محاور النظرية، وادرس العلامات المرورية، وتابع تقدمك مع ReadyRoad.",
      organizationDescription:
        "ReadyRoad منصة تعليمية مستقلة للتحضير لامتحان القيادة النظري في بلجيكا.",
      websiteDescription: "منصة للتحضير لامتحان القيادة النظري في بلجيكا.",
      softwareDescription:
        "استعد لامتحان القيادة النظري في بلجيكا عبر مسارات التدريب، والعلامات المرورية، والدروس، وتحليلات التقدم.",
    },
  },
  fr: {
    sharedOgAlt: "ReadyRoad | préparation à l'examen théorique belge",
    homeMetadata: {
      title: "ReadyRoad | préparation à l'examen théorique belge",
      description:
        "Préparez l'examen théorique belge avec les panneaux, des leçons structurées, un entraînement ciblé et un tableau de bord clair.",
      keywords: SHARED_KEYWORDS,
      openGraphTitle: "ReadyRoad | préparation à l'examen théorique belge",
      openGraphDescription:
        "Étudiez les panneaux, révisez la théorie, entraînez-vous par catégorie et suivez vos progrès au même endroit.",
    },
    layoutMetadata: {
      defaultTitle: "ReadyRoad | préparation à l'examen théorique belge",
      description:
        "ReadyRoad aide les apprenants à préparer l'examen théorique belge grâce aux panneaux, aux leçons, à l'entraînement chronométré et au suivi des progrès.",
      keywords: SHARED_KEYWORDS,
      openGraphDescription:
        "Entraînez-vous sur la théorie belge, étudiez les panneaux et suivez vos progrès depuis un tableau de bord unique.",
      twitterDescription:
        "Travaillez la théorie, étudiez les panneaux et suivez vos progrès avec ReadyRoad.",
      organizationDescription:
        "ReadyRoad est une plateforme d'apprentissage indépendante dédiée à la préparation de l'examen théorique belge.",
      websiteDescription:
        "Plateforme de préparation à l'examen théorique belge.",
      softwareDescription:
        "Préparez l'examen théorique belge avec des parcours d'entraînement, des panneaux, des leçons et des analyses de progression.",
    },
  },
  nl: {
    sharedOgAlt: "ReadyRoad | voorbereiding op het Belgische theorie-examen",
    homeMetadata: {
      title: "ReadyRoad | voorbereiding op het Belgische theorie-examen",
      description:
        "Bereid je voor op het Belgische theorie-examen met verkeersborden, gestructureerde lessen, gerichte oefening en een duidelijk voortgangsdashboard.",
      keywords: SHARED_KEYWORDS,
      openGraphTitle:
        "ReadyRoad | voorbereiding op het Belgische theorie-examen",
      openGraphDescription:
        "Bestudeer verkeersborden, herhaal theorielessen, oefen per categorie en volg je vooruitgang op één plek.",
    },
    layoutMetadata: {
      defaultTitle: "ReadyRoad | voorbereiding op het Belgische theorie-examen",
      description:
        "ReadyRoad helpt leerlingen zich voor te bereiden op het Belgische theorie-examen met verkeersborden, lessen, getimede oefening en voortgangsinzichten.",
      keywords: SHARED_KEYWORDS,
      openGraphDescription:
        "Oefen Belgische theoriethema's, bestudeer verkeersborden en volg je vooruitgang vanuit één dashboard.",
      twitterDescription:
        "Oefen theorieonderwerpen, bestudeer verkeersborden en volg je vooruitgang met ReadyRoad.",
      organizationDescription:
        "ReadyRoad is een onafhankelijk leerplatform voor de voorbereiding op het Belgische theorie-examen.",
      websiteDescription:
        "Platform voor voorbereiding op het Belgische theorie-examen.",
      softwareDescription:
        "Bereid je voor op het Belgische theorie-examen met oefentrajecten, verkeersborden, lessen en voortgangsanalyse.",
    },
  },
};

export function resolveSiteLocale(locale?: string | null): SiteLocale {
  return locale && locale in SITE_COPY
    ? (locale as SiteLocale)
    : DEFAULT_SITE_LOCALE;
}

export function getLayoutMetadataCopy(locale: SiteLocale) {
  return SITE_COPY[locale].layoutMetadata;
}

export function getHomeMetadataCopy(locale: SiteLocale) {
  return SITE_COPY[locale].homeMetadata;
}

export function getOpenGraphLocale(locale: SiteLocale): string {
  return OPEN_GRAPH_LOCALES[locale];
}

export function getAlternateOpenGraphLocales(locale: SiteLocale): string[] {
  return (Object.keys(OPEN_GRAPH_LOCALES) as SiteLocale[])
    .filter((key) => key !== locale)
    .map((key) => OPEN_GRAPH_LOCALES[key]);
}

export function getSharedOgImage(locale: SiteLocale) {
  return {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: SITE_COPY[locale].sharedOgAlt,
  };
}

export function createOrganizationSchema(appUrl: string, locale: SiteLocale) {
  const copy = getLayoutMetadataCopy(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${appUrl}/#organization`,
    name: "ReadyRoad",
    url: appUrl,
    logo: {
      "@type": "ImageObject",
      url: `${appUrl}/images/logo.png`,
      width: 512,
      height: 512,
    },
    description: copy.organizationDescription,
    areaServed: {
      "@type": "Country",
      name: "Belgium",
    },
    availableLanguage: ["English", "Dutch", "French", "Arabic"],
    founder: {
      "@type": "Person",
      name: "Haydar Tarek",
      sameAs: [
        "https://github.com/haydartarek",
        "https://www.linkedin.com/in/haydartarek-dev/",
      ],
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${appUrl}/contact`,
      availableLanguage: ["English", "Dutch", "French", "Arabic"],
    },
  };
}

export function createWebsiteSchema(appUrl: string, locale: SiteLocale) {
  const copy = getLayoutMetadataCopy(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${appUrl}/#website`,
    url: appUrl,
    name: "ReadyRoad",
    description: copy.websiteDescription,
    publisher: {
      "@id": `${appUrl}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${appUrl}/traffic-signs?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["en", "nl", "fr", "ar"],
  };
}

export function createEducationalAppSchema(appUrl: string, locale: SiteLocale) {
  const copy = getLayoutMetadataCopy(locale);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ReadyRoad",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: appUrl,
    description: copy.softwareDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    inLanguage: ["en", "nl", "fr", "ar"],
    availableOnDevice: "Desktop, Mobile",
    publisher: {
      "@id": `${appUrl}/#organization`,
    },
  };
}
