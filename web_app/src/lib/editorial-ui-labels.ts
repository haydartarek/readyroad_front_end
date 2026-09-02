type SupportedUiLanguage = "ar" | "nl" | "fr" | "en";
type LocalizedText = Record<SupportedUiLanguage, string>;
export type EditorialStrategyOptionKind =
  | "USP"
  | "ICP"
  | "CONTENT_PILLAR"
  | "FUNNEL_STAGE"
  | "CONVERSION_GOAL";

function language(value: string): SupportedUiLanguage {
  const normalized = String(value ?? "en").toLowerCase();

  if (
    normalized === "ar" ||
    normalized === "nl" ||
    normalized === "fr" ||
    normalized === "en"
  ) {
    return normalized;
  }

  return "en";
}

const lifecycleLabels: Record<
  SupportedUiLanguage,
  Record<string, string>
> = {
  ar: {
    IDEA: "فكرة",
    PLANNED: "مخطط",
    BRIEF_READY: "ملخص المقال جاهز",
    DRAFTING: "جار إنشاء المسودة",
    DRAFT_READY: "المسودة جاهزة",
    FACT_CHECK_REQUIRED: "التحقق من الحقائق مطلوب",
    LEGAL_REVIEW_REQUIRED: "المراجعة القانونية مطلوبة",
    TRANSLATION_REQUIRED: "الترجمة مطلوبة",
    IMAGE_REQUIRED: "الصورة مطلوبة",
    WAITING_APPROVAL: "بانتظار الموافقة",
    APPROVED: "معتمد",
    SCHEDULED: "مجدول",
    PUBLISHED: "منشور",
    UPDATE_RECOMMENDED: "يوصى بالتحديث",
    ARCHIVED: "مؤرشف",
    REJECTED: "مرفوض",
  },

  nl: {
    IDEA: "Idee",
    PLANNED: "Gepland",
    BRIEF_READY: "Artikelbrief klaar",
    DRAFTING: "Concept wordt gemaakt",
    DRAFT_READY: "Concept klaar",
    FACT_CHECK_REQUIRED: "Feitencontrole vereist",
    LEGAL_REVIEW_REQUIRED: "Juridische controle vereist",
    TRANSLATION_REQUIRED: "Vertaling vereist",
    IMAGE_REQUIRED: "Afbeelding vereist",
    WAITING_APPROVAL: "Wacht op goedkeuring",
    APPROVED: "Goedgekeurd",
    SCHEDULED: "Ingepland",
    PUBLISHED: "Gepubliceerd",
    UPDATE_RECOMMENDED: "Update aanbevolen",
    ARCHIVED: "Gearchiveerd",
    REJECTED: "Afgewezen",
  },

  fr: {
    IDEA: "Idée",
    PLANNED: "Planifié",
    BRIEF_READY: "Brief de l'article prêt",
    DRAFTING: "Rédaction en cours",
    DRAFT_READY: "Brouillon prêt",
    FACT_CHECK_REQUIRED: "Vérification des faits requise",
    LEGAL_REVIEW_REQUIRED: "Vérification juridique requise",
    TRANSLATION_REQUIRED: "Traduction requise",
    IMAGE_REQUIRED: "Image requise",
    WAITING_APPROVAL: "En attente d'approbation",
    APPROVED: "Approuvé",
    SCHEDULED: "Programmé",
    PUBLISHED: "Publié",
    UPDATE_RECOMMENDED: "Mise à jour recommandée",
    ARCHIVED: "Archivé",
    REJECTED: "Rejeté",
  },

  en: {
    IDEA: "Idea",
    PLANNED: "Planned",
    BRIEF_READY: "Article brief ready",
    DRAFTING: "Draft in progress",
    DRAFT_READY: "Draft ready",
    FACT_CHECK_REQUIRED: "Fact check required",
    LEGAL_REVIEW_REQUIRED: "Legal review required",
    TRANSLATION_REQUIRED: "Translation required",
    IMAGE_REQUIRED: "Image required",
    WAITING_APPROVAL: "Waiting for approval",
    APPROVED: "Approved",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    UPDATE_RECOMMENDED: "Update recommended",
    ARCHIVED: "Archived",
    REJECTED: "Rejected",
  },
};

