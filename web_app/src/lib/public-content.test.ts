import {
  PUBLIC_CONTACT,
  getAllPublicContent,
  type PublicDocumentKey,
  type PublicPageKey,
} from "@/lib/public-content";
import type { Language } from "@/lib/constants";
import { ALL_MESSAGES } from "@/lib/messages";

const LANGUAGES: Language[] = ["en", "nl", "fr", "ar"];
const PAGE_KEYS: PublicPageKey[] = [
  "about",
  "contact",
  "privacy",
  "cookies",
  "terms",
  "disclaimer",
  "faq",
];
const DOCUMENT_KEYS: PublicDocumentKey[] = [
  "about",
  "privacy",
  "cookies",
  "terms",
  "disclaimer",
];
const PLACEHOLDER_PATTERN =
  /\b(?:todo|tbd|lorem ipsum|placeholder|coming soon)\b|\.\.\./i;

describe("public content governance", () => {
  const content = getAllPublicContent();

  it("uses the approved RijVia public contact identity", () => {
    expect(PUBLIC_CONTACT.email).toBe("info@rijvia.be");
    expect(JSON.stringify(content)).not.toContain("heydertarek2000@gmail.com");
  });

  it("identifies RijVia and explains Google sign-in on every homepage", () => {
    for (const language of LANGUAGES) {
      expect(ALL_MESSAGES[language]["home.hero.headline"]).toContain(
        "RijVia",
      );
      expect(ALL_MESSAGES[language]["home.hero.subtitle"].trim()).not.toBe("");
      expect(ALL_MESSAGES[language]["home.hero.privacy"]).toContain("Google");
    }
  });

  it("contains complete, unique metadata in every supported language", () => {
    for (const language of LANGUAGES) {
      const titles = new Set<string>();
      const descriptions = new Set<string>();

      for (const page of PAGE_KEYS) {
        const metadata = content[language].metadata[page];
        expect(metadata.title.trim()).not.toBe("");
        expect(metadata.description.length).toBeGreaterThanOrEqual(70);
        expect(metadata.description.length).toBeLessThanOrEqual(180);
        expect(metadata.openGraphTitle.trim()).not.toBe("");
        expect(metadata.openGraphDescription.trim()).not.toBe("");
        expect(metadata.imageAlt.trim()).not.toBe("");
        expect(metadata.description).not.toMatch(PLACEHOLDER_PATTERN);
        titles.add(metadata.title);
        descriptions.add(metadata.description);
      }

      expect(titles.size).toBe(PAGE_KEYS.length);
      expect(descriptions.size).toBe(PAGE_KEYS.length);
    }
  });

  it("contains reviewed documents with no placeholders or invented mailboxes", () => {
    for (const language of LANGUAGES) {
      for (const page of DOCUMENT_KEYS) {
        const document = content[language].documents[page];
        expect(document.title.trim()).not.toBe("");
        expect(document.lastUpdated).toMatch(/2026/);
        expect(document.intro).not.toMatch(PLACEHOLDER_PATTERN);
        expect(document.sections.length).toBeGreaterThanOrEqual(5);

        const serialized = JSON.stringify(document);
        expect(serialized).not.toMatch(PLACEHOLDER_PATTERN);
        expect(serialized).not.toContain("support@readyroad.be");
        expect(serialized).not.toContain("privacy@readyroad.be");

        for (const section of document.sections) {
          expect(section.title.trim()).not.toBe("");
          expect(section.paragraphs.length).toBeGreaterThan(0);
          expect(section.paragraphs.every((value) => value.trim().length > 0)).toBe(
            true,
          );
          for (const reference of section.references ?? []) {
            expect(reference.id.trim()).not.toBe("");
            expect(reference.url).toMatch(/^https:\/\//);
          }
        }
      }
    }
  });

  it("keeps visible FAQ content complete and unambiguous in every language", () => {
    for (const language of LANGUAGES) {
      const faq = content[language].faq;
      expect(faq.items).toHaveLength(10);
      expect(new Set(faq.items.map((item) => item.question)).size).toBe(10);
      for (const item of faq.items) {
        expect(item.question.trim()).not.toBe("");
        expect(item.answer.length).toBeGreaterThan(40);
        expect(`${item.question} ${item.answer}`).not.toMatch(
          PLACEHOLDER_PATTERN,
        );
      }
    }
  });

  it("documents the current cookie inventory without claiming active tracking", () => {
    for (const language of LANGUAGES) {
      const serialized = JSON.stringify(content[language].documents.cookies);
      expect(serialized).toContain("token");
      expect(serialized).toContain("csrf_token");
      expect(serialized).toContain("rijvia_locale");
      expect(serialized).toContain("rijvia_theme");
      expect(serialized).toContain("google_oauth_state");
    }
  });

  it("provides translated navigation labels for every public page", () => {
    const keys = [
      "nav.about",
      "nav.faq",
      "home.footer.about",
      "home.footer.faq",
      "home.footer.cookies",
      "home.footer.disclaimer_link",
      "home.footer.operator",
    ];

    for (const language of LANGUAGES) {
      for (const key of keys) {
        expect(ALL_MESSAGES[language][key]?.trim()).toBeTruthy();
      }
    }
  });
});
