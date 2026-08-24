import http from "node:http";

const port = Number(process.env.PLAYWRIGHT_BACKEND_PORT ?? 8899);
const lesson = {
  id: 20,
  lessonCode: "les-19",
  icon: "R",
  titleEn: "Priority to the Right",
  titleNl: "Voorrang van rechts",
  titleFr: "Priorite de droite",
  titleAr: "الأولوية من اليمين",
  descriptionEn: "Learn how priority to the right works in Belgium.",
  descriptionNl: "Leer hoe voorrang van rechts in Belgie werkt.",
  descriptionFr: "Apprenez comment fonctionne la priorite de droite en Belgique.",
  descriptionAr: "تعرّف إلى كيفية تطبيق قاعدة الأولوية من اليمين في بلجيكا.",
  displayOrder: 20,
  estimatedMinutes: 12,
  totalPages: 2,
  pages: [
    {
      id: 191,
      pageNumber: 1,
      titleEn: "The basic rule",
      titleNl: "De basisregel",
      titleFr: "La regle de base",
      titleAr: "القاعدة الأساسية",
      contentEn: "At an unsigned intersection, give way to traffic from the right.",
      contentNl: "Op een kruispunt zonder borden verleen je voorrang aan rechts.",
      contentFr: "A un carrefour sans signalisation, cedez le passage a droite.",
      contentAr: "عند تقاطع بلا إشارات، امنح الأولوية للقادم من اليمين.",
      bulletPointsEn: [],
      bulletPointsNl: [],
      bulletPointsFr: [],
      bulletPointsAr: [],
    },
    {
      id: 192,
      pageNumber: 2,
      titleEn: "Applying the rule",
      titleNl: "De regel toepassen",
      titleFr: "Appliquer la regle",
      titleAr: "تطبيق القاعدة",
      contentEn: "Check signs, markings and the direction of every road user.",
      contentNl: "Controleer borden, markeringen en de richting van elke weggebruiker.",
      contentFr: "Verifiez les panneaux, les marquages et la direction de chaque usager.",
      contentAr: "تحقق من العلامات والتخطيط واتجاه كل مستعمل للطريق.",
      bulletPointsEn: [],
      bulletPointsNl: [],
      bulletPointsFr: [],
      bulletPointsAr: [],
    },
  ],
};

const summary = Object.fromEntries(
  Object.entries(lesson).filter(([key]) => key !== "pages"),
);

const trafficSign = {
  id: 1,
  signCode: "A1b",
  routeCode: "A1b",
  categoryCode: "A",
  exam1TotalQuestions: 10,
  exam1PassingScore: 7,
  imageUrl: "/images/logo.png",
  nameEn: "Dangerous bend to the right",
  nameNl: "Gevaarlijke bocht naar rechts",
  nameFr: "Virage dangereux a droite",
  nameAr: "منعطف خطير إلى اليمين",
  summaryEn: "A dangerous right-hand bend lies ahead.",
  summaryNl: "Er volgt een gevaarlijke bocht naar rechts.",
  summaryFr: "Un virage dangereux a droite se trouve devant vous.",
  summaryAr: "يوجد منعطف خطير إلى اليمين أمامك.",
  descriptionEn: "Warns about a dangerous bend to the right.",
  descriptionNl: "Waarschuwt voor een gevaarlijke bocht naar rechts.",
  descriptionFr: "Avertit d'un virage dangereux a droite.",
  descriptionAr: "تحذر من منعطف خطير إلى اليمين.",
  driverGuidanceEn: "Reduce speed before the bend and keep control.",
  driverGuidanceNl: "Verminder snelheid voor de bocht en behoud de controle.",
  driverGuidanceFr: "Reduisez votre vitesse avant le virage et gardez le controle.",
  driverGuidanceAr: "خفف السرعة قبل المنعطف وحافظ على التحكم بالمركبة.",
  exceptionsEn: ["A supplementary plate may specify the distance."],
  exceptionsNl: ["Een onderbord kan de afstand aangeven."],
  exceptionsFr: ["Un panneau additionnel peut indiquer la distance."],
  exceptionsAr: ["قد تحدد لوحة إضافية المسافة."],
};

const articleSlugs = {
  EN: "safe-driving-belgium",
  NL: "veilig-rijden-belgie",
  FR: "conduite-sure-belgique",
  AR: "al-qiyada-al-amina",
};

const articleTitles = {
  EN: "Safer driving in Belgium",
  NL: "Veiliger rijden in België",
  FR: "Conduire plus sûrement en Belgique",
  AR: "القيادة الآمنة في بلجيكا",
};

function publishedArticle(language) {
  return {
    language,
    slug: articleSlugs[language],
    title: articleTitles[language],
    summary: `${articleTitles[language]} published summary`,
    metaTitle: `${articleTitles[language]} | RijVia`,
    metaDescription: `${articleTitles[language]} reviewed metadata description.`,
    body: "Immutable published body.\n\nSecond reviewed paragraph.",
    publishedAt: "2026-08-22T10:00:00Z",
    alternateSlugs: articleSlugs,
    internalLinks: [],
  };
}

const server = http.createServer((request, response) => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  if (request.url === "/api/lessons") {
    response.end(JSON.stringify([summary]));
    return;
  }

  if (request.url === "/api/lessons/les-19") {
    response.end(JSON.stringify(lesson));
    return;
  }

  if (request.url === "/api/traffic-signs") {
    response.end("[]");
    return;
  }

  if (request.url === "/api/traffic-signs/A1b") {
    response.end(JSON.stringify(trafficSign));
    return;
  }

  if (request.url === "/api/home/stats") {
    response.end(
      JSON.stringify({
        examQuestionCount: 0,
        trafficSignsCount: 0,
        lessonsCount: 1,
        categoriesCount: 0,
        supportedLanguagesCount: 4,
      }),
    );
    return;
  }

  const requestUrl = new URL(request.url, `http://127.0.0.1:${port}`);
  if (requestUrl.pathname === "/api/articles") {
    const language = requestUrl.searchParams.get("language") ?? "EN";
    const article = articleSlugs[language] ? publishedArticle(language) : null;
    response.end(JSON.stringify(article ? [{
      language: article.language,
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      publishedAt: article.publishedAt,
      alternateSlugs: article.alternateSlugs,
    }] : []));
    return;
  }

  const articleMatch = requestUrl.pathname.match(/^\/api\/articles\/([^/]+)$/);
  if (articleMatch) {
    const language = requestUrl.searchParams.get("language") ?? "EN";
    const requestedSlug = decodeURIComponent(articleMatch[1]);
    const knownSlug = Object.values(articleSlugs).includes(requestedSlug);
    if (articleSlugs[language] && knownSlug && requestedSlug !== "unpublished") {
      response.end(JSON.stringify(publishedArticle(language)));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ message: "Not found" }));
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ message: "Not found" }));
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Playwright backend listening on ${port}\n`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