const qualityGateLabels: Record<
  SupportedUiLanguage,
  Record<string, string>
> = {
  ar: {
    USEFUL_DEPTH: "عمق المحتوى المفيد",
    HUMAN_READABILITY: "سهولة القراءة",
    SEARCH_INTENT: "نية البحث",
    SOURCE_VERIFICATION: "التحقق من المصادر",
    LEGAL_CONSISTENCY: "الاتساق القانوني",
    REGIONAL_ACCURACY: "الدقة الإقليمية",
    TRANSLATION_QUALITY: "جودة الترجمة",
    DUPLICATE_CHECK: "فحص التكرار",
    CANNIBALIZATION_CHECK: "فحص تنافس المحتوى الداخلي",
    INTERNAL_LINKS: "الروابط الداخلية",
    IMAGE_LICENSE: "ترخيص الصورة",
    IMAGE_RELEVANCE: "ملاءمة الصورة",
    IMAGE_OPTIMIZATION: "تحسين الصورة",
    ALT_TEXT: "النص البديل",
    METADATA: "البيانات الوصفية",
    STRUCTURED_DATA: "البيانات المنظمة",
    MOBILE_PREVIEW: "معاينة الهاتف",
    NO_BROKEN_LINKS: "لا توجد روابط معطلة",
    NO_MISLEADING_CLAIMS: "لا توجد ادعاءات مضللة",
    NO_KEYWORD_STUFFING: "لا يوجد حشو للكلمات المفتاحية",
    NO_INVENTED_FACTS: "لا توجد حقائق مختلقة",
    NO_UNSUPPORTED_LEGAL_CLAIMS: "لا توجد ادعاءات قانونية غير مدعومة",
  },

  nl: {
    USEFUL_DEPTH: "Nuttige inhoudsdiepte",
    HUMAN_READABILITY: "Leesbaarheid",
    SEARCH_INTENT: "Zoekintentie",
    SOURCE_VERIFICATION: "Bronverificatie",
    LEGAL_CONSISTENCY: "Juridische consistentie",
    REGIONAL_ACCURACY: "Regionale nauwkeurigheid",
    TRANSLATION_QUALITY: "Vertaalkwaliteit",
    DUPLICATE_CHECK: "Controle op duplicaten",
    CANNIBALIZATION_CHECK: "Controle op contentkannibalisatie",
    INTERNAL_LINKS: "Interne links",
    IMAGE_LICENSE: "Afbeeldingslicentie",
    IMAGE_RELEVANCE: "Relevantie van afbeelding",
    IMAGE_OPTIMIZATION: "Afbeeldingsoptimalisatie",
    ALT_TEXT: "Alternatieve tekst",
    METADATA: "Metadata",
    STRUCTURED_DATA: "Gestructureerde gegevens",
    MOBILE_PREVIEW: "Mobiele preview",
    NO_BROKEN_LINKS: "Geen gebroken links",
    NO_MISLEADING_CLAIMS: "Geen misleidende claims",
    NO_KEYWORD_STUFFING: "Geen keyword stuffing",
    NO_INVENTED_FACTS: "Geen verzonnen feiten",
    NO_UNSUPPORTED_LEGAL_CLAIMS: "Geen onbevestigde juridische claims",
  },

  fr: {
    USEFUL_DEPTH: "Profondeur utile du contenu",
    HUMAN_READABILITY: "Lisibilité",
    SEARCH_INTENT: "Intention de recherche",
    SOURCE_VERIFICATION: "Vérification des sources",
    LEGAL_CONSISTENCY: "Cohérence juridique",
    REGIONAL_ACCURACY: "Exactitude régionale",
    TRANSLATION_QUALITY: "Qualité de traduction",
    DUPLICATE_CHECK: "Contrôle des doublons",
    CANNIBALIZATION_CHECK: "Contrôle de cannibalisation du contenu",
    INTERNAL_LINKS: "Liens internes",
    IMAGE_LICENSE: "Licence de l'image",
    IMAGE_RELEVANCE: "Pertinence de l'image",
    IMAGE_OPTIMIZATION: "Optimisation de l'image",
    ALT_TEXT: "Texte alternatif",
    METADATA: "Métadonnées",
    STRUCTURED_DATA: "Données structurées",
    MOBILE_PREVIEW: "Aperçu mobile",
    NO_BROKEN_LINKS: "Aucun lien cassé",
    NO_MISLEADING_CLAIMS: "Aucune affirmation trompeuse",
    NO_KEYWORD_STUFFING: "Aucun bourrage de mots-clés",
    NO_INVENTED_FACTS: "Aucun fait inventé",
    NO_UNSUPPORTED_LEGAL_CLAIMS: "Aucune affirmation juridique non étayée",
  },

  en: {
    USEFUL_DEPTH: "Useful content depth",
    HUMAN_READABILITY: "Human readability",
    SEARCH_INTENT: "Search intent",
    SOURCE_VERIFICATION: "Source verification",
    LEGAL_CONSISTENCY: "Legal consistency",
    REGIONAL_ACCURACY: "Regional accuracy",
    TRANSLATION_QUALITY: "Translation quality",
    DUPLICATE_CHECK: "Duplicate check",
    CANNIBALIZATION_CHECK: "Content cannibalization check",
    INTERNAL_LINKS: "Internal links",
    IMAGE_LICENSE: "Image license",
    IMAGE_RELEVANCE: "Image relevance",
    IMAGE_OPTIMIZATION: "Image optimization",
    ALT_TEXT: "Alternative text",
    METADATA: "Metadata",
    STRUCTURED_DATA: "Structured data",
    MOBILE_PREVIEW: "Mobile preview",
    NO_BROKEN_LINKS: "No broken links",
    NO_MISLEADING_CLAIMS: "No misleading claims",
    NO_KEYWORD_STUFFING: "No keyword stuffing",
    NO_INVENTED_FACTS: "No invented facts",
    NO_UNSUPPORTED_LEGAL_CLAIMS: "No unsupported legal claims",
  },
};

