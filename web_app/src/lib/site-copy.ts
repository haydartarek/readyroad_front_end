import { buildLocalizedUrl } from "@/lib/i18n-routing";

export type SiteLocale = "en" | "ar" | "fr" | "nl";

export const DEFAULT_APP_URL = "https://rijvia.be";
export const DEFAULT_SITE_LOCALE: SiteLocale = "en";

const SHARED_KEYWORDS = [
  "Belgian driving license exam",
  "Belgian driving theory test",
  "traffic signs Belgium",
  "RijVia",
  "rijbewijs theorie examen",
  "rijexamen oefenen",
  "verkeerstekens België",
  "permis de conduire belgique",
  "examen théorique permis conduire",
  "panneaux signalisation belgique",
  "رخصة السياقة في بلجيكا",
  "امتحان السياقة في بلجيكا",
  "العلامات المرورية البلجيكية",
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
    sharedOgAlt: "RijVia | Belgian driving theory exam preparation",
    homeMetadata: {
      title: "RijVia | Belgian Driving Theory Test Practice",
      description:
        "Prepare for the Belgian driving theory exam with traffic signs, structured lessons, focused practice, and one clear progress dashboard.",
      keywords: SHARED_KEYWORDS,
      openGraphTitle: "RijVia | Belgian Driving Theory Test Practice",
      openGraphDescription:
        "Study traffic signs, review theory lessons, practise by category, and track your progress in one place.",
    },
    layoutMetadata: {
      defaultTitle: "RijVia | Belgian Driving Theory Exam Preparation",
      description:
        "RijVia helps learners prepare for the Belgian driving theory exam with traffic signs, lessons, timed practice, and progress insights.",
      keywords: SHARED_KEYWORDS,
      openGraphDescription:
        "Practice Belgian theory topics, study traffic signs, and track your progress from one dashboard.",
      twitterDescription:
        "Practice theory topics, study traffic signs, and track your progress with RijVia.",
      organizationDescription:
        "RijVia is an independent learning platform for Belgian driving theory exam preparation.",
      websiteDescription: "Belgian driving theory exam preparation platform.",
      softwareDescription:
        "Prepare for the Belgian driving theory exam with practice flows, traffic signs, lessons, and progress analytics.",
    },
  },
  ar: {
    sharedOgAlt: "RijVia | الاستعداد لامتحان السياقة النظري في بلجيكا",
    homeMetadata: {
      title: "RijVia | امتحان السياقة النظري في بلجيكا",
      description:
        "استعد لامتحان السياقة النظري في بلجيكا من خلال الدروس والعلامات المرورية والاختبارات التدريبية، وتابع تقدمك في مكان واحد.",
      keywords: SHARED_KEYWORDS,
      openGraphTitle: "RijVia | امتحان السياقة النظري في بلجيكا",
      openGraphDescription:
        "تعلّم العلامات المرورية، واقرأ الدروس النظرية، وتدرّب حسب الفئة، وتابع تقدمك في مكان واحد.",
    },
    layoutMetadata: {
      defaultTitle: "RijVia | الاستعداد لامتحان السياقة النظري في بلجيكا",
      description:
        "يساعدك RijVia على الاستعداد لامتحان السياقة النظري في بلجيكا من خلال العلامات المرورية والدروس والتدريب ومتابعة التقدم.",
      keywords: SHARED_KEYWORDS,
      openGraphDescription:
        "تدرّب على مواضيع الامتحان النظري البلجيكي، وتعلّم العلامات المرورية، وتابع تقدمك من لوحة تحكم واحدة.",
      twitterDescription:
        "تدرّب على مواضيع الامتحان النظري، وتعلّم العلامات المرورية، وتابع تقدمك مع RijVia.",
      organizationDescription:
        "RijVia منصة تعليمية مستقلة للاستعداد لامتحان السياقة النظري في بلجيكا.",
      websiteDescription: "منصة للاستعداد لامتحان السياقة النظري في بلجيكا.",
      softwareDescription:
        "استعد لامتحان السياقة النظري في بلجيكا من خلال التدريب والعلامات المرورية والدروس ومتابعة التقدم.",
    },
  },
  fr: {
    sharedOgAlt: "RijVia | préparation à l'examen théorique belge",
    homeMetadata: {
      title: "RijVia | Examen théorique permis B Belgique",
      description:
        "Préparez l'examen théorique belge avec les panneaux, des leçons structurées, un entraînement ciblé et un tableau de bord clair.",
      keywords: SHARED_KEYWORDS,
      openGraphTitle: "RijVia | Examen théorique permis B Belgique",
      openGraphDescription:
        "Étudiez les panneaux, révisez la théorie, entraînez-vous par catégorie et suivez vos progrès au même endroit.",
    },
    layoutMetadata: {
      defaultTitle: "RijVia | préparation à l'examen théorique belge",
      description:
        "RijVia aide les apprenants à préparer l'examen théorique belge grâce aux panneaux, aux leçons, à l'entraînement chronométré et au suivi des progrès.",
      keywords: SHARED_KEYWORDS,
      openGraphDescription:
        "Entraînez-vous sur la théorie belge, étudiez les panneaux et suivez vos progrès depuis un tableau de bord unique.",
      twitterDescription:
        "Travaillez la théorie, étudiez les panneaux et suivez vos progrès avec RijVia.",
      organizationDescription:
        "RijVia est une plateforme d'apprentissage indépendante dédiée à la préparation de l'examen théorique belge.",
      websiteDescription:
        "Plateforme de préparation à l'examen théorique belge.",
      softwareDescription:
        "Préparez l'examen théorique belge avec des parcours d'entraînement, des panneaux, des leçons et des analyses de progression.",
    },
  },
  nl: {
    sharedOgAlt: "RijVia | voorbereiding op het Belgische theorie-examen",
    homeMetadata: {
      title: "RijVia | Theorie-examen rijbewijs B oefenen België",
      description:
        "Bereid je voor op het Belgische theorie-examen met verkeersborden, gestructureerde lessen, gerichte oefening en een duidelijk voortgangsdashboard.",
      keywords: SHARED_KEYWORDS,
      openGraphTitle:
        "RijVia | Theorie-examen rijbewijs B oefenen België",
      openGraphDescription:
        "Bestudeer verkeersborden, herhaal theorielessen, oefen per categorie en volg je vooruitgang op één plek.",
    },
    layoutMetadata: {
      defaultTitle: "RijVia | voorbereiding op het Belgische theorie-examen",
      description:
        "RijVia helpt leerlingen zich voor te bereiden op het Belgische theorie-examen met verkeersborden, lessen, getimede oefening en voortgangsinzichten.",
      keywords: SHARED_KEYWORDS,
      openGraphDescription:
        "Oefen Belgische theoriethema's, bestudeer verkeersborden en volg je vooruitgang vanuit één dashboard.",
      twitterDescription:
        "Oefen theorieonderwerpen, bestudeer verkeersborden en volg je vooruitgang met RijVia.",
      organizationDescription:
        "RijVia is een onafhankelijk leerplatform voor de voorbereiding op het Belgische theorie-examen.",
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
    name: "RijVia",
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
      url: buildLocalizedUrl("/contact", locale, appUrl),
      availableLanguage: ["English", "Dutch", "French", "Arabic"],
    },
  };
}

export function createWebsiteSchema(appUrl: string, locale: SiteLocale) {
  const copy = getLayoutMetadataCopy(locale);
  const localizedRoot = buildLocalizedUrl("/", locale, appUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${appUrl}/#website`,
    url: localizedRoot,
    name: "RijVia",
    description: copy.websiteDescription,
    publisher: {
      "@id": `${appUrl}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${buildLocalizedUrl("/traffic-signs", locale, appUrl)}?search={search_term_string}`,
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
    name: "RijVia",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: buildLocalizedUrl("/", locale, appUrl),
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
