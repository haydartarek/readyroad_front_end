import type { SiteLocale } from "@/lib/site-copy";

export type SeoIntentPage =
  | "home"
  | "practice"
  | "signExam"
  | "theoryExam"
  | "trafficSigns"
  | "lessons";

type SeoIntentLink = {
  href: string;
  label: string;
};

export type SeoIntentCopy = {
  kicker: string;
  heading: string;
  body: string;
  relatedLabel: string;
  links: SeoIntentLink[];
};

const COPY: Record<SiteLocale, Record<SeoIntentPage, SeoIntentCopy>> = {
  en: {
    home: {
      kicker: "Belgian category B theory",
      heading: "Prepare for the Belgian driving theory test with lessons, practice and exam simulation",
      body: "RijVia brings Belgian driving theory lessons, category B practice questions, Belgian traffic signs and a realistic theory practice test together in one multilingual learning platform.",
      relatedLabel: "Choose how you want to prepare",
      links: [
        { href: "/lessons", label: "Belgian driving theory lessons" },
        { href: "/practice", label: "Belgian driving theory practice" },
        { href: "/traffic-signs", label: "Belgian traffic signs and meanings" },
        { href: "/exam", label: "Belgian driving theory practice test" },
      ],
    },
    practice: {
      kicker: "Practice by topic",
      heading: "Practice Belgian driving theory questions by topic",
      body: "Use category B theory practice to work on Belgian traffic rules and focused practice questions before moving to a full exam simulation.",
      relatedLabel: "Continue your Belgian theory preparation",
      links: [
        { href: "/lessons", label: "Study Belgian driving theory lessons" },
        { href: "/practice/random", label: "Take the Belgian traffic signs test" },
        { href: "/exam", label: "Try the Belgian driving theory practice test" },
      ],
    },
    signExam: {
      kicker: "Traffic sign practice",
      heading: "Belgian traffic signs test and road signs quiz",
      body: "Test Belgian road signs with 50 mixed traffic-sign questions. Use this traffic signs practice to check recognition and meaning before reviewing the full sign library.",
      relatedLabel: "Study and practise traffic signs",
      links: [
        { href: "/traffic-signs", label: "Review Belgian traffic signs and meanings" },
        { href: "/practice", label: "Practice Belgian theory by topic" },
        { href: "/exam", label: "Take a full Belgian theory practice test" },
      ],
    },
    theoryExam: {
      kicker: "50-question simulation",
      heading: "Belgian driving theory practice test with 50 questions",
      body: "Use the RijVia Belgian theory exam simulation as a mock driving theory test for category B. Practise the 50-question format, timed answers and the 41 out of 50 pass target.",
      relatedLabel: "Prepare before your practice test",
      links: [
        { href: "/practice", label: "Practice Belgian driving theory questions" },
        { href: "/lessons", label: "Review Belgian driving theory lessons" },
        { href: "/traffic-signs", label: "Study Belgian traffic signs" },
      ],
    },
    trafficSigns: {
      kicker: "Road sign reference",
      heading: "Belgian traffic signs: meanings, explanations and categories",
      body: "Browse Belgian road signs by family and learn what each traffic sign means for drivers. This reference is for studying meanings and explanations; the separate traffic signs test is for practice.",
      relatedLabel: "Use the traffic-sign resources",
      links: [
        { href: "/practice/random", label: "Take the Belgian traffic signs test" },
        { href: "/lessons", label: "Learn Belgian road rules" },
        { href: "/practice", label: "Practice Belgian driving theory" },
      ],
    },
    lessons: {
      kicker: "Theory and road rules",
      heading: "Belgian driving theory lessons and Belgian road rules",
      body: "Learn category B theory with structured lessons about Belgian traffic rules, priority, speed, parking, safety and road signs before testing your knowledge in practice.",
      relatedLabel: "Turn lessons into practice",
      links: [
        { href: "/practice", label: "Practice Belgian theory questions" },
        { href: "/traffic-signs", label: "Study Belgian traffic signs" },
        { href: "/exam", label: "Try a Belgian theory practice test" },
      ],
    },
  },
  nl: {
    home: {
      kicker: "Belgische theorie rijbewijs B",
      heading: "Theorie rijbewijs B België: leren, oefenen en proefexamen",
      body: "RijVia bundelt Belgische verkeersregels, theorielessen, theorievragen oefenen, verkeersborden en een proefexamen voor rijbewijs B in één meertalig leerplatform.",
      relatedLabel: "Kies hoe je wilt voorbereiden",
      links: [
        { href: "/lessons", label: "Theorie rijbewijs B leren" },
        { href: "/practice", label: "Theorie rijbewijs B oefenen" },
        { href: "/traffic-signs", label: "Verkeersborden België betekenis" },
        { href: "/exam", label: "Proefexamen rijbewijs B" },
      ],
    },
    practice: {
      kicker: "Oefenen per onderwerp",
      heading: "Theorie rijbewijs B oefenen per onderwerp",
      body: "Oefen theorievragen en oefenvragen voor rijbewijs B per onderwerp. Versterk je Belgische rijtheorie en stap daarna over naar verkeersborden oefenen of een volledig proefexamen.",
      relatedLabel: "Ga verder met je rijtheorie",
      links: [
        { href: "/lessons", label: "Belgische rijtheorie leren" },
        { href: "/practice/random", label: "Verkeersborden oefenen België" },
        { href: "/exam", label: "Proefexamen rijbewijs B maken" },
      ],
    },
    signExam: {
      kicker: "Verkeersborden oefenen",
      heading: "Verkeersborden oefenen België met een verkeersborden test",
      body: "Test je kennis met 50 vragen in een Belgische verkeersborden quiz voor rijbewijs B. Oefen herkenning en betekenis en bekijk daarna de volledige verkeersbordenbibliotheek.",
      relatedLabel: "Leer en oefen Belgische verkeersborden",
      links: [
        { href: "/traffic-signs", label: "Betekenis van Belgische verkeersborden" },
        { href: "/practice", label: "Theorievragen oefenen per onderwerp" },
        { href: "/exam", label: "Theorie-examen oefenen met een proefexamen" },
      ],
    },
    theoryExam: {
      kicker: "Theorie-examensimulatie",
      heading: "Proefexamen rijbewijs B België: oefen het theorie-examen",
      body: "Maak een RijVia-proefexamen met 50 vragen als theorie-examensimulatie voor rijbewijs B. Oefen de vraagvorm, antwoordtijd en de slaaggrens van 41 op 50.",
      relatedLabel: "Bereid je voor op het proefexamen",
      links: [
        { href: "/practice", label: "Theorie rijbewijs B oefenen" },
        { href: "/lessons", label: "Theorie rijbewijs B leren" },
        { href: "/traffic-signs", label: "Belgische verkeersborden leren" },
      ],
    },
    trafficSigns: {
      kicker: "Betekenis en uitleg",
      heading: "Verkeersborden België: betekenis, uitleg en categorieën",
      body: "Bekijk Belgische verkeersborden per familie en leer de betekenis en uitleg voor bestuurders. Deze pagina is bedoeld als naslagwerk; voor verkeersborden oefenen gebruik je de aparte test.",
      relatedLabel: "Verder met verkeersborden en theorie",
      links: [
        { href: "/practice/random", label: "Verkeersborden oefenen België" },
        { href: "/lessons", label: "Belgische verkeersregels leren" },
        { href: "/practice", label: "Theorievragen oefenen" },
      ],
    },
    lessons: {
      kicker: "Rijtheorie leren",
      heading: "Theorie rijbewijs B België: lessen en Belgische verkeersregels",
      body: "Leer Belgische verkeersregels in gestructureerde rijtheorielessen over voorrang, snelheid, parkeren, veiligheid en verkeersborden voordat je begint te oefenen.",
      relatedLabel: "Van theorie naar oefenen",
      links: [
        { href: "/practice", label: "Theorie rijbewijs B oefenen" },
        { href: "/traffic-signs", label: "Verkeersborden België leren" },
        { href: "/exam", label: "Proefexamen rijbewijs B" },
      ],
    },
  },
  fr: {
    home: {
      kicker: "Théorie permis B en Belgique",
      heading: "Préparer l’examen théorique permis B en Belgique",
      body: "RijVia réunit le code de la route belge, des cours de théorie, des exercices permis B, les panneaux de signalisation et un examen blanc dans une plateforme multilingue.",
      relatedLabel: "Choisissez votre méthode de préparation",
      links: [
        { href: "/lessons", label: "Cours théorie permis B Belgique" },
        { href: "/practice", label: "Exercices théorie permis B Belgique" },
        { href: "/traffic-signs", label: "Panneaux de signalisation Belgique" },
        { href: "/exam", label: "Examen blanc permis B Belgique" },
      ],
    },
    practice: {
      kicker: "Exercices par thème",
      heading: "Exercices théorie permis B Belgique par thème",
      body: "Entraînez-vous avec des questions d’exercice du permis B et des exercices du code de la route belge par thème avant de passer à une simulation complète.",
      relatedLabel: "Poursuivez votre préparation théorique",
      links: [
        { href: "/lessons", label: "Cours de théorie permis B" },
        { href: "/practice/random", label: "Test panneaux de signalisation Belgique" },
        { href: "/exam", label: "Examen blanc permis B Belgique" },
      ],
    },
    signExam: {
      kicker: "Test de panneaux",
      heading: "Test panneaux de signalisation Belgique et quiz permis B",
      body: "Testez-vous avec 50 questions sur les panneaux routiers belges. Ce quiz de panneaux permis B vérifie la reconnaissance et la signification avant la révision du catalogue complet.",
      relatedLabel: "Étudiez et testez les panneaux",
      links: [
        { href: "/traffic-signs", label: "Signification des panneaux routiers belges" },
        { href: "/practice", label: "Exercices du code de la route Belgique" },
        { href: "/exam", label: "Simulation examen théorique permis B" },
      ],
    },
    theoryExam: {
      kicker: "Simulation de 50 questions",
      heading: "Examen blanc permis B Belgique : simulation de 50 questions",
      body: "Passez un examen blanc RijVia comme simulation de l’examen théorique permis B en ligne. Entraînez-vous au format de 50 questions, au temps de réponse et au seuil de 41 sur 50.",
      relatedLabel: "Préparez votre examen blanc",
      links: [
        { href: "/practice", label: "Exercices théorie permis B Belgique" },
        { href: "/lessons", label: "Cours théorie permis B Belgique" },
        { href: "/traffic-signs", label: "Panneaux de signalisation Belgique" },
      ],
    },
    trafficSigns: {
      kicker: "Signification des panneaux",
      heading: "Panneaux de signalisation Belgique : signification et explications",
      body: "Consultez les panneaux routiers belges par famille et apprenez leur signification pour les conducteurs. Cette page sert de référence; le test de panneaux séparé sert à l’entraînement.",
      relatedLabel: "Continuer avec les panneaux et la théorie",
      links: [
        { href: "/practice/random", label: "Test panneaux de signalisation Belgique" },
        { href: "/lessons", label: "Code de la route belge" },
        { href: "/practice", label: "Exercices théorie permis B" },
      ],
    },
    lessons: {
      kicker: "Cours et code de la route",
      heading: "Cours théorie permis B Belgique et code de la route belge",
      body: "Étudiez les règles de circulation belges dans des leçons structurées sur les priorités, la vitesse, le stationnement, la sécurité et les panneaux avant de vous entraîner.",
      relatedLabel: "Passez des cours aux exercices",
      links: [
        { href: "/practice", label: "Exercices théorie permis B Belgique" },
        { href: "/traffic-signs", label: "Panneaux routiers belges" },
        { href: "/exam", label: "Examen blanc permis B Belgique" },
      ],
    },
  },
  ar: {
    home: {
      kicker: "النظري البلجيكي بالعربية",
      heading: "الاستعداد لامتحان السياقة النظري في بلجيكا بالعربية",
      body: "يجمع RijVia دروس النظري وقواعد المرور البلجيكية بالعربية، والأسئلة التدريبية، والعلامات المرورية، ومحاكاة الامتحان. ويُعرف الامتحان لدى بعض المتعلمين أيضًا باسم امتحان التيوري (theorie-examen).",
      relatedLabel: "اختر طريقة الاستعداد",
      links: [
        { href: "/lessons", label: "تعليم السياقة في بلجيكا بالعربية" },
        { href: "/practice", label: "أسئلة تدريبية لامتحان السياقة النظري" },
        { href: "/traffic-signs", label: "العلامات المرورية في بلجيكا ومعانيها" },
        { href: "/exam", label: "أسئلة امتحان السياقة النظري في بلجيكا" },
      ],
    },
    practice: {
      kicker: "التدريب حسب الموضوع",
      heading: "أسئلة تدريبية لامتحان السياقة النظري في بلجيكا حسب الموضوع",
      body: "تدرّب على أسئلة رخصة السياقة في بلجيكا وأسئلة قواعد المرور البلجيكية حسب الموضوع، ثم انتقل إلى اختبار العلامات أو محاكاة الامتحان عندما تصبح جاهزًا.",
      relatedLabel: "واصل الاستعداد للامتحان",
      links: [
        { href: "/lessons", label: "دروس السياقة النظرية في بلجيكا" },
        { href: "/practice/random", label: "اختبار العلامات المرورية في بلجيكا" },
        { href: "/exam", label: "محاكاة امتحان السياقة النظري" },
      ],
    },
    signExam: {
      kicker: "اختبار إشارات المرور",
      heading: "اختبار العلامات المرورية في بلجيكا وأسئلة إشارات المرور",
      body: "اختبر معرفتك من خلال 50 سؤالًا عن العلامات المرورية البلجيكية وإشارات المرور في بلجيكا، ثم راجع معاني العلامات من المكتبة الكاملة.",
      relatedLabel: "تعلّم العلامات ثم اختبر نفسك",
      links: [
        { href: "/traffic-signs", label: "معاني العلامات المرورية في بلجيكا" },
        { href: "/practice", label: "أسئلة قواعد المرور البلجيكية" },
        { href: "/exam", label: "اختبار السياقة النظري في بلجيكا" },
      ],
    },
    theoryExam: {
      kicker: "محاكاة من 50 سؤالًا",
      heading: "محاكاة امتحان السياقة النظري في بلجيكا من 50 سؤالًا",
      body: "اختبر نفسك بامتحان تجريبي للسياقة في بلجيكا يحاكي صيغة 50 سؤالًا ووقت الإجابة ودرجة النجاح 41 من 50. وإذا كنت تبحث عن امتحان تيوري بلجيكا، فهذه هي صفحة المحاكاة الكاملة في RijVia.",
      relatedLabel: "راجع قبل الامتحان التجريبي",
      links: [
        { href: "/practice", label: "أسئلة امتحان السياقة النظري في بلجيكا" },
        { href: "/lessons", label: "قواعد المرور البلجيكية بالعربية" },
        { href: "/traffic-signs", label: "العلامات المرورية البلجيكية" },
      ],
    },
    trafficSigns: {
      kicker: "معاني إشارات المرور",
      heading: "العلامات المرورية في بلجيكا: المعاني والشرح بالعربية",
      body: "تعرّف على علامات وإشارات المرور في بلجيكا حسب الفئة، واقرأ معنى كل علامة وشرحها للسائق. هذه الصفحة للمعاني والمراجعة، أما اختبار العلامات فله صفحة تدريب مستقلة.",
      relatedLabel: "انتقل بين شرح العلامات والتدريب",
      links: [
        { href: "/practice/random", label: "اختبار إشارات المرور في بلجيكا" },
        { href: "/lessons", label: "تعليم قواعد المرور البلجيكية بالعربية" },
        { href: "/practice", label: "التدريب على أسئلة السياقة في بلجيكا" },
      ],
    },
    lessons: {
      kicker: "تعليم النظري بالعربية",
      heading: "تعليم السياقة في بلجيكا بالعربية: دروس النظري وقواعد المرور",
      body: "تعلّم قواعد المرور البلجيكية بالعربية من خلال دروس منظمة عن الأولوية والسرعة والوقوف والسلامة والعلامات المرورية قبل الانتقال إلى الأسئلة والاختبارات.",
      relatedLabel: "حوّل الدروس إلى تدريب عملي",
      links: [
        { href: "/practice", label: "أسئلة رخصة السياقة في بلجيكا" },
        { href: "/traffic-signs", label: "العلامات المرورية في بلجيكا" },
        { href: "/exam", label: "امتحان تجريبي للسياقة في بلجيكا" },
      ],
    },
  },
};

export function getSeoIntentCopy(
  locale: SiteLocale,
  page: SeoIntentPage,
): SeoIntentCopy {
  return COPY[locale][page];
}