const workflowLabels = {
  ar: {
    title: "سير عمل المقال",
    currentStage: "المرحلة الحالية",
    startFactCheck: "بدء التحقق من الحقائق",
    confirmFactCheck: "تأكيد اكتمال التحقق",
    confirmLegalReview: "تأكيد اكتمال المراجعة القانونية",
    continueToImage: "متابعة إلى صورة المقال",
    translationsCompleteConfirm: "النسخ الأربع متوفرة. هل تريد متابعة المقال إلى مرحلة الصورة؟",
    advance: "متابعة سير العمل",
    startFactCheckConfirm: "هل تريد نقل المسودة إلى مرحلة التحقق من الحقائق",
    factCheckConfirm: "هل تم التحقق من الحقائق والمصادر ويمكن متابعة المقال",
    legalReviewConfirm: "هل اكتملت المراجعة القانونية ويمكن متابعة المقال",
    advanced: "تم تحديث مرحلة المقال.",
  },

  nl: {
    title: "Artikelworkflow",
    currentStage: "Huidige fase",
    startFactCheck: "Feitencontrole starten",
    confirmFactCheck: "Feitencontrole bevestigen",
    confirmLegalReview: "Juridische controle bevestigen",
    continueToImage: "Doorgaan naar de artikelafbeelding",
    translationsCompleteConfirm: "Alle vier taalversies zijn beschikbaar. Doorgaan naar de afbeeldingsfase?",
    advance: "Workflow voortzetten",
    startFactCheckConfirm: "Wil je dit concept naar de feitencontrole verplaatsen?",
    factCheckConfirm: "Zijn de feiten en bronnen gecontroleerd?",
    legalReviewConfirm: "Is de juridische controle voltooid?",
    advanced: "De artikelfase is bijgewerkt.",
  },

  fr: {
    title: "Flux éditorial",
    currentStage: "Étape actuelle",
    startFactCheck: "Démarrer la vérification des faits",
    confirmFactCheck: "Confirmer la vérification des faits",
    confirmLegalReview: "Confirmer la vérification juridique",
    continueToImage: "Continuer vers l’image de l’article",
    translationsCompleteConfirm: "Les quatre versions linguistiques sont disponibles. Continuer vers l’étape de l’image ?",
    advance: "Continuer le processus",
    startFactCheckConfirm: "Passer ce brouillon à la vérification des faits ?",
    factCheckConfirm: "Les faits et les sources ont-ils été vérifiés ?",
    legalReviewConfirm: "La vérification juridique est-elle terminée ?",
    advanced: "L'étape de l'article a été mise à jour.",
  },

  en: {
    title: "Editorial workflow",
    currentStage: "Current stage",
    startFactCheck: "Start fact check",
    confirmFactCheck: "Confirm fact check",
    confirmLegalReview: "Confirm legal review",
    continueToImage: "Continue to article image",
    translationsCompleteConfirm: "All four language versions are available. Continue to the image stage?",
    advance: "Advance workflow",
    startFactCheckConfirm: "Move this draft to fact checking?",
    factCheckConfirm: "Have the facts and sources been verified?",
    legalReviewConfirm: "Has the legal review been completed?",
    advanced: "Editorial workflow updated.",
  },
} satisfies Record<SupportedUiLanguage, Record<string, string>>;

