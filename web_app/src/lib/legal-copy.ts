import type { Language } from "@/lib/constants";

interface LegalSection {
  title: string;
  content: string;
}

interface LegalDocument {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

interface LegalContentBundle {
  privacy: LegalDocument;
  terms: LegalDocument;
}

const LEGAL_COPY: Record<Language, LegalContentBundle> = {
  en: {
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: 8 April 2026",
      intro:
        "ReadyRoad respects your privacy. This policy explains what we collect, why we use it, how long we keep it, and which rights you can exercise when using the platform.",
      sections: [
        {
          title: "1. Data we collect",
          content:
            "We collect account details, language and theme preferences, lesson progress, exam and practice results, notification data, and messages sent through contact forms. We also keep limited technical data needed to operate the platform securely.",
        },
        {
          title: "2. Why we use your data",
          content:
            "We use your data to create and protect your account, save your learning progress, show dashboards and analytics, prepare practice sessions and exams, send important notifications, answer support requests, and improve the platform.",
        },
        {
          title: "3. Security and storage",
          content:
            "Passwords are never stored in plain text. Sensitive actions are protected through authentication, access control, and secure transport. If you choose social login, we receive limited identity data from Google to sign you in or link your account. Your data is stored only on systems used to operate and secure the service.",
        },
        {
          title: "4. Sharing with third parties",
          content:
            "We do not sell your personal data. Limited sharing may happen only with trusted hosting, infrastructure, email, monitoring, or identity providers acting on our behalf, or when required by law.",
        },
        {
          title: "5. Your rights",
          content:
            "Depending on applicable law, you may request access to your data, correction of inaccurate information, deletion of your account, restriction of processing, objection to certain processing, or export of your data in a usable format.",
        },
        {
          title: "6. Contact",
          content:
            "For privacy questions or account requests, contact us through the website contact page or by email at privacy@readyroad.be.",
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      lastUpdated: "Last updated: 8 April 2026",
      intro:
        "These terms explain the rules for using ReadyRoad. By creating an account or using the platform, you agree to these terms together with our privacy policy.",
      sections: [
        {
          title: "1. Scope of the service",
          content:
            "ReadyRoad provides study tools for Belgian driving theory, including lessons, traffic signs, dashboards, analytics, notifications, practice flows, and exam-style training sessions.",
        },
        {
          title: "2. Account responsibility",
          content:
            "You are responsible for the information you submit and for the security of your login credentials, including any linked social sign-in methods. You may not share your account in a way that harms the platform or manipulates results.",
        },
        {
          title: "3. Acceptable use",
          content:
            "You may not use ReadyRoad to upload harmful content, automate abusive traffic, scrape protected content, attempt unauthorized access, or interfere with learning and exam systems.",
        },
        {
          title: "4. Educational nature",
          content:
            "ReadyRoad is a preparation platform. Official legal rules, examination decisions, and administrative instructions remain the responsibility of the competent Belgian authorities.",
        },
        {
          title: "5. Availability and updates",
          content:
            "We may improve, reorganize, pause, or remove features when needed for quality, security, maintenance, or product evolution. We may also update these terms and publish the revised date on this page.",
        },
        {
          title: "6. Contact",
          content:
            "Questions about these terms can be sent through the contact page or by email at support@readyroad.be.",
        },
      ],
    },
  },
  ar: {
    privacy: {
      title: "سياسة الخصوصية",
      lastUpdated: "آخر تحديث: 8 أبريل 2026",
      intro:
        "تحترم ReadyRoad خصوصيتك. توضح هذه السياسة ما الذي نجمعه، ولماذا نستخدمه، ومدة الاحتفاظ به، والحقوق التي يمكنك ممارستها عند استخدام المنصة.",
      sections: [
        {
          title: "1. البيانات التي نجمعها",
          content:
            "نجمع بيانات الحساب، وتفضيلات اللغة والمظهر، وتقدم الدروس، ونتائج الامتحانات والتدريب، وبيانات الإشعارات، والرسائل المرسلة عبر نماذج التواصل. كما نحتفظ بقدر محدود من البيانات التقنية اللازمة لتشغيل المنصة بأمان.",
        },
        {
          title: "2. لماذا نستخدم بياناتك",
          content:
            "نستخدم بياناتك لإنشاء الحساب وحمايته، وحفظ تقدمك الدراسي، وعرض لوحة التحكم والتحليلات، وإعداد جلسات التدريب والامتحان، وإرسال الإشعارات المهمة، والرد على طلبات الدعم، وتحسين المنصة.",
        },
        {
          title: "3. الحماية والتخزين",
          content:
            "لا تُخزن كلمات المرور بصيغتها النصية العادية. وتُحمى العمليات الحساسة بالمصادقة والتحكم في الوصول والنقل الآمن للبيانات. وإذا اخترت تسجيل الدخول الاجتماعي، فسنستقبل قدرًا محدودًا من بيانات الهوية من Google لتسجيل الدخول أو ربط الحساب. وتُخزن البيانات فقط على الأنظمة المستخدمة لتشغيل الخدمة وتأمينها.",
        },
        {
          title: "4. مشاركة البيانات",
          content:
            "لا نبيع بياناتك الشخصية. وقد تتم مشاركة محدودة فقط مع مزودي الاستضافة أو البنية التحتية أو البريد أو المراقبة أو مزودي الهوية الذين يعملون بالنيابة عنا، أو إذا فرض القانون ذلك.",
        },
        {
          title: "5. حقوقك",
          content:
            "وفقًا للقانون المطبق، يمكنك طلب الوصول إلى بياناتك، أو تصحيح البيانات غير الدقيقة، أو حذف الحساب، أو تقييد بعض المعالجات، أو الاعتراض على بعض الاستخدامات، أو طلب نسخة قابلة للاستخدام من بياناتك.",
        },
        {
          title: "6. التواصل",
          content:
            "لأي استفسار يتعلق بالخصوصية أو الحساب، يمكنك التواصل معنا عبر صفحة الاتصال في الموقع أو عبر البريد privacy@readyroad.be.",
        },
      ],
    },
    terms: {
      title: "شروط الخدمة",
      lastUpdated: "آخر تحديث: 8 أبريل 2026",
      intro:
        "توضح هذه الشروط القواعد المنظمة لاستخدام ReadyRoad. ومن خلال إنشاء حساب أو استخدام المنصة، فإنك توافق على هذه الشروط إلى جانب سياسة الخصوصية.",
      sections: [
        {
          title: "1. نطاق الخدمة",
          content:
            "توفر ReadyRoad أدوات دراسة خاصة بنظرية القيادة في بلجيكا، بما يشمل الدروس، وعلامات المرور، ولوحات التحكم، والتحليلات، والإشعارات، ومسارات التدريب، وجلسات الامتحان المحاكية.",
        },
        {
          title: "2. مسؤولية الحساب",
          content:
            "أنت مسؤول عن المعلومات التي تقدمها وعن حماية بيانات تسجيل الدخول، بما في ذلك أي وسائل دخول اجتماعي مرتبطة بالحساب. ولا يجوز مشاركة الحساب بطريقة تضر بالمنصة أو تعبث بالنتائج أو بيانات التقدم.",
        },
        {
          title: "3. الاستخدام المقبول",
          content:
            "لا يجوز استخدام ReadyRoad لتحميل محتوى ضار، أو إرسال حركة آلية مسيئة، أو نسخ محتوى محمي، أو محاولة الوصول غير المصرح به، أو تعطيل أنظمة التعلم والامتحان.",
        },
        {
          title: "4. الطبيعة التعليمية",
          content:
            "ReadyRoad منصة للتحضير والدراسة. أما القواعد القانونية الرسمية، وقرارات الامتحانات، والتعليمات الإدارية، فتبقى من اختصاص الجهات البلجيكية المختصة.",
        },
        {
          title: "5. التوافر والتحديثات",
          content:
            "يجوز لنا تحسين الخصائص أو إعادة تنظيمها أو إيقاف بعضها مؤقتًا أو إزالتها لأسباب تتعلق بالجودة أو الأمان أو الصيانة أو تطوير المنتج. كما يجوز لنا تحديث هذه الشروط مع تعديل التاريخ الظاهر في هذه الصفحة.",
        },
        {
          title: "6. التواصل",
          content:
            "يمكن إرسال الأسئلة المتعلقة بهذه الشروط عبر صفحة الاتصال أو إلى support@readyroad.be.",
        },
      ],
    },
  },
  fr: {
    privacy: {
      title: "Politique de confidentialité",
      lastUpdated: "Dernière mise à jour : 8 avril 2026",
      intro:
        "ReadyRoad respecte votre vie privée. Cette politique explique quelles données nous collectons, pourquoi nous les utilisons, combien de temps nous les conservons et quels droits vous pouvez exercer.",
      sections: [
        {
          title: "1. Données collectées",
          content:
            "Nous collectons les données de compte, les préférences de langue et de thème, la progression dans les leçons, les résultats d'examen et d'entraînement, les données de notification et les messages envoyés via les formulaires de contact. Nous conservons aussi des données techniques limitées nécessaires au fonctionnement sécurisé de la plateforme.",
        },
        {
          title: "2. Pourquoi nous utilisons vos données",
          content:
            "Nous utilisons vos données pour créer et protéger votre compte, enregistrer votre progression, afficher les tableaux de bord et les analyses, préparer les entraînements et examens, envoyer des notifications importantes, répondre aux demandes d'assistance et améliorer la plateforme.",
        },
        {
          title: "3. Sécurité et stockage",
          content:
            "Les mots de passe ne sont jamais stockés en clair. Les actions sensibles sont protégées par l'authentification, le contrôle d'accès et le transport sécurisé des données. Si vous choisissez la connexion sociale, nous recevons des données d'identité limitées de Google pour vous connecter ou lier votre compte. Les données sont stockées uniquement sur les systèmes utilisés pour exploiter et sécuriser le service.",
        },
        {
          title: "4. Partage des données",
          content:
            "Nous ne vendons pas vos données personnelles. Un partage limité peut avoir lieu uniquement avec des prestataires d'hébergement, d'infrastructure, d'e-mail, de supervision ou d'identité agissant pour notre compte, ou lorsque la loi l'exige.",
        },
        {
          title: "5. Vos droits",
          content:
            "Selon la loi applicable, vous pouvez demander l'accès à vos données, la correction d'informations inexactes, la suppression du compte, la limitation de certains traitements, l'opposition à certains usages ou l'export de vos données dans un format exploitable.",
        },
        {
          title: "6. Contact",
          content:
            "Pour toute question relative à la confidentialité ou au compte, contactez-nous via la page de contact du site ou à privacy@readyroad.be.",
        },
      ],
    },
    terms: {
      title: "Conditions d'utilisation",
      lastUpdated: "Dernière mise à jour : 8 avril 2026",
      intro:
        "Ces conditions définissent les règles d'utilisation de ReadyRoad. En créant un compte ou en utilisant la plateforme, vous acceptez ces conditions ainsi que notre politique de confidentialité.",
      sections: [
        {
          title: "1. Objet du service",
          content:
            "ReadyRoad fournit des outils d'étude pour la théorie de conduite belge, y compris des leçons, des panneaux, des tableaux de bord, des analyses, des notifications, des parcours d'entraînement et des sessions d'examen simulées.",
        },
        {
          title: "2. Responsabilité du compte",
          content:
            "Vous êtes responsable des informations que vous fournissez et de la sécurité de vos identifiants de connexion, y compris toute méthode de connexion sociale liée. Le partage de compte d'une manière nuisible à la plateforme ou manipulant les résultats est interdit.",
        },
        {
          title: "3. Utilisation acceptable",
          content:
            "Il est interdit d'utiliser ReadyRoad pour diffuser du contenu malveillant, générer un trafic automatisé abusif, copier du contenu protégé, tenter un accès non autorisé ou perturber les systèmes d'apprentissage et d'examen.",
        },
        {
          title: "4. Nature pédagogique",
          content:
            "ReadyRoad est une plateforme de préparation. Les règles juridiques officielles, les décisions d'examen et les instructions administratives restent de la compétence des autorités belges compétentes.",
        },
        {
          title: "5. Disponibilité et mises à jour",
          content:
            "Nous pouvons améliorer, réorganiser, suspendre temporairement ou retirer certaines fonctionnalités pour des raisons de qualité, de sécurité, de maintenance ou d'évolution du produit. Nous pouvons également mettre à jour ces conditions et modifier la date indiquée sur cette page.",
        },
        {
          title: "6. Contact",
          content:
            "Les questions concernant ces conditions peuvent être envoyées via la page de contact ou à support@readyroad.be.",
        },
      ],
    },
  },
  nl: {
    privacy: {
      title: "Privacybeleid",
      lastUpdated: "Laatst bijgewerkt: 8 april 2026",
      intro:
        "ReadyRoad respecteert uw privacy. Dit beleid legt uit welke gegevens wij verzamelen, waarom wij die gebruiken, hoelang wij die bewaren en welke rechten u kunt uitoefenen.",
      sections: [
        {
          title: "1. Welke gegevens wij verzamelen",
          content:
            "Wij verzamelen accountgegevens, taal- en themavoorkeuren, lesvoortgang, examen- en oefenresultaten, meldingsgegevens en berichten die via contactformulieren worden verzonden. Daarnaast bewaren wij beperkte technische gegevens die nodig zijn om het platform veilig te laten functioneren.",
        },
        {
          title: "2. Waarom wij uw gegevens gebruiken",
          content:
            "Wij gebruiken uw gegevens om uw account aan te maken en te beveiligen, uw leerprogressie op te slaan, dashboards en analyses te tonen, oefensessies en examens voor te bereiden, belangrijke meldingen te versturen, supportvragen te beantwoorden en het platform te verbeteren.",
        },
        {
          title: "3. Beveiliging en opslag",
          content:
            "Wachtwoorden worden nooit in platte tekst opgeslagen. Gevoelige handelingen worden beschermd via authenticatie, toegangscontrole en beveiligd dataverkeer. Als u kiest voor sociaal inloggen, ontvangen wij beperkte identiteitsgegevens van Google om u aan te melden of uw account te koppelen. Gegevens worden alleen opgeslagen op systemen die nodig zijn om de dienst te draaien en te beveiligen.",
        },
        {
          title: "4. Gegevens delen",
          content:
            "Wij verkopen uw persoonsgegevens niet. Beperkt delen kan alleen gebeuren met hosting-, infrastructuur-, e-mail-, monitoring- of identiteitsproviders die namens ons werken, of wanneer de wet dit vereist.",
        },
        {
          title: "5. Uw rechten",
          content:
            "Volgens de toepasselijke wet kunt u vragen om inzage in uw gegevens, correctie van onjuiste informatie, verwijdering van uw account, beperking van bepaalde verwerkingen, bezwaar tegen bepaalde vormen van gebruik of export van uw gegevens in een bruikbaar formaat.",
        },
        {
          title: "6. Contact",
          content:
            "Voor vragen over privacy of uw account kunt u contact opnemen via de contactpagina of via privacy@readyroad.be.",
        },
      ],
    },
    terms: {
      title: "Gebruiksvoorwaarden",
      lastUpdated: "Laatst bijgewerkt: 8 april 2026",
      intro:
        "Deze voorwaarden beschrijven de regels voor het gebruik van ReadyRoad. Door een account aan te maken of het platform te gebruiken, stemt u in met deze voorwaarden en ons privacybeleid.",
      sections: [
        {
          title: "1. Reikwijdte van de dienst",
          content:
            "ReadyRoad biedt studietools voor de Belgische rijtheorie, waaronder lessen, verkeersborden, dashboards, analyses, meldingen, oefentrajecten en gesimuleerde examensessies.",
        },
        {
          title: "2. Verantwoordelijkheid voor het account",
          content:
            "U bent verantwoordelijk voor de informatie die u verstrekt en voor de veiligheid van uw inloggegevens, inclusief gekoppelde sociale aanmeldmethoden. Het delen van een account op een manier die het platform schaadt of resultaten manipuleert, is niet toegestaan.",
        },
        {
          title: "3. Toegestaan gebruik",
          content:
            "Het is niet toegestaan ReadyRoad te gebruiken om schadelijke inhoud te verspreiden, misbruikmakend geautomatiseerd verkeer te genereren, beschermde inhoud te kopiëren, ongeautoriseerde toegang te proberen of leer- en examensystemen te verstoren.",
        },
        {
          title: "4. Educatief karakter",
          content:
            "ReadyRoad is een voorbereidingsplatform. Officiële wettelijke regels, examenbeslissingen en administratieve instructies blijven de verantwoordelijkheid van de bevoegde Belgische autoriteiten.",
        },
        {
          title: "5. Beschikbaarheid en updates",
          content:
            "Wij kunnen functies verbeteren, herstructureren, tijdelijk pauzeren of verwijderen om redenen van kwaliteit, veiligheid, onderhoud of productontwikkeling. Wij kunnen deze voorwaarden ook bijwerken en de datum op deze pagina aanpassen.",
        },
        {
          title: "6. Contact",
          content:
            "Vragen over deze voorwaarden kunnen worden verzonden via de contactpagina of naar support@readyroad.be.",
        },
      ],
    },
  },
};

export function getPrivacyContent(language: Language): LegalDocument {
  return LEGAL_COPY[language].privacy;
}

export function getTermsContent(language: Language): LegalDocument {
  return LEGAL_COPY[language].terms;
}
