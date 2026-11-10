export type InlineLinkLanguage = "nl" | "fr" | "en" | "ar";

export type LessonSignRule = {
  lesson: string;
  page: number;
  sign: string;
};

// Each lesson/sign pair is placed once, on the page that explains that sign.
export const lessonSignRules: readonly LessonSignRule[] = [
  { lesson: "les-4", page: 3, sign: "F17" },
  { lesson: "les-5", page: 1, sign: "D7" },
  { lesson: "les-5", page: 1, sign: "D10" },
  { lesson: "les-5", page: 2, sign: "A25" },
  { lesson: "les-5", page: 2, sign: "F50" },
  { lesson: "les-8", page: 3, sign: "F49" },
  { lesson: "les-8", page: 3, sign: "A21" },
  { lesson: "les-13", page: 1, sign: "C43" },
  { lesson: "les-15", page: 6, sign: "B19" },
  { lesson: "les-15", page: 6, sign: "B21" },
  { lesson: "les-17", page: 2, sign: "C35" },
  { lesson: "les-17", page: 2, sign: "C39" },
  { lesson: "les-20", page: 1, sign: "B9" },
  { lesson: "les-20", page: 1, sign: "B11" },
  { lesson: "les-20", page: 2, sign: "B17" },
  { lesson: "les-20", page: 5, sign: "B5" },
  { lesson: "les-18", page: 5, sign: "C3" },
  { lesson: "les-23", page: 1, sign: "C1" },
  { lesson: "les-23", page: 3, sign: "C3" },
  { lesson: "les-23", page: 5, sign: "C15" },
  { lesson: "les-23", page: 7, sign: "C31a" },
  { lesson: "les-24", page: 5, sign: "F19" },
  { lesson: "les-26", page: 4, sign: "E1" },
  { lesson: "les-26", page: 5, sign: "E3" },
  { lesson: "les-27", page: 1, sign: "E9a" },
  { lesson: "les-27", page: 1, sign: "E9g" },
  { lesson: "les-27", page: 5, sign: "E9b" },
];

export type SignLessonRule = {
  lesson: string;
  section: number;
  anchors: Record<InlineLinkLanguage, string>;
};

export const signLessonRules: Readonly<Record<string, SignLessonRule>> = {
  B17: {
    lesson: "les-21",
    section: 1,
    anchors: { nl: "voorrang van rechts", fr: "priorité de droite", en: "Priority from the right", ar: "أولوية اليمين" },
  },
  B19: {
    lesson: "les-15",
    section: 6,
    anchors: { nl: "smalle doorgang", fr: "passage étroit", en: "narrow passage", ar: "ممر ضيق" },
  },
  B21: {
    lesson: "les-15",
    section: 6,
    anchors: { nl: "smalle doorgang", fr: "passage étroit", en: "narrow passage", ar: "ممر ضيق" },
  },
  B5: {
    lesson: "les-20",
    section: 5,
    anchors: { nl: "volledig stoppen", fr: "s'arrêter complètement", en: "complete stop", ar: "التوقف الكامل" },
  },
  C35: {
    lesson: "les-17",
    section: 2,
    anchors: { nl: "links in te halen", fr: "dépasser par la gauche", en: "overtake on the left", ar: "يُمنع تجاوز" },
  },
  E1: {
    lesson: "les-26",
    section: 5,
    anchors: { nl: "parkeerverbod", fr: "interdiction de stationner", en: "parking prohibition", ar: "حظر الركن" },
  },
  E3: {
    lesson: "les-26",
    section: 5,
    anchors: { nl: "niet stoppen", fr: "vous arrêter", en: "may not stop", ar: "لا يجوز التوقف" },
  },
  F19: {
    lesson: "les-24",
    section: 5,
    anchors: { nl: "eenrichtingsverkeer", fr: "sens unique", en: "one-way", ar: "باتجاه واحد" },
  },
  F49: {
    lesson: "les-8",
    section: 3,
    anchors: { nl: "oversteekplaats voor voetgangers", fr: "passage pour piétons", en: "pedestrian crossing", ar: "ممر للمشاة" },
  },
  F111: {
    lesson: "les-7",
    section: 5,
    anchors: { nl: "fietszone", fr: "zone cyclable", en: "cycle zone", ar: "منطقة للدراجات" },
  },
  F113: {
    lesson: "les-7",
    section: 5,
    anchors: { nl: "fietszone", fr: "zone cyclable", en: "cycle zone", ar: "منطقة الدراجات" },
  },
};

export function hasLessonSignRules(lessonCode: string): boolean {
  return lessonSignRules.some((rule) => rule.lesson === lessonCode);
}

export function hasSignLessonRules(signCode: string): boolean {
  return Object.hasOwn(signLessonRules, signCode);
}