const taskStatusLabels: Record<string, LocalizedText> = {
  NOT_STARTED: { ar: "لم يبدأ", nl: "Niet gestart", fr: "Non démarré", en: "Not started" },
  PENDING: { ar: "قيد الانتظار", nl: "In afwachting", fr: "En attente", en: "Pending" },
  SCHEDULED: { ar: "مجدول", nl: "Ingepland", fr: "Programmé", en: "Scheduled" },
  WAITING_APPROVAL: { ar: "بانتظار الموافقة", nl: "Wacht op goedkeuring", fr: "En attente d'approbation", en: "Waiting for approval" },
  APPROVED: { ar: "معتمد", nl: "Goedgekeurd", fr: "Approuvé", en: "Approved" },
  RUNNING: { ar: "قيد التنفيذ", nl: "Wordt uitgevoerd", fr: "En cours", en: "Running" },
  COMPLETED: { ar: "مكتمل", nl: "Voltooid", fr: "Terminé", en: "Completed" },
  RETRY_SCHEDULED: { ar: "إعادة المحاولة مجدولة", nl: "Nieuwe poging ingepland", fr: "Nouvelle tentative planifiée", en: "Retry scheduled" },
  FAILED: { ar: "فشل", nl: "Mislukt", fr: "Échec", en: "Failed" },
  REJECTED: { ar: "مرفوض", nl: "Afgewezen", fr: "Rejeté", en: "Rejected" },
  CANCELLED: { ar: "ملغى", nl: "Geannuleerd", fr: "Annulé", en: "Cancelled" },
  DRAFT: { ar: "مسودة", nl: "Concept", fr: "Brouillon", en: "Draft" },
  CURRENT: { ar: "الحالي", nl: "Huidig", fr: "Actuel", en: "Current" },
};

const topicSourceLabels: Record<string, LocalizedText> = {
  OFFICIAL_STRATEGIC_BACKLOG: {
    ar: "قائمة المحتوى الاستراتيجية المعتمدة",
    nl: "Goedgekeurde strategische contentlijst",
    fr: "Liste éditoriale stratégique approuvée",
    en: "Approved strategic content backlog",
  },
  SEARCH_CONSOLE_OPPORTUNITY: {
    ar: "فرصة موثقة من Search Console",
    nl: "Geverifieerde Search Console-kans",
    fr: "Opportunité vérifiée dans Search Console",
    en: "Verified Search Console opportunity",
  },
};

const claimTypeLabels: Record<string, LocalizedText> = {
  FACTUAL: { ar: "معلومة واقعية", nl: "Feitelijke claim", fr: "Affirmation factuelle", en: "Factual claim" },
  PRODUCT_FACT: { ar: "معلومة عن RijVia", nl: "RijVia-productfeit", fr: "Fait sur RijVia", en: "RijVia product fact" },
  LEGAL: { ar: "معلومة قانونية", nl: "Juridische claim", fr: "Affirmation juridique", en: "Legal claim" },
  REGIONAL: { ar: "معلومة إقليمية", nl: "Regionale claim", fr: "Affirmation régionale", en: "Regional claim" },
  DATE_SENSITIVE: { ar: "معلومة مرتبطة بتاريخ", nl: "Tijdsgebonden claim", fr: "Information datée", en: "Date-sensitive claim" },
  STATISTIC: { ar: "إحصائية", nl: "Statistiek", fr: "Statistique", en: "Statistic" },
};

