import type { Language } from "@/lib/constants";

export type PublicPageKey =
  | "about"
  | "contact"
  | "privacy"
  | "cookies"
  | "terms"
  | "disclaimer"
  | "faq";

export const PUBLIC_CONTACT = {
  email: "info@rijvia.be",
  github: "https://github.com/haydartarek",
  linkedin: "https://www.linkedin.com/in/haydartarek-dev/",
} as const;

export type PublicDocumentKey = Exclude<PublicPageKey, "contact" | "faq">;

export interface PublicReference {
  id: string;
  label: string;
  url: string;
}

export interface PublicSection {
  title: string;
  paragraphs: string[];
  items?: string[];
  references?: PublicReference[];
}

export interface PublicDocument {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: PublicSection[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqContent {
  eyebrow: string;
  title: string;
  intro: string;
  items: FaqItem[];
  contactPrompt: string;
  contactLabel: string;
}

export interface PublicMetadataCopy {
  title: string;
  description: string;
  openGraphTitle: string;
  openGraphDescription: string;
  imageAlt: string;
}

interface PublicLocaleBundle {
  metadata: Record<PublicPageKey, PublicMetadataCopy>;
  documents: Record<PublicDocumentKey, PublicDocument>;
  faq: FaqContent;
  breadcrumbHome: string;
}

const OFFICIAL_URLS = {
  gdpr: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng",
  privacyRights:
    "https://www.autoriteprotectiondonnees.be/citoyen/vie-privee/quels-sont-mes-droits-",
  cookieGuidance:
    "https://www.dataprotectionauthority.be/professionnel/themes/internet/cookies",
  trafficRules:
    "https://mobilit.belgium.be/fr/route/conduire/code-de-la-route-violations-et-sanctions/regles-de-circulation",
  futureRoadCode:
    "https://mobilit.belgium.be/fr/route/conduire/code-de-la-voie-publique",
} as const;

const PUBLIC_CONTENT: Record<Language, PublicLocaleBundle> = {
  en: {
    breadcrumbHome: "Home",
    metadata: {
      about: {
        title: "About RijVia",
        description:
          "Learn how RijVia supports Belgian driving theory study through multilingual content, official-source review, and structured practice.",
        openGraphTitle: "About RijVia | Belgian Driving Theory Learning",
        openGraphDescription:
          "Discover RijVia's mission, multilingual approach, official-source policy, and independent educational role.",
        imageAlt: "About the RijVia learning platform",
      },
      contact: {
        title: "Contact RijVia",
        description:
          "Contact RijVia for account support, accessibility help, content corrections, privacy requests, or platform feedback.",
        openGraphTitle: "Contact RijVia Support",
        openGraphDescription:
          "Send RijVia a support request, report a content issue, or share feedback through the secure contact form.",
        imageAlt: "Contact RijVia support",
      },
      privacy: {
        title: "Privacy Policy",
        description:
          "Read how RijVia collects, uses, stores, and protects account, learning, authentication, and contact data under the GDPR.",
        openGraphTitle: "RijVia Privacy Policy",
        openGraphDescription:
          "How RijVia handles personal data, account security, retention, service providers, and GDPR rights.",
        imageAlt: "RijVia privacy policy",
      },
      cookies: {
        title: "Cookie Policy",
        description:
          "See which essential and optional cookies RijVia uses for login security, language, preferences, Google sign-in, and consent-based analytics.",
        openGraphTitle: "RijVia Cookie Policy",
        openGraphDescription:
          "A transparent inventory of RijVia cookies, browser storage, purposes, and retention periods.",
        imageAlt: "RijVia cookie policy",
      },
      terms: {
        title: "Terms of Service",
        description:
          "Read the rules for RijVia accounts, acceptable use, educational content, intellectual property, and service availability.",
        openGraphTitle: "RijVia Terms of Service",
        openGraphDescription:
          "Terms governing accounts, responsible use, educational materials, availability, and liability on RijVia.",
        imageAlt: "RijVia terms of service",
      },
      disclaimer: {
        title: "Educational Disclaimer",
        description:
          "Understand RijVia's independent educational role and why official Belgian law and examination authorities remain decisive.",
        openGraphTitle: "RijVia Educational Disclaimer",
        openGraphDescription:
          "RijVia supports study but does not replace Belgian legislation, official instructions, or professional advice.",
        imageAlt: "RijVia educational disclaimer",
      },
      faq: {
        title: "Frequently Asked Questions",
        description:
          "Find answers about RijVia accounts, free access, lessons, traffic signs, practice, exams, progress, languages, and updates.",
        openGraphTitle: "RijVia Frequently Asked Questions",
        openGraphDescription:
          "Answers about studying Belgian driving theory with RijVia, including accounts, practice, progress, and languages.",
        imageAlt: "RijVia frequently asked questions",
      },
    },
    documents: {
      about: {
        eyebrow: "Independent learning platform",
        title: "About RijVia",
        lastUpdated: "Last reviewed: 21 July 2026",
        intro:
          "RijVia is an independent, free learning platform that helps people study Belgian driving theory in a structured and accessible way.",
        sections: [
          {
            title: "Why RijVia exists",
            paragraphs: [
              "Belgian driving theory is spread across legal rules, regional examination guidance, signs, and practical situations. RijVia brings study material, practice, and progress tracking into one coherent experience without claiming to replace official authorities.",
            ],
          },
          {
            title: "Mission and vision",
            paragraphs: [
              "Our mission is to make reliable driving-theory preparation easier to understand across language barriers. Our vision is a learning environment where every explanation can be traced, reviewed, and improved as Belgian rules evolve.",
            ],
          },
          {
            title: "What makes the platform different",
            paragraphs: [
              "RijVia combines a reviewed catalogue of 184 traffic signs with structured lessons, category practice, exam-style sessions, and progress insights. Content is maintained from canonical source files and checked for cross-language and cross-file consistency.",
            ],
          },
          {
            title: "Languages and accessibility",
            paragraphs: [
              "The interface and core learning content are available in English, Dutch, French, and Arabic. Arabic uses right-to-left presentation, while the other languages use left-to-right presentation. Accessibility and clear terminology are part of the review process.",
            ],
          },
          {
            title: "Official-source approach",
            paragraphs: [
              "RijVia reviews educational content against Belgian official sources and records future-law items separately. The competent authorities and the published legal text always take priority over a summary on this platform.",
            ],
            references: [
              {
                id: "MOB-BE-TRAFFIC-RULES",
                label: "FPS Mobility and Transport: traffic rules",
                url: OFFICIAL_URLS.trafficRules,
              },
              {
                id: "MOB-BE-FUTURE-ROAD-CODE",
                label: "FPS Mobility and Transport: future public road code",
                url: OFFICIAL_URLS.futureRoadCode,
              },
            ],
          },
          {
            title: "Project stewardship",
            paragraphs: [
              "RijVia is created and maintained by Haydar Tarek. It is not a government body, examination centre, driving school, or legal adviser, and no affiliation with Belgian examination authorities is implied.",
            ],
            references: [
              {
                id: "PROJECT-GITHUB",
                label: "Haydar Tarek on GitHub",
                url: "https://github.com/haydartarek",
              },
              {
                id: "PROJECT-LINKEDIN",
                label: "Haydar Tarek on LinkedIn",
                url: "https://www.linkedin.com/in/haydartarek-dev/",
              },
            ],
          },
        ],
      },
      privacy: {
        eyebrow: "Your data and your rights",
        title: "Privacy Policy",
        lastUpdated: "Last reviewed: 3 August 2026",
        intro:
          "This policy explains how RijVia processes personal data when you browse the public website, create an account, sign in, study, or contact us.",
        sections: [
          {
            title: "1. Who is responsible",
            paragraphs: [
              "Haydar Tarek, as the operator of RijVia, is the controller for the personal data described in this policy. Privacy and data-rights requests can be sent through the contact form by selecting a clear privacy-related subject.",
            ],
          },
          {
            title: "2. Data we process",
            paragraphs: [
              "Account data includes username, full name, email address, password hash, role, account status, and timestamps. If you choose Google sign-in, RijVia receives only your verified name and email address from Google to create, link, or securely sign in to your account. RijVia does not sell this information or share it with third parties for advertising. Learning data includes lesson progress, practice and exam attempts, answers, scores, weak areas, achievements, and notifications.",
              "Contact data includes the name, email address, subject, and message you submit. Limited technical and security data may be processed in server logs to operate, diagnose, and protect the service. If you consent to Analytics, Google Analytics processes pseudonymous browser, device, page, session, interaction, traffic-source, and approximate-location data; RijVia does not send it your account name, email address, or internal user ID. RijVia does not ask for payment-card data.",
            ],
          },
          {
            title: "3. Purposes and legal bases",
            paragraphs: [
              "We process account and learning data to provide the service you request, authenticate users, preserve progress, display results, and support account management. Security, fraud prevention, service diagnostics, and content quality rely on our legitimate interest in running a safe and reliable platform. Legal obligations apply where the law requires processing or retention. Optional processing that legally requires consent will not be activated before valid consent is obtained.",
            ],
          },
          {
            title: "4. Authentication and cookies",
            paragraphs: [
              "RijVia stores the signed authentication token in a Secure HttpOnly cookie in production, so client-side scripts cannot read it. A separate CSRF token protects state-changing requests. Language is retained for a consistent multilingual experience; the optional theme preference is stored only after Preferences consent. Google sign-in is optional and uses short-lived security cookies. The complete inventory and consent controls are available in the Cookie Policy.",
            ],
          },
          {
            title: "5. Service providers and transfers",
            paragraphs: [
              "The production service uses Hostinger for frontend and backend hosting and Supabase for the PostgreSQL database. Google provides optional sign-in and, only after Analytics consent, Google Analytics usage measurement. Sign-in provides the verified name and email address needed to create, link, or securely access your account; Analytics receives no RijVia account identity. These providers may operate infrastructure in different countries under their own privacy and transfer safeguards. RijVia does not sell personal data or use it for third-party advertising.",
            ],
          },
          {
            title: "6. Retention",
            paragraphs: [
              "Account and learning records are kept while the account remains active and are removed when the account-deletion flow completes, except where limited records must be retained for security, dispute handling, or a legal obligation. Contact messages are kept only as long as needed to answer and follow up. Authentication and OAuth cookies expire automatically as listed in the Cookie Policy; operational logs are kept only for the limited period configured by the hosting provider.",
            ],
          },
          {
            title: "7. Your GDPR rights",
            paragraphs: [
              "Subject to the conditions in the GDPR, you may request access, correction, erasure, restriction, portability, or object to processing. You may withdraw consent at any time where processing relies on consent. You can delete your RijVia account from the profile flow or submit another rights request through the contact page. You may also lodge a complaint with the Belgian Data Protection Authority.",
            ],
            references: [
              {
                id: "EU-GDPR-2016-679",
                label: "Regulation (EU) 2016/679 (GDPR)",
                url: OFFICIAL_URLS.gdpr,
              },
              {
                id: "BE-DPA-DATA-RIGHTS",
                label: "Belgian Data Protection Authority: your rights",
                url: OFFICIAL_URLS.privacyRights,
              },
            ],
          },
          {
            title: "8. Security, changes, and contact",
            paragraphs: [
              "Passwords are hashed, transport uses HTTPS in production, and access controls protect account and administrative functions. No online service can guarantee absolute security. We will update this policy when processing or providers materially change and will revise the date shown above. Use the contact page for privacy questions or requests.",
            ],
          },
        ],
      },
      cookies: {
        eyebrow: "Browser storage transparency",
        title: "Cookie Policy",
        lastUpdated: "Last reviewed: 3 August 2026",
        intro:
          "RijVia uses necessary cookies and browser storage for security, sign-in, language, and consent choices. Optional preferences and Google Analytics remain disabled until you consent. Marketing services are not used.",
        sections: [
          {
            title: "1. What this policy covers",
            paragraphs: [
              "Cookies are small values stored by a website in your browser. Similar technologies, including local storage, can remember preferences. This policy lists what RijVia itself uses and why.",
            ],
          },
          {
            title: "2. Current essential cookies",
            paragraphs: [
              "The following cookies support services explicitly requested by the user and are not used for advertising or cross-site tracking.",
            ],
            items: [
              "token — RijVia domain, path /, authentication session, HttpOnly, up to 7 days or earlier token expiry/logout.",
              "csrf_token — RijVia domain, path /, protects state-changing requests, up to 7 days or logout.",
              "readyroad_locale — RijVia domain, path /, remembers the selected language, up to 1 year.",
              "google_oauth_state, google_oauth_code_verifier, google_oauth_mode, and google_oauth_return_to — RijVia domain, path /, secure an optional Google sign-in attempt and are deleted after the callback or expire after about 10 minutes.",
            ],
          },
          {
            title: "3. Browser storage",
            paragraphs: [
              "readyroad_locale keeps the selected language available on the client. readyroad_cookie_consent stores version 2, a timestamp, and the four category choices without personal data. session_expired is a one-time tab-session flag. current_exam is transient exam compatibility state and is removed when invalid or complete.",
              "readyroad_theme stores the light or dark appearance only after Preferences consent and is removed when that consent is withdrawn. These browser values do not contain the JWT or your password.",
            ],
          },
          {
            title: "4. Analytics and marketing",
            paragraphs: [
              "RijVia uses Google Analytics 4 with Measurement ID G-1P4EJH6D2T only after you enable Analytics. It measures page views, sessions, approximate location, browser and device details, traffic sources, and interactions. Before consent, Google Analytics scripts and requests are not loaded. Google Consent Mode v2 keeps analytics and advertising storage denied by default; advertising, remarketing, social-media pixels, and profiling are not used. Analytics consent can create the following first-party cookies, which are removed when you withdraw that consent.",
            ],
            items: [
              "_ga — RijVia domain, path /, distinguishes browsers for aggregate usage measurement, up to 2 years or until Analytics consent is withdrawn.",
              "_ga_1P4EJH6D2T — RijVia domain, path /, maintains GA4 session state, up to 2 years or until Analytics consent is withdrawn.",
            ],
          },
          {
            title: "5. Consent and future changes",
            paragraphs: [
              "Strictly necessary storage remains active so the requested service can work. The banner offers equally accessible Accept all, Reject optional, and Customize choices. Consent version 2 stores the decision locally. If the version changes, RijVia asks again. Optional services may load only after the matching category is accepted.",
            ],
            references: [
              {
                id: "BE-DPA-COOKIE-GUIDANCE",
                label: "Belgian Data Protection Authority: cookies and trackers",
                url: OFFICIAL_URLS.cookieGuidance,
              },
            ],
          },
          {
            title: "6. Managing storage",
            paragraphs: [
              "Use Cookie settings in the footer at any time to review, change, or withdraw optional consent. Withdrawal removes disallowed preference storage and Google Analytics cookies while necessary functions remain available. Logging out removes authentication and CSRF cookies; OAuth cookies are removed after callback. You may also clear browser data, which resets the saved decision.",
            ],
          },
        ],
      },
      terms: {
        eyebrow: "Rules for using RijVia",
        title: "Terms of Service",
        lastUpdated: "Last reviewed: 21 July 2026",
        intro:
          "These terms govern use of RijVia. By using the platform, you agree to use it lawfully and understand its independent educational purpose.",
        sections: [
          {
            title: "1. Service and eligibility",
            paragraphs: [
              "RijVia provides study material, traffic-sign references, practice, simulated exams, and progress tools for Belgian driving theory. You must be able to accept these terms under the law applicable to you; a parent or guardian should supervise use where required.",
            ],
          },
          {
            title: "2. Accounts",
            paragraphs: [
              "Provide accurate registration information, keep credentials confidential, and promptly report suspected misuse. You are responsible for activity performed through your account. One person must not use another person's account to manipulate progress or results.",
            ],
          },
          {
            title: "3. Educational nature",
            paragraphs: [
              "RijVia is a preparation aid, not an official examination service, driving school, government authority, or source of legal advice. Completion, scores, or recommendations do not guarantee admission to or success in an official examination.",
            ],
          },
          {
            title: "4. Acceptable use",
            paragraphs: [
              "Do not attempt unauthorized access, disrupt the service, bypass security, submit malicious material, scrape protected content at scale, impersonate another person, misuse personal data, or use automated traffic that harms other users or the infrastructure.",
            ],
          },
          {
            title: "5. Intellectual property",
            paragraphs: [
              "RijVia's original software, interface, branding, explanations, question structure, and other original materials are protected by applicable intellectual-property rules. Official legal texts and public traffic-sign material remain subject to their own legal status. Personal study use does not grant permission to republish or commercially exploit the platform's original content.",
            ],
          },
          {
            title: "6. Availability and changes",
            paragraphs: [
              "The service may be updated, interrupted, or limited for maintenance, security, legal alignment, or infrastructure constraints. We aim to preserve user data and continuity but do not promise uninterrupted availability. Material changes to these terms will be published with a revised date.",
            ],
          },
          {
            title: "7. Suspension, termination, and deletion",
            paragraphs: [
              "Access may be limited or terminated when an account seriously or repeatedly violates these terms, threatens security, or infringes others' rights. You may stop using the service and request account deletion through your profile. Mandatory legal rights remain unaffected.",
            ],
          },
          {
            title: "8. Liability and applicable law",
            paragraphs: [
              "To the extent permitted by law, RijVia is not responsible for examination decisions, changes in legislation, reliance on outdated cached material, or indirect loss resulting from use of an educational summary. Nothing in these terms excludes liability or consumer rights that cannot legally be excluded. Belgian law applies subject to mandatory rules protecting users in their country of residence.",
            ],
          },
          {
            title: "9. Contact",
            paragraphs: [
              "Questions about these terms can be submitted through the RijVia contact page. Include a clear subject so the request can be routed correctly.",
            ],
          },
        ],
      },
      disclaimer: {
        eyebrow: "Important study notice",
        title: "Educational Disclaimer",
        lastUpdated: "Last reviewed: 21 July 2026",
        intro:
          "RijVia supports study and revision. It does not replace Belgian legislation, official examination instructions, or advice from a qualified professional.",
        sections: [
          {
            title: "Independent platform",
            paragraphs: [
              "RijVia is not affiliated with the Belgian federal or regional governments, police, an examination centre, or a driving school. Brand names and links to authorities are used only to identify official sources.",
            ],
          },
          {
            title: "No legal or professional advice",
            paragraphs: [
              "Explanations, examples, quizzes, and simulated exams are educational summaries. They are not legal advice, a binding interpretation, a driving lesson, or an official examination decision. For a real incident, sanction, licence issue, or dispute, consult the competent authority or a qualified adviser.",
            ],
          },
          {
            title: "Rules and examinations can change",
            paragraphs: [
              "Belgian traffic rules and regional examination procedures can change. Official legal texts, current authority instructions, road signs in place, and directions from police or authorised officials take priority. The new public road code is currently scheduled to enter into force on 1 June 2027; future-law material must not be treated as current law before its effective date.",
            ],
            references: [
              {
                id: "MOB-BE-TRAFFIC-RULES",
                label: "FPS Mobility and Transport: current traffic rules",
                url: OFFICIAL_URLS.trafficRules,
              },
              {
                id: "MOB-BE-FUTURE-ROAD-CODE",
                label: "FPS Mobility and Transport: public road code from 1 June 2027",
                url: OFFICIAL_URLS.futureRoadCode,
              },
            ],
          },
          {
            title: "No guarantee of examination outcome",
            paragraphs: [
              "Practice scores indicate activity within RijVia only. They do not predict or guarantee an official result. Question format, scoring, eligibility, and procedures may differ by region, licence category, examination centre, and date.",
            ],
          },
          {
            title: "Reporting a correction",
            paragraphs: [
              "If content appears inconsistent with a current official source, use the contact page and include the page, language, disputed text, and official reference. RijVia reviews documented corrections through its content-governance process.",
            ],
          },
        ],
      },
    },
    faq: {
      eyebrow: "Help centre",
      title: "Frequently Asked Questions",
      intro:
        "Quick answers about accounts, learning tools, languages, progress, and the legal status of RijVia content.",
      items: [
        {
          question: "Is RijVia free?",
          answer:
            "Yes. RijVia currently provides its core learning platform without a subscription or payment-card requirement.",
        },
        {
          question: "Do I need an account?",
          answer:
            "Public traffic signs and lessons can be browsed without an account. An account is needed to save progress, attempts, results, weak areas, and personalised dashboard information.",
        },
        {
          question: "Which languages are available?",
          answer:
            "RijVia supports English, Dutch, French, and Arabic. Arabic is displayed right to left; the other languages are displayed left to right.",
        },
        {
          question: "What is Smart Quiz or random practice?",
          answer:
            "It selects practice questions using the available categories and your chosen flow. It is a study tool, not an official examination or legal assessment.",
        },
        {
          question: "Are practice exams the same as the official exam?",
          answer:
            "No. They are simulations designed for revision. Official question formats, scoring, procedures, and decisions are controlled by the competent regional authorities and examination centres.",
        },
        {
          question: "How is progress calculated?",
          answer:
            "RijVia records completed lessons, practice answers, attempts, scores, and recurring weak areas linked to your account. Dashboard indicators summarise activity inside RijVia only.",
        },
        {
          question: "Can RijVia guarantee that I will pass?",
          answer:
            "No. Study consistency can improve preparation, but RijVia cannot guarantee an official result. Always check the current requirements for your region and licence category.",
        },
        {
          question: "How is the content updated?",
          answer:
            "Traffic-sign content uses canonical source files and a governance review covering legal sources, terminology, translations, and cross-file consistency. Documented official changes are reviewed before publication.",
        },
        {
          question: "How do I delete my account or request my data?",
          answer:
            "Use the account-deletion option in your profile. For access, correction, portability, restriction, objection, or another privacy request, use the contact form with a privacy-related subject.",
        },
        {
          question: "How can I report an incorrect question or translation?",
          answer:
            "Use the contact page and include the sign or lesson code, page address, language, disputed text, and an official source when available.",
        },
      ],
      contactPrompt: "Still need help?",
      contactLabel: "Contact RijVia",
    },
  },
  nl: {
    breadcrumbHome: "Home",
    metadata: {
      about: {
        title: "Over RijVia",
        description:
          "Lees hoe RijVia Belgische rijtheorie toegankelijk maakt met meertalige inhoud, controle van officiële bronnen en gestructureerde oefeningen.",
        openGraphTitle: "Over RijVia | Belgische rijtheorie leren",
        openGraphDescription:
          "Ontdek de missie, meertalige aanpak, bronnenpolitiek en onafhankelijke educatieve rol van RijVia.",
        imageAlt: "Over het leerplatform RijVia",
      },
      contact: {
        title: "Contact met RijVia",
        description:
          "Neem contact op met RijVia voor accounthulp, toegankelijkheid, inhoudelijke correcties, privacyverzoeken of feedback.",
        openGraphTitle: "Contact met RijVia-support",
        openGraphDescription:
          "Stuur een supportvraag, meld een inhoudelijk probleem of deel feedback via het contactformulier van RijVia.",
        imageAlt: "Contact met RijVia-support",
      },
      privacy: {
        title: "Privacybeleid",
        description:
          "Lees hoe RijVia account-, leer-, authenticatie- en contactgegevens verzamelt, gebruikt, bewaart en beveiligt onder de AVG.",
        openGraphTitle: "Privacybeleid van RijVia",
        openGraphDescription:
          "Hoe RijVia persoonsgegevens, accountbeveiliging, bewaartermijnen, dienstverleners en AVG-rechten behandelt.",
        imageAlt: "Privacybeleid van RijVia",
      },
      cookies: {
        title: "Cookiebeleid",
        description:
          "Bekijk welke noodzakelijke en optionele cookies RijVia gebruikt voor inlogbeveiliging, taal, voorkeuren, Google-login en analyse na toestemming.",
        openGraphTitle: "Cookiebeleid van RijVia",
        openGraphDescription:
          "Een transparant overzicht van RijVia-cookies, browseropslag, doeleinden en bewaartermijnen.",
        imageAlt: "Cookiebeleid van RijVia",
      },
      terms: {
        title: "Gebruiksvoorwaarden",
        description:
          "Lees de regels voor RijVia-accounts, toegestaan gebruik, educatieve inhoud, intellectuele eigendom en beschikbaarheid.",
        openGraphTitle: "Gebruiksvoorwaarden van RijVia",
        openGraphDescription:
          "Voorwaarden voor accounts, verantwoord gebruik, leermateriaal, beschikbaarheid en aansprakelijkheid op RijVia.",
        imageAlt: "Gebruiksvoorwaarden van RijVia",
      },
      disclaimer: {
        title: "Educatieve disclaimer",
        description:
          "Begrijp de onafhankelijke educatieve rol van RijVia en waarom Belgische wetgeving en officiële instanties altijd doorslaggevend zijn.",
        openGraphTitle: "Educatieve disclaimer van RijVia",
        openGraphDescription:
          "RijVia ondersteunt studie maar vervangt geen Belgische wetgeving, officiële instructies of professioneel advies.",
        imageAlt: "Educatieve disclaimer van RijVia",
      },
      faq: {
        title: "Veelgestelde vragen",
        description:
          "Vind antwoorden over RijVia-accounts, gratis toegang, lessen, verkeersborden, oefeningen, examens, voortgang, talen en updates.",
        openGraphTitle: "Veelgestelde vragen over RijVia",
        openGraphDescription:
          "Antwoorden over Belgische rijtheorie studeren met RijVia, waaronder accounts, oefeningen, voortgang en talen.",
        imageAlt: "Veelgestelde vragen over RijVia",
      },
    },
    documents: {
      about: {
        eyebrow: "Onafhankelijk leerplatform",
        title: "Over RijVia",
        lastUpdated: "Laatst nagekeken: 21 juli 2026",
        intro:
          "RijVia is een onafhankelijk en gratis leerplatform dat helpt om de Belgische rijtheorie gestructureerd en toegankelijk te bestuderen.",
        sections: [
          {
            title: "Waarom RijVia bestaat",
            paragraphs: [
              "Belgische rijtheorie is verspreid over wettelijke regels, regionale examenrichtlijnen, verkeersborden en praktijksituaties. RijVia brengt studiemateriaal, oefeningen en voortgang samen zonder te beweren officiële instanties te vervangen.",
            ],
          },
          {
            title: "Missie en visie",
            paragraphs: [
              "Onze missie is betrouwbare voorbereiding begrijpelijker te maken over taalgrenzen heen. Onze visie is een leeromgeving waarin elke uitleg traceerbaar, controleerbaar en aanpasbaar blijft wanneer Belgische regels veranderen.",
            ],
          },
          {
            title: "Wat het platform onderscheidt",
            paragraphs: [
              "RijVia combineert een nagekeken catalogus van 184 verkeersborden met gestructureerde lessen, oefeningen per categorie, examensimulaties en voortgangsinzichten. De inhoud komt uit canonieke bronbestanden en wordt op taal- en bestandsconsistentie gecontroleerd.",
            ],
          },
          {
            title: "Talen en toegankelijkheid",
            paragraphs: [
              "De interface en kerninhoud zijn beschikbaar in het Nederlands, Engels, Frans en Arabisch. Arabisch wordt van rechts naar links weergegeven; de andere talen van links naar rechts. Toegankelijkheid en heldere terminologie maken deel uit van de review.",
            ],
          },
          {
            title: "Werken met officiële bronnen",
            paragraphs: [
              "RijVia controleert educatieve inhoud aan de hand van officiële Belgische bronnen en houdt toekomstige regels apart. De bevoegde instanties en gepubliceerde wetgeving hebben altijd voorrang op een samenvatting op dit platform.",
            ],
            references: [
              {
                id: "MOB-BE-TRAFFIC-RULES",
                label: "FOD Mobiliteit en Vervoer: verkeersregels",
                url: OFFICIAL_URLS.trafficRules,
              },
              {
                id: "MOB-BE-FUTURE-ROAD-CODE",
                label: "FOD Mobiliteit en Vervoer: toekomstige Code van de openbare weg",
                url: OFFICIAL_URLS.futureRoadCode,
              },
            ],
          },
          {
            title: "Projectbeheer",
            paragraphs: [
              "RijVia is gemaakt en wordt onderhouden door Haydar Tarek. Het is geen overheidsdienst, examencentrum, rijschool of juridisch adviseur en suggereert geen band met Belgische exameninstanties.",
            ],
            references: [
              {
                id: "PROJECT-GITHUB",
                label: "Haydar Tarek op GitHub",
                url: "https://github.com/haydartarek",
              },
              {
                id: "PROJECT-LINKEDIN",
                label: "Haydar Tarek op LinkedIn",
                url: "https://www.linkedin.com/in/haydartarek-dev/",
              },
            ],
          },
        ],
      },
      privacy: {
        eyebrow: "Uw gegevens en rechten",
        title: "Privacybeleid",
        lastUpdated: "Laatst nagekeken: 3 augustus 2026",
        intro:
          "Dit beleid legt uit hoe RijVia persoonsgegevens verwerkt wanneer u de openbare website bezoekt, een account maakt, inlogt, studeert of contact opneemt.",
        sections: [
          {
            title: "1. Wie is verantwoordelijk?",
            paragraphs: [
              "Haydar Tarek is als beheerder van RijVia de verwerkingsverantwoordelijke voor de gegevens in dit beleid. Privacy- en rechtenverzoeken kunnen via het contactformulier worden ingediend met een duidelijk privacyonderwerp.",
            ],
          },
          {
            title: "2. Gegevens die we verwerken",
            paragraphs: [
              "Accountgegevens omvatten gebruikersnaam, volledige naam, e-mailadres, wachtwoordhash, rol, accountstatus en tijdstippen. Bij Google-login verwerken we alleen de identiteitsgegevens die nodig zijn om het account te maken of te koppelen. Leergegevens omvatten lesvoortgang, oefen- en examenpogingen, antwoorden, scores, zwakke punten, prestaties en meldingen.",
              "Contactgegevens omvatten naam, e-mailadres, onderwerp en bericht. Beperkte technische en beveiligingsgegevens kunnen in serverlogs worden verwerkt om de dienst te beheren, onderzoeken en beschermen. Als u toestemming geeft voor Analyse, verwerkt Google Analytics pseudonieme browser-, apparaat-, pagina-, sessie-, interactie-, verkeersbron- en locatiegegevens bij benadering; RijVia stuurt geen accountnaam, e-mailadres of interne gebruikers-ID mee. RijVia vraagt niet om betaalkaartgegevens.",
            ],
          },
          {
            title: "3. Doeleinden en rechtsgronden",
            paragraphs: [
              "Account- en leergegevens zijn nodig om de gevraagde dienst te leveren, gebruikers te authenticeren, voortgang te bewaren en resultaten te tonen. Als je Google-login kiest, ontvangt RijVia van Google alleen je geverifieerde naam en e-mailadres om je account aan te maken, te koppelen of je veilig aan te melden. RijVia verkoopt deze gegevens niet en deelt ze niet met derden voor advertenties. Beveiliging, fraudepreventie, diagnose en inhoudskwaliteit steunen op ons gerechtvaardigd belang in een veilig en betrouwbaar platform. Wettelijke verplichtingen gelden waar nodig. Optionele verwerking waarvoor toestemming vereist is, wordt niet geactiveerd zonder geldige toestemming.",
            ],
          },
          {
            title: "4. Authenticatie en cookies",
            paragraphs: [
              "In productie bewaart RijVia het ondertekende authenticatietoken in een Secure HttpOnly-cookie, zodat clientscripts het niet kunnen lezen. Een afzonderlijk CSRF-token beschermt wijzigende verzoeken. De taal blijft bewaard voor een consistente meertalige ervaring; het optionele thema wordt alleen na toestemming voor Voorkeuren opgeslagen. Google-login is optioneel en gebruikt kortlevende beveiligingscookies. Het volledige overzicht en de toestemmingskeuzes staan in het Cookiebeleid.",
            ],
          },
          {
            title: "5. Dienstverleners en doorgiften",
            paragraphs: [
              "De productiedienst gebruikt Hostinger voor frontend- en backendhosting en Supabase voor PostgreSQL. Google verzorgt de optionele login en, uitsluitend na toestemming voor Analyse, gebruiksmeting met Google Analytics. De login levert de geverifieerde naam en het e-mailadres voor het account; Analytics ontvangt geen RijVia-accountidentiteit. Deze dienstverleners kunnen infrastructuur in verschillende landen gebruiken onder hun eigen privacy- en doorgiftemaatregelen. RijVia verkoopt geen persoonsgegevens en gebruikt ze niet voor advertenties van derden.",
            ],
          },
          {
            title: "6. Bewaartermijnen",
            paragraphs: [
              "Account- en leergegevens blijven bewaard zolang het account actief is en worden verwijderd wanneer de accountverwijdering is voltooid, behalve wanneer beperkte gegevens nodig blijven voor beveiliging, geschillen of een wettelijke verplichting. Contactberichten blijven alleen zolang nodig voor antwoord en opvolging. Cookies verlopen volgens het Cookiebeleid; operationele logs volgen de beperkte termijn van de hostingprovider.",
            ],
          },
          {
            title: "7. Uw AVG-rechten",
            paragraphs: [
              "Onder de voorwaarden van de AVG kunt u inzage, correctie, wissing, beperking of overdraagbaarheid vragen en bezwaar maken. U kunt toestemming intrekken wanneer verwerking daarop berust. Verwijder uw account via het profiel of dien een ander verzoek in via Contact. U kunt ook een klacht indienen bij de Gegevensbeschermingsautoriteit.",
            ],
            references: [
              {
                id: "EU-GDPR-2016-679",
                label: "Verordening (EU) 2016/679 (AVG)",
                url: OFFICIAL_URLS.gdpr,
              },
              {
                id: "BE-DPA-DATA-RIGHTS",
                label: "Gegevensbeschermingsautoriteit: uw rechten",
                url: OFFICIAL_URLS.privacyRights,
              },
            ],
          },
          {
            title: "8. Beveiliging, wijzigingen en contact",
            paragraphs: [
              "Wachtwoorden worden gehasht, productie gebruikt HTTPS en toegangscontroles beschermen account- en beheerfuncties. Geen enkele online dienst kan absolute veiligheid garanderen. Bij wezenlijke wijzigingen aan verwerking of providers werken we dit beleid en de datum bij. Gebruik Contact voor privacyvragen.",
            ],
          },
        ],
      },
      cookies: {
        eyebrow: "Transparantie over browseropslag",
        title: "Cookiebeleid",
        lastUpdated: "Laatst nagekeken: 3 augustus 2026",
        intro:
          "RijVia gebruikt noodzakelijke cookies en browseropslag voor beveiliging, inloggen, taal en toestemmingskeuzes. Optionele voorkeuren en Google Analytics blijven uitgeschakeld totdat u toestemming geeft. Marketingdiensten worden niet gebruikt.",
        sections: [
          {
            title: "1. Reikwijdte",
            paragraphs: [
              "Cookies zijn kleine waarden die een website in de browser bewaart. Vergelijkbare technieken, zoals local storage, onthouden voorkeuren. Dit beleid vermeldt wat RijVia zelf gebruikt en waarom.",
            ],
          },
          {
            title: "2. Huidige noodzakelijke cookies",
            paragraphs: [
              "Deze cookies ondersteunen uitdrukkelijk gevraagde diensten en worden niet gebruikt voor advertenties of tracking tussen websites.",
            ],
            items: [
              "token — RijVia-domein, pad /, authenticatiesessie, HttpOnly, maximaal 7 dagen of tot eerdere tokenvervaldatum/uitloggen.",
              "csrf_token — RijVia-domein, pad /, beschermt wijzigende verzoeken, maximaal 7 dagen of tot uitloggen.",
              "readyroad_locale — RijVia-domein, pad /, onthoudt de gekozen taal, maximaal 1 jaar.",
              "google_oauth_state, google_oauth_code_verifier, google_oauth_mode en google_oauth_return_to — RijVia-domein, pad /, beveiligen optionele Google-login en worden na de callback gewist of verlopen na ongeveer 10 minuten.",
            ],
          },
          {
            title: "3. Browseropslag",
            paragraphs: [
              "readyroad_locale houdt de gekozen taal op de client beschikbaar. readyroad_cookie_consent bewaart versie 2, een tijdstip en de vier categorie-keuzes zonder persoonsgegevens. session_expired is een eenmalige vlag voor de tabsessie. current_exam is tijdelijke compatibiliteitsstatus en wordt verwijderd wanneer die ongeldig of voltooid is.",
              "readyroad_theme bewaart de lichte of donkere weergave alleen na toestemming voor Voorkeuren en wordt verwijderd wanneer die toestemming wordt ingetrokken. Deze waarden bevatten geen JWT of wachtwoord.",
            ],
          },
          {
            title: "4. Analyse en marketing",
            paragraphs: [
              "RijVia gebruikt Google Analytics 4 met Measurement ID G-1P4EJH6D2T alleen nadat u Analyse inschakelt. Het meet paginaweergaven, sessies, locatie bij benadering, browser- en apparaatgegevens, verkeersbronnen en interacties. Vóór toestemming worden geen Google Analytics-scripts of -verzoeken geladen. Google Consent Mode v2 weigert analytische en advertentieopslag standaard; advertenties, remarketing, socialmediapixels en profilering worden niet gebruikt. Toestemming voor Analyse kan de volgende first-partycookies aanmaken; bij intrekking worden ze verwijderd.",
            ],
            items: [
              "_ga — RijVia-domein, pad /, onderscheidt browsers voor geaggregeerde gebruiksmeting, maximaal 2 jaar of tot intrekking van toestemming voor Analyse.",
              "_ga_1P4EJH6D2T — RijVia-domein, pad /, bewaart de GA4-sessiestatus, maximaal 2 jaar of tot intrekking van toestemming voor Analyse.",
            ],
          },
          {
            title: "5. Toestemming en toekomstige wijzigingen",
            paragraphs: [
              "Strikt noodzakelijke opslag blijft actief om de gevraagde dienst te leveren. De banner biedt even toegankelijke keuzes voor alles accepteren, optionele weigeren en aanpassen. Toestemmingsversie 2 bewaart de keuze lokaal. Bij een nieuwe versie vraagt RijVia opnieuw. Een optionele dienst mag pas na toestemming voor de juiste categorie laden.",
            ],
            references: [
              {
                id: "BE-DPA-COOKIE-GUIDANCE",
                label: "Gegevensbeschermingsautoriteit: cookies en trackers",
                url: OFFICIAL_URLS.cookieGuidance,
              },
            ],
          },
          {
            title: "6. Opslag beheren",
            paragraphs: [
              "Gebruik Cookie-instellingen in de footer om toestemming op elk moment te bekijken, wijzigen of intrekken. Intrekken verwijdert niet-toegestane voorkeursopslag en Google Analytics-cookies, terwijl noodzakelijke functies blijven werken. Uitloggen verwijdert authenticatie- en CSRF-cookies; OAuth-cookies verdwijnen na de callback. Browsergegevens wissen reset ook de opgeslagen keuze.",
            ],
          },
        ],
      },
      terms: {
        eyebrow: "Regels voor RijVia",
        title: "Gebruiksvoorwaarden",
        lastUpdated: "Laatst nagekeken: 21 juli 2026",
        intro:
          "Deze voorwaarden gelden voor het gebruik van RijVia. Door het platform te gebruiken, stemt u in met rechtmatig gebruik en begrijpt u het onafhankelijke educatieve doel.",
        sections: [
          {
            title: "1. Dienst en geschiktheid",
            paragraphs: [
              "RijVia biedt studiemateriaal, verkeersborden, oefeningen, examensimulaties en voortgangstools voor Belgische rijtheorie. U moet deze voorwaarden rechtsgeldig kunnen aanvaarden; toezicht door een ouder of voogd geldt waar de wet dat vereist.",
            ],
          },
          {
            title: "2. Accounts",
            paragraphs: [
              "Geef juiste registratiegegevens, houd inloggegevens vertrouwelijk en meld vermoed misbruik. U bent verantwoordelijk voor activiteit via uw account. Accounts delen om voortgang of resultaten te manipuleren is niet toegestaan.",
            ],
          },
          {
            title: "3. Educatief karakter",
            paragraphs: [
              "RijVia is een studiehulpmiddel en geen officiële examendienst, rijschool, overheid of juridisch adviseur. Voltooiing, scores of aanbevelingen garanderen geen toelating tot of slagen voor een officieel examen.",
            ],
          },
          {
            title: "4. Toegestaan gebruik",
            paragraphs: [
              "Pogingen tot ongeautoriseerde toegang, verstoring, omzeiling van beveiliging, schadelijke inhoud, grootschalig scrapen, imitatie, misbruik van persoonsgegevens en schadelijk geautomatiseerd verkeer zijn verboden.",
            ],
          },
          {
            title: "5. Intellectuele eigendom",
            paragraphs: [
              "De originele software, interface, huisstijl, uitleg, vraagstructuur en overige originele materialen van RijVia zijn beschermd. Officiële wetgeving en openbaar verkeersbordmateriaal behouden hun eigen juridische status. Persoonlijk studiegebruik geeft geen recht op herpublicatie of commerciële exploitatie van originele RijVia-inhoud.",
            ],
          },
          {
            title: "6. Beschikbaarheid en wijzigingen",
            paragraphs: [
              "De dienst kan worden bijgewerkt, onderbroken of beperkt voor onderhoud, beveiliging, juridische afstemming of infrastructuur. We streven naar continuïteit maar garanderen geen ononderbroken werking. Belangrijke wijzigingen worden met een nieuwe datum gepubliceerd.",
            ],
          },
          {
            title: "7. Schorsing, beëindiging en verwijdering",
            paragraphs: [
              "Toegang kan worden beperkt of beëindigd bij ernstige of herhaalde schendingen, veiligheidsrisico's of inbreuk op rechten. U kunt stoppen en uw account via het profiel verwijderen. Dwingende wettelijke rechten blijven gelden.",
            ],
          },
          {
            title: "8. Aansprakelijkheid en recht",
            paragraphs: [
              "Voor zover wettelijk toegestaan is RijVia niet aansprakelijk voor examenbeslissingen, wetswijzigingen, verouderde gecachte inhoud of indirect verlies door gebruik van een educatieve samenvatting. Wettelijk niet-uitsluitbare aansprakelijkheid en consumentenrechten blijven bestaan. Belgisch recht geldt met eerbiediging van dwingende bescherming in het woonland van de gebruiker.",
            ],
          },
          {
            title: "9. Contact",
            paragraphs: [
              "Vragen over deze voorwaarden kunnen via de contactpagina worden ingediend. Gebruik een duidelijk onderwerp zodat het verzoek correct kan worden behandeld.",
            ],
          },
        ],
      },
      disclaimer: {
        eyebrow: "Belangrijke studiemelding",
        title: "Educatieve disclaimer",
        lastUpdated: "Laatst nagekeken: 21 juli 2026",
        intro:
          "RijVia ondersteunt studie en herhaling, maar vervangt geen Belgische wetgeving, officiële exameninstructies of advies van een bevoegde professional.",
        sections: [
          {
            title: "Onafhankelijk platform",
            paragraphs: [
              "RijVia is niet verbonden aan de federale of regionale overheid, politie, examencentra of rijscholen. Namen en links van instanties worden uitsluitend gebruikt om officiële bronnen te identificeren.",
            ],
          },
          {
            title: "Geen juridisch of professioneel advies",
            paragraphs: [
              "Uitleg, voorbeelden, quizzen en examensimulaties zijn educatieve samenvattingen. Ze zijn geen juridisch advies, bindende interpretatie, rijles of officiële beslissing. Raadpleeg bij een incident, sanctie, rijbewijskwestie of geschil de bevoegde instantie of adviseur.",
            ],
          },
          {
            title: "Regels en examens kunnen veranderen",
            paragraphs: [
              "Belgische verkeersregels en regionale examenprocedures kunnen wijzigen. Officiële wetgeving, actuele instructies, aanwezige verkeersborden en aanwijzingen van bevoegde personen hebben voorrang. De nieuwe Code van de openbare weg is momenteel gepland voor 1 juni 2027; toekomstige regels gelden niet vóór hun inwerkingtreding.",
            ],
            references: [
              {
                id: "MOB-BE-TRAFFIC-RULES",
                label: "FOD Mobiliteit en Vervoer: huidige verkeersregels",
                url: OFFICIAL_URLS.trafficRules,
              },
              {
                id: "MOB-BE-FUTURE-ROAD-CODE",
                label: "FOD Mobiliteit en Vervoer: Code van de openbare weg vanaf 1 juni 2027",
                url: OFFICIAL_URLS.futureRoadCode,
              },
            ],
          },
          {
            title: "Geen garantie op een examenresultaat",
            paragraphs: [
              "Oefenscores tonen alleen activiteit binnen RijVia en voorspellen of garanderen geen officieel resultaat. Formaat, score, voorwaarden en procedures kunnen per gewest, categorie, examencentrum en datum verschillen.",
            ],
          },
          {
            title: "Een correctie melden",
            paragraphs: [
              "Lijkt inhoud strijdig met een actuele officiële bron, stuur dan via Contact de pagina, taal, betwiste tekst en officiële referentie. Gedocumenteerde correcties volgen het content-governanceproces.",
            ],
          },
        ],
      },
    },
    faq: {
      eyebrow: "Helpcentrum",
      title: "Veelgestelde vragen",
      intro:
        "Snelle antwoorden over accounts, leermiddelen, talen, voortgang en de juridische status van RijVia-inhoud.",
      items: [
        {
          question: "Is RijVia gratis?",
          answer:
            "Ja. RijVia biedt het kernplatform momenteel zonder abonnement of betaalkaartvereiste aan.",
        },
        {
          question: "Heb ik een account nodig?",
          answer:
            "Openbare verkeersborden en lessen zijn zonder account beschikbaar. Een account is nodig om voortgang, pogingen, resultaten, zwakke punten en dashboardinformatie te bewaren.",
        },
        {
          question: "Welke talen zijn beschikbaar?",
          answer:
            "RijVia ondersteunt Nederlands, Engels, Frans en Arabisch. Arabisch wordt van rechts naar links weergegeven; de andere talen van links naar rechts.",
        },
        {
          question: "Wat is Smart Quiz of willekeurig oefenen?",
          answer:
            "Het selecteert oefenvragen volgens beschikbare categorieën en uw gekozen traject. Het is een studietool, geen officieel examen of juridische beoordeling.",
        },
        {
          question: "Zijn oefenexamens hetzelfde als het officiële examen?",
          answer:
            "Nee. Het zijn simulaties voor herhaling. Officiële vraagvormen, scoring, procedures en beslissingen vallen onder de bevoegde regionale instanties en examencentra.",
        },
        {
          question: "Hoe wordt voortgang berekend?",
          answer:
            "RijVia registreert voltooide lessen, oefenantwoorden, pogingen, scores en terugkerende zwakke punten van uw account. Dashboardcijfers vatten alleen activiteit binnen RijVia samen.",
        },
        {
          question: "Kan RijVia garanderen dat ik slaag?",
          answer:
            "Nee. Regelmatig studeren kan de voorbereiding verbeteren, maar een officieel resultaat kan niet worden gegarandeerd. Controleer steeds de actuele eisen voor uw gewest en rijbewijscategorie.",
        },
        {
          question: "Hoe wordt inhoud bijgewerkt?",
          answer:
            "Verkeersbordinhoud gebruikt canonieke bronbestanden en een governance-review van bronnen, terminologie, vertalingen en consistentie. Gedocumenteerde officiële wijzigingen worden voor publicatie nagekeken.",
        },
        {
          question: "Hoe verwijder ik mijn account of vraag ik mijn gegevens op?",
          answer:
            "Gebruik accountverwijdering in uw profiel. Voor inzage, correctie, overdracht, beperking, bezwaar of andere privacyverzoeken gebruikt u het contactformulier met een privacyonderwerp.",
        },
        {
          question: "Hoe meld ik een foutieve vraag of vertaling?",
          answer:
            "Gebruik Contact en vermeld bord- of lescode, pagina, taal, betwiste tekst en indien mogelijk een officiële bron.",
        },
      ],
      contactPrompt: "Nog hulp nodig?",
      contactLabel: "Contact met RijVia",
    },
  },
  fr: {
    breadcrumbHome: "Accueil",
    metadata: {
      about: {
        title: "À propos de RijVia",
        description:
          "Découvrez comment RijVia facilite l'étude de la théorie belge grâce à un contenu multilingue, des sources officielles et un entraînement structuré.",
        openGraphTitle: "À propos de RijVia | Théorie de conduite belge",
        openGraphDescription:
          "Découvrez la mission, l'approche multilingue, la politique de sources et le rôle pédagogique indépendant de RijVia.",
        imageAlt: "À propos de la plateforme RijVia",
      },
      contact: {
        title: "Contacter RijVia",
        description:
          "Contactez RijVia pour une aide de compte, l'accessibilité, une correction de contenu, une demande de confidentialité ou un retour.",
        openGraphTitle: "Contacter l'assistance RijVia",
        openGraphDescription:
          "Envoyez une demande d'aide, signalez un problème de contenu ou partagez un retour via le formulaire RijVia.",
        imageAlt: "Contacter l'assistance RijVia",
      },
      privacy: {
        title: "Politique de confidentialité",
        description:
          "Découvrez comment RijVia collecte, utilise, conserve et protège les données de compte, d'apprentissage, d'authentification et de contact.",
        openGraphTitle: "Politique de confidentialité RijVia",
        openGraphDescription:
          "Traitement des données personnelles, sécurité du compte, conservation, prestataires et droits RGPD chez RijVia.",
        imageAlt: "Politique de confidentialité RijVia",
      },
      cookies: {
        title: "Politique relative aux cookies",
        description:
          "Consultez les cookies nécessaires et facultatifs utilisés par RijVia pour la connexion, la langue, les préférences, Google et l'analyse soumise au consentement.",
        openGraphTitle: "Politique relative aux cookies RijVia",
        openGraphDescription:
          "Inventaire transparent des cookies RijVia, du stockage navigateur, de leurs finalités et durées.",
        imageAlt: "Politique relative aux cookies RijVia",
      },
      terms: {
        title: "Conditions d'utilisation",
        description:
          "Lisez les règles concernant les comptes RijVia, l'usage autorisé, le contenu pédagogique, la propriété intellectuelle et la disponibilité.",
        openGraphTitle: "Conditions d'utilisation RijVia",
        openGraphDescription:
          "Conditions applicables aux comptes, à l'usage responsable, aux contenus, à la disponibilité et à la responsabilité.",
        imageAlt: "Conditions d'utilisation RijVia",
      },
      disclaimer: {
        title: "Avertissement pédagogique",
        description:
          "Comprenez le rôle pédagogique indépendant de RijVia et la priorité de la loi belge et des autorités officielles.",
        openGraphTitle: "Avertissement pédagogique RijVia",
        openGraphDescription:
          "RijVia aide à étudier sans remplacer la législation belge, les instructions officielles ou un conseil professionnel.",
        imageAlt: "Avertissement pédagogique RijVia",
      },
      faq: {
        title: "Questions fréquentes",
        description:
          "Trouvez des réponses sur les comptes RijVia, l'accès gratuit, les leçons, panneaux, exercices, examens, progrès, langues et mises à jour.",
        openGraphTitle: "Questions fréquentes sur RijVia",
        openGraphDescription:
          "Réponses sur l'étude de la théorie belge avec RijVia : comptes, entraînement, progrès et langues.",
        imageAlt: "Questions fréquentes sur RijVia",
      },
    },
    documents: {
      about: {
        eyebrow: "Plateforme pédagogique indépendante",
        title: "À propos de RijVia",
        lastUpdated: "Dernière vérification : 21 juillet 2026",
        intro:
          "RijVia est une plateforme indépendante et gratuite qui aide à étudier la théorie de conduite belge de manière structurée et accessible.",
        sections: [
          {
            title: "Pourquoi RijVia existe",
            paragraphs: [
              "La théorie belge est répartie entre règles juridiques, consignes régionales d'examen, panneaux et situations pratiques. RijVia réunit étude, entraînement et suivi dans une expérience cohérente sans prétendre remplacer les autorités officielles.",
            ],
          },
          {
            title: "Mission et vision",
            paragraphs: [
              "Notre mission est de rendre une préparation fiable plus compréhensible au-delà des barrières linguistiques. Notre vision est un environnement où chaque explication reste traçable, vérifiable et améliorable lorsque les règles belges évoluent.",
            ],
          },
          {
            title: "Ce qui distingue la plateforme",
            paragraphs: [
              "RijVia associe un catalogue vérifié de 184 panneaux à des leçons structurées, des exercices par catégorie, des simulations d'examen et un suivi des progrès. Le contenu provient de fichiers canoniques et fait l'objet de contrôles de cohérence entre langues et fichiers.",
            ],
          },
          {
            title: "Langues et accessibilité",
            paragraphs: [
              "L'interface et le contenu principal sont disponibles en français, néerlandais, anglais et arabe. L'arabe s'affiche de droite à gauche, les autres langues de gauche à droite. L'accessibilité et une terminologie claire font partie de la révision.",
            ],
          },
          {
            title: "Approche fondée sur les sources officielles",
            paragraphs: [
              "RijVia vérifie le contenu pédagogique auprès de sources officielles belges et sépare les règles futures. Les autorités compétentes et les textes publiés priment toujours sur un résumé de la plateforme.",
            ],
            references: [
              {
                id: "MOB-BE-TRAFFIC-RULES",
                label: "SPF Mobilité et Transports : règles de circulation",
                url: OFFICIAL_URLS.trafficRules,
              },
              {
                id: "MOB-BE-FUTURE-ROAD-CODE",
                label: "SPF Mobilité et Transports : futur Code de la voie publique",
                url: OFFICIAL_URLS.futureRoadCode,
              },
            ],
          },
          {
            title: "Responsable du projet",
            paragraphs: [
              "RijVia est créé et maintenu par Haydar Tarek. Ce n'est ni un organisme public, ni un centre d'examen, ni une auto-école, ni un conseiller juridique, et aucune affiliation avec les autorités d'examen n'est suggérée.",
            ],
            references: [
              {
                id: "PROJECT-GITHUB",
                label: "Haydar Tarek sur GitHub",
                url: "https://github.com/haydartarek",
              },
              {
                id: "PROJECT-LINKEDIN",
                label: "Haydar Tarek sur LinkedIn",
                url: "https://www.linkedin.com/in/haydartarek-dev/",
              },
            ],
          },
        ],
      },
      privacy: {
        eyebrow: "Vos données et vos droits",
        title: "Politique de confidentialité",
        lastUpdated: "Dernière vérification : 3 août 2026",
        intro:
          "Cette politique explique comment RijVia traite les données personnelles lorsque vous consultez le site public, créez un compte, vous connectez, étudiez ou nous contactez.",
        sections: [
          {
            title: "1. Responsable du traitement",
            paragraphs: [
              "Haydar Tarek, en tant qu'opérateur de RijVia, est responsable du traitement décrit ici. Les demandes relatives à la vie privée et aux droits peuvent être envoyées via le formulaire de contact avec un objet explicite.",
            ],
          },
          {
            title: "2. Données traitées",
            paragraphs: [
              "Les données de compte comprennent le nom d'utilisateur, le nom complet, l'adresse e-mail, le hash du mot de passe, le rôle, l'état du compte et les horodatages. Si vous choisissez la connexion Google, RijVia reçoit uniquement votre nom vérifié et votre adresse e-mail afin de créer, lier ou ouvrir votre compte en toute sécurité. RijVia ne vend pas ces informations et ne les partage pas avec des tiers à des fins publicitaires. Les données d'apprentissage comprennent la progression, les tentatives, les réponses, les scores, les points faibles, les réussites et les notifications.",
              "Les données de contact comprennent nom, e-mail, objet et message. Des données techniques et de sécurité limitées peuvent figurer dans les journaux pour exploiter, diagnostiquer et protéger le service. Si vous consentez à l'Analyse, Google Analytics traite des données pseudonymes relatives au navigateur, à l'appareil, aux pages, aux sessions, aux interactions, aux sources de trafic et à la localisation approximative ; RijVia ne lui envoie ni nom de compte, ni adresse e-mail, ni identifiant utilisateur interne. RijVia ne demande aucune donnée de carte bancaire.",
            ],
          },
          {
            title: "3. Finalités et bases juridiques",
            paragraphs: [
              "Les données de compte et d'apprentissage servent à fournir le service demandé, authentifier, enregistrer la progression et afficher les résultats. Sécurité, prévention des abus, diagnostic et qualité reposent sur notre intérêt légitime à exploiter un service sûr. Les obligations légales s'appliquent lorsque nécessaire. Tout traitement facultatif exigeant un consentement ne sera pas activé sans consentement valable.",
            ],
          },
          {
            title: "4. Authentification et cookies",
            paragraphs: [
              "En production, le jeton signé est placé dans un cookie Secure HttpOnly inaccessible aux scripts du navigateur. Un jeton CSRF distinct protège les requêtes de modification. La langue est conservée pour une expérience multilingue cohérente ; le thème facultatif n'est enregistré qu'après consentement aux Préférences. Google est facultatif et utilise de courts cookies de sécurité. L'inventaire et les contrôles figurent dans la Politique relative aux cookies.",
            ],
          },
          {
            title: "5. Prestataires et transferts",
            paragraphs: [
              "Le service utilise Hostinger pour l'hébergement du frontend et du backend et Supabase pour PostgreSQL. Google fournit la connexion facultative et, uniquement après consentement à l'Analyse, la mesure d'usage avec Google Analytics. La connexion transmet le nom vérifié et l'adresse e-mail nécessaires au compte ; Analytics ne reçoit aucune identité de compte RijVia. Ces prestataires peuvent exploiter une infrastructure dans différents pays selon leurs garanties. RijVia ne vend pas de données et ne les utilise pas pour la publicité de tiers.",
            ],
          },
          {
            title: "6. Conservation",
            paragraphs: [
              "Les données de compte et d'apprentissage sont conservées tant que le compte est actif puis supprimées à l'issue de sa suppression, sauf conservation limitée requise pour la sécurité, un litige ou la loi. Les messages sont gardés le temps nécessaire pour répondre. Les cookies expirent selon la Politique relative aux cookies et les journaux suivent la durée limitée de l'hébergeur.",
            ],
          },
          {
            title: "7. Vos droits RGPD",
            paragraphs: [
              "Selon les conditions du RGPD, vous pouvez demander accès, rectification, effacement, limitation ou portabilité, et vous opposer au traitement. Vous pouvez retirer un consentement. Supprimez le compte via le profil ou adressez une autre demande via Contact. Vous pouvez aussi introduire une plainte auprès de l'Autorité de protection des données.",
            ],
            references: [
              {
                id: "EU-GDPR-2016-679",
                label: "Règlement (UE) 2016/679 (RGPD)",
                url: OFFICIAL_URLS.gdpr,
              },
              {
                id: "BE-DPA-DATA-RIGHTS",
                label: "Autorité de protection des données : vos droits",
                url: OFFICIAL_URLS.privacyRights,
              },
            ],
          },
          {
            title: "8. Sécurité, modifications et contact",
            paragraphs: [
              "Les mots de passe sont hachés, la production utilise HTTPS et des contrôles d'accès protègent les fonctions sensibles. Aucun service en ligne ne garantit une sécurité absolue. Toute modification importante sera publiée avec une nouvelle date. Utilisez Contact pour toute question.",
            ],
          },
        ],
      },
      cookies: {
        eyebrow: "Transparence du stockage navigateur",
        title: "Politique relative aux cookies",
        lastUpdated: "Dernière vérification : 3 août 2026",
        intro:
          "RijVia utilise les cookies et le stockage nécessaires à la sécurité, à la connexion, à la langue et aux choix de consentement. Les préférences facultatives et Google Analytics restent désactivés jusqu'à votre consentement. Aucun service marketing n'est utilisé.",
        sections: [
          {
            title: "1. Champ d'application",
            paragraphs: [
              "Un cookie est une petite valeur enregistrée dans le navigateur. Des techniques similaires, comme le stockage local, mémorisent des préférences. Cette politique décrit ce que RijVia utilise directement et pourquoi.",
            ],
          },
          {
            title: "2. Cookies essentiels actuels",
            paragraphs: [
              "Ces cookies fournissent des services expressément demandés et ne servent ni à la publicité ni au suivi entre sites.",
            ],
            items: [
              "token — domaine RijVia, chemin /, session d'authentification, HttpOnly, jusqu'à 7 jours ou expiration/déconnexion antérieure.",
              "csrf_token — domaine RijVia, chemin /, protège les requêtes de modification, jusqu'à 7 jours ou déconnexion.",
              "readyroad_locale — domaine RijVia, chemin /, mémorise la langue, jusqu'à 1 an.",
              "google_oauth_state, google_oauth_code_verifier, google_oauth_mode et google_oauth_return_to — domaine RijVia, chemin /, sécurisent la connexion Google facultative et sont effacés après le retour ou expirent après environ 10 minutes.",
            ],
          },
          {
            title: "3. Stockage du navigateur",
            paragraphs: [
              "readyroad_locale conserve la langue côté client. readyroad_cookie_consent enregistre la version 2, un horodatage et les quatre choix de catégorie sans donnée personnelle. session_expired est un indicateur ponctuel limité à l'onglet. current_exam est un état transitoire de compatibilité supprimé lorsqu'il est invalide ou terminé.",
              "readyroad_theme conserve l'affichage clair ou sombre uniquement après consentement aux Préférences et est supprimé au retrait. Ces valeurs ne contiennent ni JWT ni mot de passe.",
            ],
          },
          {
            title: "4. Analyse et marketing",
            paragraphs: [
              "RijVia utilise Google Analytics 4 avec l'identifiant de mesure G-1P4EJH6D2T uniquement après activation de l'Analyse. Il mesure les pages vues, les sessions, la localisation approximative, les informations sur le navigateur et l'appareil, les sources de trafic et les interactions. Avant votre consentement, aucun script ni aucune requête Google Analytics n'est chargé. Google Consent Mode v2 refuse par défaut le stockage analytique et publicitaire ; RijVia n'utilise ni publicité, ni remarketing, ni pixel social, ni profilage. Le consentement à l'Analyse peut créer les cookies internes suivants, supprimés lors du retrait.",
            ],
            items: [
              "_ga — domaine RijVia, chemin /, distingue les navigateurs pour la mesure agrégée de l'usage, jusqu'à 2 ans ou jusqu'au retrait du consentement à l'Analyse.",
              "_ga_1P4EJH6D2T — domaine RijVia, chemin /, conserve l'état de session GA4, jusqu'à 2 ans ou jusqu'au retrait du consentement à l'Analyse.",
            ],
          },
          {
            title: "5. Consentement et évolutions",
            paragraphs: [
              "Le stockage strictement nécessaire reste actif pour fournir le service demandé. La bannière propose de manière équivalente Tout accepter, Refuser les options et Personnaliser. La version 2 conserve le choix localement ; une nouvelle version déclenche une nouvelle demande. Aucun service facultatif ne peut charger sans la catégorie correspondante.",
            ],
            references: [
              {
                id: "BE-DPA-COOKIE-GUIDANCE",
                label: "Autorité de protection des données : cookies et traceurs",
                url: OFFICIAL_URLS.cookieGuidance,
              },
            ],
          },
          {
            title: "6. Gérer le stockage",
            paragraphs: [
              "Utilisez Paramètres des cookies dans le pied de page pour revoir, modifier ou retirer votre consentement. Le retrait supprime le stockage facultatif refusé et les cookies Google Analytics sans interrompre les fonctions nécessaires. La déconnexion supprime les cookies d'authentification et CSRF ; les cookies OAuth sont effacés après le retour. Effacer les données du navigateur réinitialise aussi le choix.",
            ],
          },
        ],
      },
      terms: {
        eyebrow: "Règles d'utilisation de RijVia",
        title: "Conditions d'utilisation",
        lastUpdated: "Dernière vérification : 21 juillet 2026",
        intro:
          "Ces conditions régissent RijVia. En utilisant la plateforme, vous acceptez un usage licite et reconnaissez son objectif pédagogique indépendant.",
        sections: [
          {
            title: "1. Service et capacité",
            paragraphs: [
              "RijVia propose des supports, panneaux, exercices, examens simulés et outils de progression pour la théorie belge. Vous devez pouvoir accepter ces conditions; la supervision d'un parent ou tuteur s'applique lorsque la loi l'exige.",
            ],
          },
          {
            title: "2. Comptes",
            paragraphs: [
              "Fournissez des informations exactes, gardez vos identifiants confidentiels et signalez tout abus. Vous êtes responsable de l'activité de votre compte. Le partage visant à manipuler progression ou résultats est interdit.",
            ],
          },
          {
            title: "3. Nature pédagogique",
            paragraphs: [
              "RijVia est une aide à l'étude, pas un service officiel d'examen, une auto-école, une autorité ou un conseiller juridique. Achèvement, scores et recommandations ne garantissent ni admission ni réussite officielle.",
            ],
          },
          {
            title: "4. Utilisation acceptable",
            paragraphs: [
              "Sont interdits : accès non autorisé, perturbation, contournement de sécurité, contenu malveillant, extraction massive, usurpation, abus de données personnelles et trafic automatisé nuisible.",
            ],
          },
          {
            title: "5. Propriété intellectuelle",
            paragraphs: [
              "Le logiciel, l'interface, la marque, les explications, la structure des questions et les autres créations RijVia sont protégés. Textes officiels et signalisation publique gardent leur statut propre. L'étude personnelle n'autorise pas la republication ni l'exploitation commerciale du contenu original.",
            ],
          },
          {
            title: "6. Disponibilité et modifications",
            paragraphs: [
              "Le service peut être mis à jour, interrompu ou limité pour maintenance, sécurité, conformité ou infrastructure. Nous visons la continuité sans garantir une disponibilité permanente. Les modifications importantes seront datées.",
            ],
          },
          {
            title: "7. Suspension, résiliation et suppression",
            paragraphs: [
              "L'accès peut être limité ou résilié en cas de violation grave ou répétée, de menace ou d'atteinte aux droits. Vous pouvez arrêter et supprimer votre compte via le profil. Les droits impératifs restent applicables.",
            ],
          },
          {
            title: "8. Responsabilité et droit applicable",
            paragraphs: [
              "Dans les limites légales, RijVia n'est pas responsable des décisions d'examen, changements de loi, contenus en cache devenus anciens ou pertes indirectes liées à un résumé éducatif. Rien n'exclut une responsabilité ou un droit du consommateur légalement impératif. Le droit belge s'applique sous réserve des protections obligatoires du pays de résidence.",
            ],
          },
          {
            title: "9. Contact",
            paragraphs: [
              "Les questions sur ces conditions peuvent être envoyées via la page Contact avec un objet clair.",
            ],
          },
        ],
      },
      disclaimer: {
        eyebrow: "Avis important pour l'étude",
        title: "Avertissement pédagogique",
        lastUpdated: "Dernière vérification : 21 juillet 2026",
        intro:
          "RijVia aide à étudier et réviser. Il ne remplace pas la législation belge, les instructions officielles ou l'avis d'un professionnel qualifié.",
        sections: [
          {
            title: "Plateforme indépendante",
            paragraphs: [
              "RijVia n'est affilié ni aux autorités fédérales ou régionales, ni à la police, aux centres d'examen ou aux auto-écoles. Les noms et liens servent seulement à identifier des sources officielles.",
            ],
          },
          {
            title: "Pas de conseil juridique ou professionnel",
            paragraphs: [
              "Explications, exemples, quiz et simulations sont des résumés pédagogiques, pas un avis juridique, une interprétation contraignante, un cours de conduite ou une décision officielle. Pour un incident, une sanction, un permis ou un litige, consultez l'autorité ou un professionnel compétent.",
            ],
          },
          {
            title: "Les règles et examens peuvent changer",
            paragraphs: [
              "Les règles belges et procédures régionales peuvent évoluer. Les textes officiels, instructions actuelles, panneaux sur place et ordres des agents compétents priment. Le nouveau Code de la voie publique est actuellement prévu pour le 1er juin 2027; une règle future ne doit pas être appliquée avant son entrée en vigueur.",
            ],
            references: [
              {
                id: "MOB-BE-TRAFFIC-RULES",
                label: "SPF Mobilité et Transports : règles actuelles",
                url: OFFICIAL_URLS.trafficRules,
              },
              {
                id: "MOB-BE-FUTURE-ROAD-CODE",
                label: "SPF Mobilité et Transports : Code de la voie publique au 1er juin 2027",
                url: OFFICIAL_URLS.futureRoadCode,
              },
            ],
          },
          {
            title: "Aucune garantie de résultat",
            paragraphs: [
              "Les scores RijVia reflètent uniquement l'activité sur la plateforme. Format, notation, admissibilité et procédures peuvent varier selon la région, la catégorie, le centre et la date.",
            ],
          },
          {
            title: "Signaler une correction",
            paragraphs: [
              "Si un contenu semble contredire une source officielle actuelle, indiquez via Contact la page, la langue, le texte contesté et la référence. Les corrections documentées suivent le processus de gouvernance.",
            ],
          },
        ],
      },
    },
    faq: {
      eyebrow: "Centre d'aide",
      title: "Questions fréquentes",
      intro:
        "Réponses rapides sur les comptes, outils d'étude, langues, progression et statut juridique du contenu RijVia.",
      items: [
        {
          question: "RijVia est-il gratuit ?",
          answer:
            "Oui. RijVia fournit actuellement sa plateforme principale sans abonnement ni carte de paiement.",
        },
        {
          question: "Faut-il un compte ?",
          answer:
            "Les panneaux et leçons publics sont accessibles sans compte. Un compte est nécessaire pour enregistrer progression, tentatives, résultats, points faibles et tableau de bord.",
        },
        {
          question: "Quelles langues sont disponibles ?",
          answer:
            "RijVia prend en charge le français, le néerlandais, l'anglais et l'arabe. L'arabe s'affiche de droite à gauche; les autres langues de gauche à droite.",
        },
        {
          question: "Qu'est-ce que Smart Quiz ou l'entraînement aléatoire ?",
          answer:
            "Il sélectionne des questions selon les catégories disponibles et le parcours choisi. C'est un outil d'étude, pas un examen officiel ni une évaluation juridique.",
        },
        {
          question: "Les examens d'entraînement sont-ils identiques à l'officiel ?",
          answer:
            "Non. Ce sont des simulations. Format, notation, procédures et décisions officiels relèvent des autorités régionales et centres compétents.",
        },
        {
          question: "Comment la progression est-elle calculée ?",
          answer:
            "RijVia enregistre les leçons terminées, réponses, tentatives, scores et points faibles du compte. Le tableau de bord résume uniquement l'activité RijVia.",
        },
        {
          question: "RijVia peut-il garantir ma réussite ?",
          answer:
            "Non. Une étude régulière peut améliorer la préparation, mais aucun résultat officiel n'est garanti. Vérifiez les exigences actuelles de votre région et catégorie.",
        },
        {
          question: "Comment le contenu est-il mis à jour ?",
          answer:
            "Les panneaux proviennent de sources canoniques et d'une gouvernance couvrant sources, terminologie, traductions et cohérence. Les changements officiels documentés sont vérifiés avant publication.",
        },
        {
          question: "Comment supprimer mon compte ou demander mes données ?",
          answer:
            "Utilisez la suppression dans le profil. Pour accès, correction, portabilité, limitation, opposition ou autre demande, utilisez Contact avec un objet relatif à la vie privée.",
        },
        {
          question: "Comment signaler une question ou traduction incorrecte ?",
          answer:
            "Utilisez Contact et indiquez le code du panneau ou de la leçon, la page, la langue, le texte et si possible une source officielle.",
        },
      ],
      contactPrompt: "Besoin d'une autre aide ?",
      contactLabel: "Contacter RijVia",
    },
  },
  ar: {
    breadcrumbHome: "الرئيسية",
    metadata: {
      about: {
        title: "عن RijVia",
        description:
          "تعرّف على طريقة RijVia في مساعدتك على دراسة قواعد السياقة البلجيكية من خلال محتوى متعدد اللغات ومصادر رسمية وتدريب منظم.",
        openGraphTitle: "عن RijVia | تعلّم قواعد السياقة البلجيكية",
        openGraphDescription:
          "اكتشف رسالة RijVia ونهجه متعدد اللغات وسياسة المصادر ودوره التعليمي المستقل.",
        imageAlt: "عن منصة RijVia التعليمية",
      },
      contact: {
        title: "التواصل مع RijVia",
        description:
          "تواصل مع RijVia لدعم الحساب أو الوصول أو تصحيح المحتوى أو طلبات الخصوصية أو ملاحظات المنصة.",
        openGraphTitle: "التواصل مع دعم RijVia",
        openGraphDescription:
          "أرسل طلب دعم أو بلّغ عن مشكلة في المحتوى أو شارك ملاحظاتك عبر نموذج RijVia.",
        imageAlt: "التواصل مع دعم RijVia",
      },
      privacy: {
        title: "سياسة الخصوصية",
        description:
          "اقرأ كيف تجمع RijVia بيانات الحساب والتعلم والمصادقة والتواصل وتستخدمها وتحفظها وتحميها وفق اللائحة العامة لحماية البيانات.",
        openGraphTitle: "سياسة خصوصية RijVia",
        openGraphDescription:
          "كيفية تعامل RijVia مع البيانات الشخصية وأمن الحساب والاحتفاظ ومقدمي الخدمة وحقوق GDPR.",
        imageAlt: "سياسة خصوصية RijVia",
      },
      cookies: {
        title: "سياسة ملفات الارتباط",
        description:
          "اطّلع على ملفات الارتباط الضرورية والاختيارية التي تستخدمها RijVia لتأمين الدخول واللغة والتفضيلات وتسجيل Google والتحليلات المشروطة بالموافقة.",
        openGraphTitle: "سياسة ملفات الارتباط في RijVia",
        openGraphDescription:
          "جرد شفاف لملفات ارتباط RijVia وتخزين المتصفح وأغراضها ومددها.",
        imageAlt: "سياسة ملفات الارتباط في RijVia",
      },
      terms: {
        title: "شروط الاستخدام",
        description:
          "اقرأ قواعد حسابات RijVia والاستخدام المقبول والمحتوى التعليمي والملكية الفكرية وتوفر الخدمة.",
        openGraphTitle: "شروط استخدام RijVia",
        openGraphDescription:
          "الشروط المنظمة للحسابات والاستخدام المسؤول والمواد التعليمية والتوفر والمسؤولية في RijVia.",
        imageAlt: "شروط استخدام RijVia",
      },
      disclaimer: {
        title: "إخلاء المسؤولية التعليمي",
        description:
          "افهم دور RijVia التعليمي المستقل ولماذا تبقى القوانين البلجيكية والجهات الرسمية هي المرجع الحاسم.",
        openGraphTitle: "إخلاء المسؤولية التعليمي في RijVia",
        openGraphDescription:
          "تساعد RijVia على الدراسة ولا تستبدل التشريع البلجيكي أو التعليمات الرسمية أو المشورة المهنية.",
        imageAlt: "إخلاء المسؤولية التعليمي في RijVia",
      },
      faq: {
        title: "الأسئلة الشائعة",
        description:
          "اعثر على إجابات حول حساب RijVia والوصول المجاني والدروس والعلامات والتدريب والامتحانات والتقدم واللغات والتحديثات.",
        openGraphTitle: "الأسئلة الشائعة عن RijVia",
        openGraphDescription:
          "إجابات عن دراسة قواعد السياقة البلجيكية في RijVia، بما فيها الحسابات والتدريب والتقدم واللغات.",
        imageAlt: "الأسئلة الشائعة عن RijVia",
      },
    },
    documents: {
      about: {
        eyebrow: "منصة تعليمية مستقلة",
        title: "عن RijVia",
        lastUpdated: "آخر مراجعة: 21 يوليو 2026",
        intro:
          "RijVia منصة تعليمية مستقلة ومجانية تساعدك على دراسة قواعد السياقة البلجيكية بطريقة منظمة وسهلة.",
        sections: [
          {
            title: "لماذا أُنشئت RijVia؟",
            paragraphs: [
              "تشمل قواعد السياقة البلجيكية الأحكام القانونية وإرشادات الامتحانات الإقليمية والعلامات المرورية والمواقف العملية. تجمع RijVia الدراسة والتدريب ومتابعة التقدم في مكان واحد، من دون أن تدّعي أنها بديل عن الجهات الرسمية.",
            ],
          },
          {
            title: "الرسالة والرؤية",
            paragraphs: [
              "رسالتنا هي تسهيل فهم التحضير الموثوق عبر الحواجز اللغوية. ورؤيتنا بيئة تعليمية يمكن تتبع كل شرح فيها ومراجعته وتطويره كلما تغيرت القواعد البلجيكية.",
            ],
          },
          {
            title: "ما الذي يميز المنصة؟",
            paragraphs: [
              "تجمع RijVia فهرسًا مُراجعًا يضم 184 علامة مرورية مع دروس منظمة وتدريب حسب الفئة ومحاكاة للامتحان ومؤشرات للتقدم. تُدار البيانات من ملفات مصدرية معيارية وتُفحص لضمان الاتساق بين اللغات والملفات.",
            ],
          },
          {
            title: "اللغات وإمكانية الوصول",
            paragraphs: [
              "تتوفر الواجهة والمحتوى التعليمي الأساسي بالعربية والهولندية والفرنسية والإنجليزية. تُعرض العربية من اليمين إلى اليسار، وبقية اللغات من اليسار إلى اليمين. وتدخل قابلية الوصول والمصطلحات الواضحة ضمن عملية المراجعة.",
            ],
          },
          {
            title: "الاعتماد على المصادر الرسمية",
            paragraphs: [
              "تراجع RijVia المحتوى التعليمي بالرجوع إلى المصادر البلجيكية الرسمية، وتفصل القوانين المستقبلية عن القانون النافذ. تبقى الجهة المختصة والنص القانوني المنشور مقدّمين دائمًا على أي ملخص في المنصة.",
            ],
            references: [
              {
                id: "MOB-BE-TRAFFIC-RULES",
                label: "الخدمة العامة الاتحادية للتنقل والنقل: قواعد المرور",
                url: OFFICIAL_URLS.trafficRules,
              },
              {
                id: "MOB-BE-FUTURE-ROAD-CODE",
                label: "الخدمة العامة الاتحادية للتنقل والنقل: قانون الطريق العام المستقبلي",
                url: OFFICIAL_URLS.futureRoadCode,
              },
            ],
          },
          {
            title: "إدارة المشروع",
            paragraphs: [
              "أنشأ Haydar Tarek منصة RijVia ويتولى صيانتها. المنصة ليست جهة حكومية أو مركز امتحان أو مدرسة قيادة أو مستشارًا قانونيًا، ولا تدّعي وجود ارتباط بجهات الامتحان البلجيكية.",
            ],
            references: [
              {
                id: "PROJECT-GITHUB",
                label: "Haydar Tarek على GitHub",
                url: "https://github.com/haydartarek",
              },
              {
                id: "PROJECT-LINKEDIN",
                label: "Haydar Tarek على LinkedIn",
                url: "https://www.linkedin.com/in/haydartarek-dev/",
              },
            ],
          },
        ],
      },
      privacy: {
        eyebrow: "بياناتك وحقوقك",
        title: "سياسة الخصوصية",
        lastUpdated: "آخر مراجعة: 3 أغسطس 2026",
        intro:
          "توضح هذه السياسة كيفية معالجة RijVia للبيانات الشخصية عند تصفح الموقع العام أو إنشاء حساب أو تسجيل الدخول أو الدراسة أو التواصل معنا.",
        sections: [
          {
            title: "1. المسؤول عن المعالجة",
            paragraphs: [
              "يُعد Haydar Tarek، بصفته مشغّل RijVia، مسؤول المعالجة للبيانات الموضحة في هذه السياسة. يمكن إرسال طلبات الخصوصية وحقوق البيانات عبر نموذج التواصل مع كتابة موضوع واضح يتعلق بالخصوصية.",
            ],
          },
          {
            title: "2. البيانات التي نعالجها",
            paragraphs: [
              "تشمل بيانات الحساب اسم المستخدم والاسم الكامل والبريد الإلكتروني وتجزئة كلمة المرور والدور وحالة الحساب والتواريخ. وعند اختيار تسجيل الدخول عبر Google، تستلم RijVia من Google اسمك الموثق وعنوان بريدك الإلكتروني فقط لإنشاء حسابك أو ربطه أو تسجيل دخولك بأمان. لا تبيع RijVia هذه المعلومات ولا تشاركها مع أطراف أخرى لأغراض إعلانية. وتشمل بيانات التعلم تقدم الدروس ومحاولات التدريب والامتحان والإجابات والدرجات ونقاط الضعف والإنجازات والإشعارات.",
              "تشمل بيانات التواصل الاسم والبريد والموضوع والرسالة. وقد تُعالج بيانات تقنية وأمنية محدودة في سجلات الخادم لتشغيل الخدمة وتشخيصها وحمايتها. وعند موافقتك على التحليلات، يعالج Google Analytics بيانات مستعارة عن المتصفح والجهاز والصفحات والجلسات والتفاعلات ومصادر الزيارة والموقع التقريبي؛ ولا ترسل إليه RijVia اسم الحساب أو البريد الإلكتروني أو معرّف المستخدم الداخلي. لا تطلب RijVia بيانات بطاقات الدفع.",
            ],
          },
          {
            title: "3. الأغراض والأسس القانونية",
            paragraphs: [
              "نعالج بيانات الحساب والتعلم لتقديم الخدمة المطلوبة والتحقق من المستخدم وحفظ التقدم وعرض النتائج. ويستند الأمن ومنع إساءة الاستخدام وتشخيص الخدمة وجودة المحتوى إلى مصلحتنا المشروعة في تشغيل منصة آمنة وموثوقة. تسري الالتزامات القانونية عند وجوبها. ولن تُفعّل أي معالجة اختيارية تحتاج إلى موافقة قبل الحصول على موافقة صحيحة.",
            ],
          },
          {
            title: "4. المصادقة وملفات الارتباط",
            paragraphs: [
              "تخزن RijVia في بيئة الإنتاج رمز المصادقة الموقّع داخل ملف ارتباط Secure وHttpOnly، فلا تستطيع برمجيات المتصفح قراءته. ويحمي رمز CSRF منفصل الطلبات التي تغيّر البيانات. تُحفظ اللغة لضمان تجربة متعددة اللغات، ولا يُحفظ المظهر الاختياري إلا بعد الموافقة على التفضيلات. تسجيل Google اختياري ويستخدم ملفات أمنية قصيرة المدة. يرد الجرد الكامل وأدوات التحكم في سياسة ملفات الارتباط.",
            ],
          },
          {
            title: "5. مقدمو الخدمة ونقل البيانات",
            paragraphs: [
              "تستخدم الخدمة Hostinger لاستضافة الواجهة والخادم الخلفي وSupabase لقاعدة PostgreSQL. ويوفّر Google تسجيل الدخول الاختياري، ويوفّر قياس الاستخدام عبر Google Analytics فقط بعد الموافقة على التحليلات. يرسل تسجيل الدخول الاسم الموثق والبريد اللازمين للحساب، بينما لا يتلقى Analytics هوية حساب RijVia. قد يشغّل هؤلاء المزودون بنية في بلدان مختلفة وفق ضماناتهم. لا تبيع RijVia البيانات الشخصية ولا تستخدمها لإعلانات الغير.",
            ],
          },
          {
            title: "6. مدة الاحتفاظ",
            paragraphs: [
              "تُحفظ بيانات الحساب والتعلم ما دام الحساب نشطًا، وتُحذف عند اكتمال حذف الحساب، باستثناء سجلات محدودة تقتضيها الحماية أو المنازعات أو التزام قانوني. تُحفظ رسائل التواصل بقدر الحاجة للرد والمتابعة. تنتهي ملفات الارتباط وفق سياستها، وتتبع السجلات التشغيلية المدة المحدودة التي يحددها مزود الاستضافة.",
            ],
          },
          {
            title: "7. حقوقك بموجب GDPR",
            paragraphs: [
              "وفق شروط اللائحة العامة لحماية البيانات، يمكنك طلب الوصول أو التصحيح أو المحو أو التقييد أو نقل البيانات أو الاعتراض على المعالجة. ويمكن سحب الموافقة حيث تعتمد المعالجة عليها. احذف حسابك من الملف الشخصي أو أرسل أي طلب آخر عبر صفحة التواصل. كما يمكنك تقديم شكوى إلى هيئة حماية البيانات البلجيكية.",
            ],
            references: [
              {
                id: "EU-GDPR-2016-679",
                label: "اللائحة (EU) 2016/679 لحماية البيانات",
                url: OFFICIAL_URLS.gdpr,
              },
              {
                id: "BE-DPA-DATA-RIGHTS",
                label: "هيئة حماية البيانات البلجيكية: حقوقك",
                url: OFFICIAL_URLS.privacyRights,
              },
            ],
          },
          {
            title: "8. الحماية والتغييرات والتواصل",
            paragraphs: [
              "تُجزأ كلمات المرور، ويُستخدم HTTPS في الإنتاج، وتحمي ضوابط الوصول وظائف الحساب والإدارة. لا يمكن لأي خدمة إلكترونية ضمان أمن مطلق. سنحدّث السياسة وتاريخها عند حدوث تغيير جوهري في المعالجة أو المزودين. استخدم صفحة التواصل للاستفسارات.",
            ],
          },
        ],
      },
      cookies: {
        eyebrow: "شفافية تخزين المتصفح",
        title: "سياسة ملفات الارتباط",
        lastUpdated: "آخر مراجعة: 3 أغسطس 2026",
        intro:
          "تستخدم RijVia ملفات الارتباط وتخزين المتصفح الضروريين للأمان وتسجيل الدخول واللغة وخيارات الموافقة. وتبقى التفضيلات الاختيارية وGoogle Analytics معطّلة حتى توافق عليها. ولا تُستخدم خدمات تسويقية.",
        sections: [
          {
            title: "1. نطاق السياسة",
            paragraphs: [
              "ملف الارتباط قيمة صغيرة يحفظها الموقع في المتصفح. ويمكن لتقنيات مشابهة، مثل التخزين المحلي، تذكر التفضيلات. توضح هذه السياسة ما تستخدمه RijVia مباشرة وسببه.",
            ],
          },
          {
            title: "2. ملفات الارتباط الضرورية الحالية",
            paragraphs: [
              "تدعم هذه الملفات خدمات يطلبها المستخدم صراحة، ولا تُستخدم للإعلان أو التتبع عبر المواقع.",
            ],
            items: [
              "token — نطاق RijVia، المسار /، جلسة المصادقة، HttpOnly، حتى 7 أيام أو انتهاء الرمز/تسجيل الخروج قبل ذلك.",
              "csrf_token — نطاق RijVia، المسار /، يحمي الطلبات التي تغيّر البيانات، حتى 7 أيام أو تسجيل الخروج.",
              "readyroad_locale — نطاق RijVia، المسار /، يتذكر اللغة المختارة، حتى سنة واحدة.",
              "google_oauth_state وgoogle_oauth_code_verifier وgoogle_oauth_mode وgoogle_oauth_return_to — نطاق RijVia، المسار /، تؤمّن محاولة Google الاختيارية وتُحذف بعد العودة أو تنتهي بعد نحو 10 دقائق.",
            ],
          },
          {
            title: "3. التخزين المحلي",
            paragraphs: [
              "يحفظ readyroad_locale اللغة في جهة العميل. ويحفظ readyroad_cookie_consent الإصدار 2 ووقت القرار وخيارات الفئات الأربع من دون بيانات شخصية. أما session_expired فهو مؤشر لمرة واحدة داخل جلسة علامة التبويب، وcurrent_exam حالة توافق مؤقتة تُحذف عند بطلانها أو اكتمالها.",
              "لا يحفظ readyroad_theme المظهر الفاتح أو الداكن إلا بعد الموافقة على التفضيلات، ويُحذف عند سحبها. لا تحتوي هذه القيم على JWT أو كلمة المرور.",
            ],
          },
          {
            title: "4. التحليلات والتسويق",
            paragraphs: [
              "تستخدم RijVia خدمة Google Analytics 4 بمعرّف القياس G-1P4EJH6D2T بعد تفعيلك للتحليلات فقط. وتقيس مشاهدات الصفحات والجلسات والموقع التقريبي ومعلومات المتصفح والجهاز ومصادر الزيارة والتفاعلات. ولا تُحمّل قبل الموافقة أي برمجية أو طلب تابع لـGoogle Analytics. يرفض Google Consent Mode v2 تخزين التحليلات والإعلانات افتراضيًا، ولا تستخدم RijVia الإعلانات أو إعادة الاستهداف أو بكسلات الشبكات الاجتماعية أو التنميط. قد تنشئ موافقة التحليلات ملفي الارتباط التاليين من الطرف الأول، ويُحذفان عند سحبها.",
            ],
            items: [
              "_ga — نطاق RijVia، المسار /، يميّز المتصفحات لقياس الاستخدام المجمّع، حتى سنتين أو إلى حين سحب موافقة التحليلات.",
              "_ga_1P4EJH6D2T — نطاق RijVia، المسار /، يحفظ حالة جلسة GA4، حتى سنتين أو إلى حين سحب موافقة التحليلات.",
            ],
          },
          {
            title: "5. الموافقة والتغييرات المستقبلية",
            paragraphs: [
              "يبقى التخزين الضروري مفعّلًا لتقديم الخدمة المطلوبة. يعرض الشريط خيارات قبول الكل ورفض الاختياري والتخصيص بوضوح متساوٍ. يحفظ الإصدار 2 القرار محليًا، ويُطلب القرار مجددًا عند تغيير الإصدار. لا يجوز تحميل أي خدمة اختيارية قبل الموافقة على فئتها.",
            ],
            references: [
              {
                id: "BE-DPA-COOKIE-GUIDANCE",
                label: "هيئة حماية البيانات البلجيكية: ملفات الارتباط وأدوات التتبع",
                url: OFFICIAL_URLS.cookieGuidance,
              },
            ],
          },
          {
            title: "6. إدارة التخزين",
            paragraphs: [
              "استخدم إعدادات ملفات الارتباط في التذييل لمراجعة الموافقة أو تعديلها أو سحبها في أي وقت. يحذف السحب تخزين التفضيلات غير المسموح به وملفات Google Analytics مع استمرار الوظائف الضرورية. يزيل تسجيل الخروج ملفي المصادقة وCSRF، وتُزال ملفات OAuth بعد العودة. كما يؤدي مسح بيانات المتصفح إلى إعادة ضبط القرار.",
            ],
          },
        ],
      },
      terms: {
        eyebrow: "قواعد استخدام RijVia",
        title: "شروط الاستخدام",
        lastUpdated: "آخر مراجعة: 21 يوليو 2026",
        intro:
          "تنظم هذه الشروط استخدام RijVia. وباستخدام المنصة، توافق على استعمالها بصورة قانونية وتفهم غرضها التعليمي المستقل.",
        sections: [
          {
            title: "1. الخدمة والأهلية",
            paragraphs: [
              "توفر RijVia مواد دراسية وعلامات مرورية وتدريبًا ومحاكاة للامتحان وأدوات لمتابعة التقدم في قواعد السياقة البلجيكية. يجب أن تكون قادرًا قانونيًا على قبول الشروط، ويشرف ولي الأمر حيث يقتضي القانون.",
            ],
          },
          {
            title: "2. الحسابات",
            paragraphs: [
              "قدّم بيانات صحيحة، وحافظ على سرية الدخول، وبلّغ سريعًا عن إساءة الاستخدام. أنت مسؤول عن النشاط عبر حسابك. ولا يجوز مشاركة الحساب للتلاعب بالتقدم أو النتائج.",
            ],
          },
          {
            title: "3. الطبيعة التعليمية",
            paragraphs: [
              "RijVia أداة تحضير وليست خدمة امتحان رسمية أو مدرسة قيادة أو جهة حكومية أو مستشارًا قانونيًا. ولا يضمن الإكمال أو الدرجات أو التوصيات دخول الامتحان الرسمي أو النجاح فيه.",
            ],
          },
          {
            title: "4. الاستخدام المقبول",
            paragraphs: [
              "يُحظر الوصول غير المصرح به أو تعطيل الخدمة أو تجاوز الحماية أو إرسال محتوى ضار أو النسخ الآلي واسع النطاق أو انتحال الآخرين أو إساءة استخدام البيانات أو توليد حركة آلية مؤذية.",
            ],
          },
          {
            title: "5. الملكية الفكرية",
            paragraphs: [
              "تحمي القواعد المطبقة برمجيات RijVia الأصلية وواجهتها وعلامتها وشروحاتها وبنية أسئلتها. وتبقى النصوص الرسمية ومواد العلامات العامة خاضعة لوضعها القانوني الخاص. لا يمنح الاستخدام الدراسي الشخصي حق إعادة نشر المحتوى الأصلي أو استغلاله تجاريًا.",
            ],
          },
          {
            title: "6. التوفر والتغييرات",
            paragraphs: [
              "قد تُحدّث الخدمة أو تتوقف أو تُقيّد لأسباب الصيانة أو الأمن أو المواءمة القانونية أو البنية التحتية. نسعى إلى الاستمرارية ولا نضمن توفرًا بلا انقطاع. تُنشر التغييرات الجوهرية بتاريخ جديد.",
            ],
          },
          {
            title: "7. التعليق والإنهاء والحذف",
            paragraphs: [
              "قد يُقيّد الوصول أو يُنهى عند المخالفة الخطيرة أو المتكررة أو تهديد الأمن أو حقوق الآخرين. يمكنك التوقف وحذف الحساب من ملفك الشخصي. تبقى الحقوق الإلزامية محفوظة.",
            ],
          },
          {
            title: "8. المسؤولية والقانون المطبق",
            paragraphs: [
              "بالقدر الذي يسمح به القانون، لا تتحمل RijVia مسؤولية قرارات الامتحان أو تغير القانون أو المحتوى المؤقت القديم أو الخسائر غير المباشرة الناتجة عن الاعتماد على ملخص تعليمي. لا تستبعد الشروط مسؤولية أو حقوق مستهلك لا يجوز استبعادها قانونًا. يسري القانون البلجيكي مع احترام الحماية الإلزامية في بلد إقامة المستخدم.",
            ],
          },
          {
            title: "9. التواصل",
            paragraphs: [
              "يمكن إرسال الأسئلة المتعلقة بالشروط عبر صفحة التواصل مع كتابة موضوع واضح.",
            ],
          },
        ],
      },
      disclaimer: {
        eyebrow: "تنبيه دراسي مهم",
        title: "إخلاء المسؤولية التعليمي",
        lastUpdated: "آخر مراجعة: 21 يوليو 2026",
        intro:
          "تدعم RijVia الدراسة والمراجعة، لكنها لا تستبدل التشريع البلجيكي أو تعليمات الامتحان الرسمية أو مشورة متخصص مؤهل.",
        sections: [
          {
            title: "منصة مستقلة",
            paragraphs: [
              "لا ترتبط RijVia بالحكومة الاتحادية أو الإقليمية أو الشرطة أو مراكز الامتحان أو مدارس تعليم السياقة. تُستخدم أسماء الجهات وروابطها فقط للتعريف بالمصادر الرسمية.",
            ],
          },
          {
            title: "ليست مشورة قانونية أو مهنية",
            paragraphs: [
              "الشروحات والأمثلة والاختبارات والمحاكاة ملخصات تعليمية وليست مشورة قانونية أو تفسيرًا ملزمًا أو درس قيادة أو قرار امتحان. في حادث أو عقوبة أو مسألة رخصة أو نزاع، راجع الجهة المختصة أو مستشارًا مؤهلًا.",
            ],
          },
          {
            title: "قد تتغير القواعد والامتحانات",
            paragraphs: [
              "قد تتغير قواعد المرور البلجيكية وإجراءات الامتحان الإقليمية. تتقدم النصوص الرسمية والتعليمات الحالية والعلامات الموجودة وتوجيهات المسؤولين المختصين. من المقرر حاليًا أن يدخل قانون الطريق العام الجديد حيز التنفيذ في 1 يونيو 2027؛ ولا تُعامل القواعد المستقبلية كقانون نافذ قبل تاريخها.",
            ],
            references: [
              {
                id: "MOB-BE-TRAFFIC-RULES",
                label: "الخدمة العامة الاتحادية للتنقل والنقل: القواعد الحالية",
                url: OFFICIAL_URLS.trafficRules,
              },
              {
                id: "MOB-BE-FUTURE-ROAD-CODE",
                label: "الخدمة العامة الاتحادية للتنقل والنقل: قانون الطريق العام من 1 يونيو 2027",
                url: OFFICIAL_URLS.futureRoadCode,
              },
            ],
          },
          {
            title: "لا ضمان لنتيجة الامتحان",
            paragraphs: [
              "تعكس درجات التدريب نشاطك داخل RijVia فقط، ولا تتنبأ بنتيجة رسمية ولا تضمنها. قد يختلف الشكل والتقييم والأهلية والإجراء حسب الإقليم والفئة والمركز والتاريخ.",
            ],
          },
          {
            title: "الإبلاغ عن تصحيح",
            paragraphs: [
              "إذا بدا أن محتوى يخالف مصدرًا رسميًا حاليًا، فأرسل عبر صفحة التواصل رابط الصفحة واللغة والنص المختلف والمصدر الرسمي. تمر التصحيحات الموثقة عبر نظام حوكمة المحتوى.",
            ],
          },
        ],
      },
    },
    faq: {
      eyebrow: "مركز المساعدة",
      title: "الأسئلة الشائعة",
      intro:
        "إجابات سريعة عن الحسابات وأدوات التعلم واللغات والتقدم والوضع القانوني لمحتوى RijVia.",
      items: [
        {
          question: "هل RijVia مجانية؟",
          answer:
            "نعم. توفر RijVia حاليًا منصتها التعليمية الأساسية دون اشتراك أو طلب بيانات بطاقة دفع.",
        },
        {
          question: "هل أحتاج إلى حساب؟",
          answer:
            "يمكن تصفح العلامات والدروس العامة دون حساب. يلزم الحساب لحفظ التقدم والمحاولات والنتائج ونقاط الضعف ومعلومات لوحة التحكم.",
        },
        {
          question: "ما اللغات المتاحة؟",
          answer:
            "تدعم RijVia العربية والهولندية والفرنسية والإنجليزية. تُعرض العربية من اليمين إلى اليسار وبقية اللغات من اليسار إلى اليمين.",
        },
        {
          question: "ما Smart Quiz أو التدريب العشوائي؟",
          answer:
            "يختار أسئلة تدريبية بحسب الفئات المتاحة والمسار الذي اخترته. وهو أداة دراسة وليس امتحانًا رسميًا أو تقييمًا قانونيًا.",
        },
        {
          question: "هل الامتحانات التدريبية مطابقة للامتحان الرسمي؟",
          answer:
            "لا. هي محاكاة للمراجعة، أما الشكل والتقييم والإجراءات والقرارات الرسمية فتحددها الجهات الإقليمية ومراكز الامتحان المختصة.",
        },
        {
          question: "كيف يُحسب التقدم؟",
          answer:
            "تسجل RijVia الدروس المكتملة والإجابات والمحاولات والدرجات ونقاط الضعف المرتبطة بحسابك. تلخص لوحة التحكم النشاط داخل RijVia فقط.",
        },
        {
          question: "هل تضمن RijVia نجاحي؟",
          answer:
            "لا. قد تحسن الدراسة المنتظمة استعدادك، لكن لا يمكن ضمان نتيجة رسمية. تحقق دائمًا من الشروط الحالية في إقليمك وفئة رخصتك.",
        },
        {
          question: "كيف يُحدّث المحتوى؟",
          answer:
            "تستخدم بيانات العلامات مصادر معيارية ونظام حوكمة يفحص المصادر والمصطلحات والترجمات والاتساق. تُراجع التغييرات الرسمية الموثقة قبل النشر.",
        },
        {
          question: "كيف أحذف حسابي أو أطلب بياناتي؟",
          answer:
            "استخدم خيار حذف الحساب في ملفك الشخصي. وللوصول أو التصحيح أو النقل أو التقييد أو الاعتراض أو أي طلب خصوصية آخر، استخدم نموذج التواصل بموضوع متعلق بالخصوصية.",
        },
        {
          question: "كيف أبلّغ عن سؤال أو ترجمة خاطئة؟",
          answer:
            "استخدم صفحة التواصل واذكر رمز العلامة أو الدرس ورابط الصفحة واللغة والنص المختلف، وأرفق مصدرًا رسميًا إن توفر.",
        },
      ],
      contactPrompt: "هل ما زلت تحتاج إلى مساعدة؟",
      contactLabel: "تواصل مع RijVia",
    },
  },
};

export function getPublicMetadata(
  language: Language,
  page: PublicPageKey,
): PublicMetadataCopy {
  return PUBLIC_CONTENT[language].metadata[page];
}

export function getPublicDocument(
  language: Language,
  page: PublicDocumentKey,
): PublicDocument {
  return PUBLIC_CONTENT[language].documents[page];
}

export function getFaqContent(language: Language): FaqContent {
  return PUBLIC_CONTENT[language].faq;
}

export function getPublicBreadcrumbHome(language: Language): string {
  return PUBLIC_CONTENT[language].breadcrumbHome;
}

export function getAllPublicContent(): Record<Language, PublicLocaleBundle> {
  return PUBLIC_CONTENT;
}
