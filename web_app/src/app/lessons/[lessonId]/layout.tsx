import { getRequestLocale } from "@/lib/server/request-locale";
import type { Metadata } from "next";
import { getLocalizedLessonSeo } from "@/lib/learning-seo-copy";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
} from "@/lib/site-copy";
import { buildAbsoluteUrl, toBrandedMetadataTitle, toMetadataDescription } from "@/lib/seo";
import { getPublicLesson } from "@/lib/server/public-catalog";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

type LessonLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ lessonId: string }>;
}>;

export async function generateMetadata({
  params,
}: Pick<LessonLayoutProps, "params">): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getPublicLesson(lessonId);

  if (!lesson) {
    return {
      title: { absolute: "Lesson Not Found | Rijvia" },
      robots: { index: false, follow: false },
    };
  }

  const locale = await getRequestLocale();
  const copy = getLocalizedLessonSeo(lesson, locale);

  const routePath = `/lessons/${encodeURIComponent(lesson.lessonCode)}`;
  const canonical = buildLocalizedUrl(routePath, locale, APP_URL);
  const isDutchLesson24CtrPilot = locale === "nl" && lesson.lessonCode === "les-24";
  const isArabicLesson14CtrPilot = locale === "ar" && lesson.lessonCode === "les-14";
  const isDutchLesson16CtrPilot = locale === "nl" && lesson.lessonCode === "les-16";
  const isDutchLesson12CtrPilot = locale === "nl" && lesson.lessonCode === "les-12";
  const description = toMetadataDescription(
    isDutchLesson24CtrPilot
      ? "Wat betekent verkeersbord D1? Leer het verschil tussen verplichte rijrichting en eenrichtingsweg, met uitleg over verkeersborden en hindernissen in België."
      : isArabicLesson14CtrPilot
        ? "ما الفرق بين مسافة التوقف ومسافة الفرملة؟ تعرّف على زمن رد الفعل ومسافة رد الفعل ومسافة الأمان، وكيف ترتبط هذه المفاهيم بقواعد السياقة النظرية في بلجيكا."
        : isDutchLesson16CtrPilot
          ? "Wanneer mag je rechts inhalen in België? Leer het verschil tussen inhalen en voorbijrijden, wanneer links inhalen geldt en hoe je veilig afstand houdt."
          : isDutchLesson12CtrPilot
            ? "Wanneer gebruik je dimlichten, grootlichten of mistlichten in België? Ontdek de regels voor standlichten, waarschuwingslichten en het theorie-examen."
            : copy.description,
    copy.fallbackDescription,
  );
  const title = toBrandedMetadataTitle(
    isDutchLesson24CtrPilot
      ? "Verkeersbord D1: betekenis en verschil met eenrichtingsweg"
      : isArabicLesson14CtrPilot
        ? "مسافة التوقف ومسافة الفرملة | زمن رد الفعل في السياقة"
        : isDutchLesson16CtrPilot
          ? "Rechts inhalen of voorbijrijden? Regels in België"
          : isDutchLesson12CtrPilot
            ? "Wanneer dimlichten, grootlichten en mistlichten gebruiken?"
            : copy.title,
  );
  const image = buildAbsoluteUrl("/opengraph-image", APP_URL);

  return {
    title: { absolute: title },
    description,
    alternates: getLocalizedAlternates(routePath, locale, APP_URL),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "RijVia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      type: "article",
      images: [
        { url: image, width: 1200, height: 630, alt: copy.imageAlt },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function LessonLayout({
  children,
}: LessonLayoutProps) {
  return children;
}