const evidenceSourceTypeLabels: Record<string, LocalizedText> = {
  RIJVIA_CORE_DATA: { ar: "بيانات RijVia الأساسية", nl: "RijVia-kerngegevens", fr: "Données principales de RijVia", en: "RijVia core data" },
  APPROVED_INTERNAL_SOURCE: { ar: "مصدر داخلي معتمد", nl: "Goedgekeurde interne bron", fr: "Source interne approuvée", en: "Approved internal source" },
  OFFICIAL_LEGAL_SOURCE: { ar: "مصدر قانوني رسمي", nl: "Officiële juridische bron", fr: "Source juridique officielle", en: "Official legal source" },
  OFFICIAL_GOVERNMENT_SOURCE: { ar: "مصدر حكومي رسمي", nl: "Officiële overheidsbron", fr: "Source gouvernementale officielle", en: "Official government source" },
  OFFICIAL_PUBLIC_AUTHORITY_SOURCE: { ar: "مصدر رسمي لهيئة عامة", nl: "Officiële bron van een overheidsinstantie", fr: "Source officielle d'une autorité publique", en: "Official public authority source" },
  APPROVED_REFERENCE_SOURCE: { ar: "مصدر مرجعي معتمد", nl: "Goedgekeurde referentiebron", fr: "Source de référence approuvée", en: "Approved reference source" },
};

const legalReviewStatusLabels: Record<string, LocalizedText> = {
  REQUIRES_REVIEW: { ar: "تتطلب مراجعة", nl: "Controle vereist", fr: "Vérification requise", en: "Requires review" },
  VERIFIED: { ar: "تم التحقق", nl: "Geverifieerd", fr: "Vérifié", en: "Verified" },
  NOT_REQUIRED: { ar: "غير مطلوبة", nl: "Niet vereist", fr: "Non requise", en: "Not required" },
};

const sourceLocationLabels: Record<string, LocalizedText> = {
  INTERNAL: { ar: "داخلي", nl: "intern", fr: "interne", en: "internal" },
  EXTERNAL: { ar: "خارجي", nl: "extern", fr: "externe", en: "external" },
};

const sourceTrustLabels: Record<string, LocalizedText> = {
  CORE_TRUSTED: { ar: "أساسية موثوقة", nl: "vertrouwde kernbron", fr: "source principale fiable", en: "trusted core" },
  OFFICIAL: { ar: "رسمية", nl: "officieel", fr: "officielle", en: "official" },
  APPROVED_REFERENCE: { ar: "مرجعية معتمدة", nl: "goedgekeurde referentie", fr: "référence approuvée", en: "approved reference" },
};

const strategyOptionLabels: Record<
  EditorialStrategyOptionKind,
  Record<string, LocalizedText>
> = {
  USP: {
    "1": { ar: "دعم أربع لغات", nl: "Ondersteuning voor vier talen", fr: "Prise en charge de quatre langues", en: "Four-language support" },
    "2": { ar: "محاكاة الامتحان", nl: "Examensimulatie", fr: "Simulation d'examen", en: "Exam simulation" },
    "3": { ar: "تعلم العلامات المرورية", nl: "Verkeersborden leren", fr: "Apprentissage des panneaux routiers", en: "Traffic-sign learning" },
    "4": { ar: "تحليل الفئات ونقاط الضعف", nl: "Analyse per categorie en zwakke punten", fr: "Analyse par catégorie et points faibles", en: "Category and weakness analysis" },
    "5": { ar: "تجربة محسنة للهاتف", nl: "Mobielgerichte ervaring", fr: "Expérience pensée pour le mobile", en: "Mobile-first experience" },
    "6": { ar: "تركيز على النظري البلجيكي", nl: "Focus op de Belgische rijtheorie", fr: "Centré sur la théorie belge", en: "Belgian driving theory focus" },
    "7": { ar: "شرح الإجابات الخاطئة", nl: "Uitleg bij foute antwoorden", fr: "Explication des mauvaises réponses", en: "Wrong-answer explanations" },
    "8": { ar: "متابعة تقدم المتعلم", nl: "Voortgang van de leerling volgen", fr: "Suivi de la progression", en: "Learner progress tracking" },
    "9": { ar: "دروس منظمة", nl: "Gestructureerde lessen", fr: "Leçons structurées", en: "Structured lessons" },
    "10": { ar: "منصة RijVia التعليمية", nl: "RijVia-leerplatform", fr: "Plateforme d'apprentissage RijVia", en: "RijVia learning platform" },
  },
  ICP: {
    "ICP-AR-BEGINNER": { ar: "متعلم ناطق بالعربية في بلجيكا يستعد للامتحان النظري", nl: "Arabischsprekende leerling in België die zich voorbereidt op het theorie-examen", fr: "Apprenant arabophone en Belgique préparant l'examen théorique", en: "Arabic-speaking learner in Belgium preparing for driving theory" },
    "ICP-FAILED-EXAM": { ar: "متعلم لم ينجح سابقًا ويحتاج إلى تحسين موجه", nl: "Leerling die eerder niet slaagde en gerichte verbetering nodig heeft", fr: "Apprenant ayant déjà échoué et nécessitant une amélioration ciblée", en: "Learner who previously failed and needs targeted improvement" },
    "ICP-FR-THEORY": { ar: "متعلم ناطق بالفرنسية يستعد للامتحان النظري البلجيكي", nl: "Franstalige leerling die zich voorbereidt op het Belgische theorie-examen", fr: "Apprenant francophone préparant l'examen théorique belge", en: "French-speaking learner preparing for the Belgian theory exam" },
    "ICP-NL-PRACTICE": { ar: "متعلم ناطق بالهولندية يبحث عن تدريب نظري بلجيكي إضافي", nl: "Nederlandstalige leerling die extra Belgische theorieoefeningen zoekt", fr: "Apprenant néerlandophone recherchant des exercices théoriques belges supplémentaires", en: "Dutch-speaking learner looking for additional Belgian theory practice" },
    "ICP-PRACTICAL-EXAM": { ar: "متعلم يستعد لامتحان السياقة العملي", nl: "Leerling die zich voorbereidt op het praktijkexamen", fr: "Apprenant préparant l'examen pratique de conduite", en: "Learner preparing for the practical driving examination" },
    "ICP-SIGN-SEARCH": { ar: "زائر يبحث عن علامة مرورية أو قاعدة بلجيكية محددة", nl: "Bezoeker die een specifiek Belgisch verkeersbord of een specifieke regel zoekt", fr: "Visiteur recherchant un panneau ou une règle belge précise", en: "Visitor searching for a specific Belgian traffic sign or rule" },
  },
  CONTENT_PILLAR: {
    THEORY_EXAM: { ar: "الامتحان النظري", nl: "Theorie-examen", fr: "Examen théorique", en: "Theory exam" },
    TRAFFIC_SIGNS: { ar: "العلامات المرورية", nl: "Verkeersborden", fr: "Panneaux de signalisation", en: "Traffic signs" },
    TRAFFIC_RULES: { ar: "قواعد المرور", nl: "Verkeersregels", fr: "Règles de circulation", en: "Traffic rules" },
    PRIORITY_INTERSECTIONS: { ar: "الأولوية والتقاطعات", nl: "Voorrang en kruispunten", fr: "Priorités et intersections", en: "Priority and intersections" },
    SPEED_PARKING_STOPPING: { ar: "السرعة والوقوف والتوقف", nl: "Snelheid, parkeren en stilstaan", fr: "Vitesse, stationnement et arrêt", en: "Speed, parking and stopping" },
    PRACTICAL_EXAM: { ar: "الامتحان العملي", nl: "Praktijkexamen", fr: "Examen pratique", en: "Practical exam" },
    COMMON_EXAM_ERRORS: { ar: "أخطاء الامتحان الشائعة", nl: "Veelgemaakte examenfouten", fr: "Erreurs fréquentes à l'examen", en: "Common exam errors" },
    PREPARATION_TIPS: { ar: "نصائح الاستعداد", nl: "Voorbereidingstips", fr: "Conseils de préparation", en: "Preparation tips" },
    BELGIAN_DRIVING_LICENCE: { ar: "رخصة السياقة البلجيكية", nl: "Belgisch rijbewijs", fr: "Permis de conduire belge", en: "Belgian driving licence" },
    BELGIAN_TRAFFIC_LAW_UPDATES: { ar: "تحديثات قوانين السير البلجيكية", nl: "Updates van Belgische verkeersregels", fr: "Mises à jour du code de la route belge", en: "Belgian traffic law updates" },
    TRAINING_TESTS: { ar: "التدريب والاختبارات", nl: "Oefeningen en examens", fr: "Entraînements et examens", en: "Training and tests" },
    RIJVIA_EDUCATIONAL_VIDEOS: { ar: "فيديوهات RijVia التعليمية", nl: "Educatieve video's van RijVia", fr: "Vidéos éducatives de RijVia", en: "RijVia educational videos" },
  },
  FUNNEL_STAGE: {
    AWARENESS: { ar: "الوعي", nl: "Bewustwording", fr: "Sensibilisation", en: "Awareness" },
    DISCOVERY: { ar: "الاستكشاف", nl: "Ontdekking", fr: "Découverte", en: "Discovery" },
    EDUCATION: { ar: "التعلم", nl: "Leren", fr: "Apprentissage", en: "Education" },
    PRACTICE: { ar: "التدريب", nl: "Oefenen", fr: "Entraînement", en: "Practice" },
    ACCOUNT_CONVERSION: { ar: "إنشاء الحساب", nl: "Account aanmaken", fr: "Création de compte", en: "Account conversion" },
    EXAM_USAGE: { ar: "استخدام الامتحان", nl: "Examengebruik", fr: "Utilisation de l'examen", en: "Exam usage" },
    RETENTION: { ar: "الاستمرارية", nl: "Terugkeer", fr: "Fidélisation", en: "Retention" },
    PAID_CONVERSION: { ar: "التحويل المدفوع", nl: "Betaalde conversie", fr: "Conversion payante", en: "Paid conversion" },
    ADVOCACY: { ar: "التوصية", nl: "Aanbeveling", fr: "Recommandation", en: "Advocacy" },
  },
  CONVERSION_GOAL: {
    DISCOVER_RIJVIA: { ar: "التعرّف على RijVia", nl: "RijVia ontdekken", fr: "Découvrir RijVia", en: "Discover RijVia" },
    EXPLORE_EDUCATIONAL_CONTENT: { ar: "استكشاف المحتوى التعليمي المناسب", nl: "Relevante leerinhoud verkennen", fr: "Explorer le contenu éducatif pertinent", en: "Explore relevant educational content" },
    CONTINUE_TOPIC_LEARNING: { ar: "متابعة تعلم القاعدة أو الموضوع", nl: "Verder leren over de regel of het onderwerp", fr: "Poursuivre l'apprentissage de la règle ou du sujet", en: "Continue learning the relevant rule or topic" },
    START_PRACTICE: { ar: "بدء التدريب", nl: "Oefenen starten", fr: "Commencer l'entraînement", en: "Start practice" },
    CREATE_ACCOUNT_BEGIN_LEARNING: { ar: "إنشاء حساب وبدء التعلم", nl: "Een account maken en beginnen met leren", fr: "Créer un compte et commencer à apprendre", en: "Create an account and begin learning" },
    START_THEORY_EXAM_SIMULATION: { ar: "بدء محاكاة الامتحان النظري", nl: "Een theorie-examensimulatie starten", fr: "Commencer une simulation d'examen théorique", en: "Start a theory exam simulation" },
    RETURN_CONTINUE_TRAINING: { ar: "العودة ومتابعة التدريب", nl: "Terugkeren en verder oefenen", fr: "Revenir et poursuivre l'entraînement", en: "Return and continue training" },
    RECOMMEND_RIJVIA: { ar: "التوصية بـRijVia لمتعلم آخر", nl: "RijVia aanbevelen aan een andere leerling", fr: "Recommander RijVia à un autre apprenant", en: "Recommend RijVia to another learner" },
  },
};

function localizedValue(
  labels: Record<string, LocalizedText>,
  value: string | null | undefined,
  uiLanguage: string,
): string | null {
  if (!value) return null;
  return labels[value]?.[language(uiLanguage)] ?? null;
}

export function editorialTaskStatusLabel(
  value: string | null | undefined,
  uiLanguage: string,
): string {
  if (!value) return "";

  return (
    localizedValue(taskStatusLabels, value, uiLanguage) ??
    lifecycleLabels[language(uiLanguage)][value] ??
    value.replaceAll("_", " ").toLowerCase()
  );
}

export function editorialTopicSourceLabel(
  value: string | null | undefined,
  uiLanguage: string,
): string {
  if (!value) return "";
  return localizedValue(topicSourceLabels, value, uiLanguage) ?? value.replaceAll("_", " ").toLowerCase();
}

export function editorialStrategyOptionLabel(
  kind: EditorialStrategyOptionKind,
  key: string,
  fallback: string,
  uiLanguage: string,
): string {
  return (
    strategyOptionLabels[kind][key]?.[language(uiLanguage)] ?? fallback.trim()
  ) || key.replaceAll("_", " ").toLowerCase();
}

export function editorialClaimTypeLabel(value: string, uiLanguage: string): string {
  return localizedValue(claimTypeLabels, value, uiLanguage) ?? value.replaceAll("_", " ").toLowerCase();
}

export function editorialEvidenceSourceTypeLabel(value: string, uiLanguage: string): string {
  return localizedValue(evidenceSourceTypeLabels, value, uiLanguage) ?? value.replaceAll("_", " ").toLowerCase();
}

export function editorialLegalReviewStatusLabel(value: string, uiLanguage: string): string {
  return localizedValue(legalReviewStatusLabels, value, uiLanguage) ?? value.replaceAll("_", " ").toLowerCase();
}

export function editorialSourceLocationLabel(value: string, uiLanguage: string): string {
  return localizedValue(sourceLocationLabels, value, uiLanguage) ?? value.replaceAll("_", " ").toLowerCase();
}

export function editorialSourceTrustLabel(value: string, uiLanguage: string): string {
  return localizedValue(sourceTrustLabels, value, uiLanguage) ?? value.replaceAll("_", " ").toLowerCase();
}

export function editorialLifecycleLabel(
  value: string | null | undefined,
  uiLanguage: string,
): string {
  if (!value) return "";

  const locale = language(uiLanguage);

  return (
    lifecycleLabels[locale][value] ??
    value.replaceAll("_", " ").toLowerCase()
  );
}

export function editorialQualityGateLabel(
  value: string,
  uiLanguage: string,
): string {
  const locale = language(uiLanguage);

  return (
    qualityGateLabels[locale][value] ??
    value.replaceAll("_", " ").toLowerCase()
  );
}

export function editorialArticleLabel(
  order: number,
  uiLanguage: string,
): string {
  switch (language(uiLanguage)) {
    case "ar":
      return "المقال " + order;
    case "nl":
      return "Artikel " + order;
    case "fr":
      return "Article " + order;
    default:
      return "Article " + order;
  }
}

export function editorialBriefReferenceLabel(
  reference: string | null | undefined,
  uiLanguage: string,
): string | null {
  if (!reference) return null;

  const match = /^ARTICLE_BRIEF:(\d+)$/i.exec(reference.trim());

  if (!match) {
    return reference.replaceAll("_", " ");
  }

  const id = match[1];

  switch (language(uiLanguage)) {
    case "ar":
      return "ملخص المقال " + id;
    case "nl":
      return "Artikelbrief " + id;
    case "fr":
      return "Brief de l'article " + id;
    default:
      return "Article brief " + id;
  }
}

export function editorialImageActionLabel(
  hasImage: boolean,
  uiLanguage: string,
): string {
  const locale = language(uiLanguage);

  if (locale === "ar") {
    return hasImage ? "تغيير صورة المقال" : "رفع صورة المقال";
  }

  if (locale === "nl") {
    return hasImage ? "Artikelafbeelding wijzigen" : "Artikelafbeelding uploaden";
  }

  if (locale === "fr") {
    return hasImage ? "Modifier l'image de l'article" : "Importer l'image de l'article";
  }

  return hasImage ? "Change article image" : "Upload article image";
}

export function editorialWorkflowCopy(uiLanguage: string) {
  return workflowLabels[language(uiLanguage)];
}
