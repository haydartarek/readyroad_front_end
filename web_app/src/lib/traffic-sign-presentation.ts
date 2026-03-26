import { GROUP_INFO, GROUP_LETTER_ORDER, type LangKey } from "@/lib/sign-category-data";
import type { TrafficSign } from "@/lib/types";

const LEGACY_CATEGORY_TO_GROUP: Record<string, string> = {
  DANGER: "A",
  PRIORITY: "B",
  PROHIBITION: "C",
  MANDATORY: "D",
  PARKING: "E",
  INFORMATION: "F",
  ADDITIONAL: "G",
  CYCLIST: "M",
  DELINEATION: "T",
  ZONE: "Z",
};

export const TRAFFIC_SIGN_GROUP_ORDER = GROUP_LETTER_ORDER;

export const GROUP_STYLES: Record<
  string,
  {
    chip: string;
    soft: string;
    ring: string;
    accent: string;
    cardBorder: string;
    cardGlow: string;
  }
> = {
  A: {
    chip: "bg-red-50 text-red-700 border-red-200",
    soft: "bg-red-50/70",
    ring: "ring-red-100/80",
    accent: "from-red-500 to-orange-500",
    cardBorder: "hover:border-red-200",
    cardGlow: "hover:shadow-red-100/60",
  },
  B: {
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    soft: "bg-amber-50/70",
    ring: "ring-amber-100/80",
    accent: "from-amber-500 to-orange-500",
    cardBorder: "hover:border-amber-200",
    cardGlow: "hover:shadow-amber-100/60",
  },
  C: {
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    soft: "bg-rose-50/70",
    ring: "ring-rose-100/80",
    accent: "from-rose-500 to-red-500",
    cardBorder: "hover:border-rose-200",
    cardGlow: "hover:shadow-rose-100/60",
  },
  D: {
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    soft: "bg-sky-50/70",
    ring: "ring-sky-100/80",
    accent: "from-sky-500 to-blue-500",
    cardBorder: "hover:border-sky-200",
    cardGlow: "hover:shadow-sky-100/60",
  },
  E: {
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    soft: "bg-blue-50/70",
    ring: "ring-blue-100/80",
    accent: "from-blue-500 to-sky-500",
    cardBorder: "hover:border-blue-200",
    cardGlow: "hover:shadow-blue-100/60",
  },
  F: {
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    soft: "bg-emerald-50/70",
    ring: "ring-emerald-100/80",
    accent: "from-emerald-500 to-teal-500",
    cardBorder: "hover:border-emerald-200",
    cardGlow: "hover:shadow-emerald-100/60",
  },
  FM: {
    chip: "bg-orange-50 text-orange-700 border-orange-200",
    soft: "bg-orange-50/70",
    ring: "ring-orange-100/80",
    accent: "from-orange-500 to-amber-500",
    cardBorder: "hover:border-orange-200",
    cardGlow: "hover:shadow-orange-100/60",
  },
  G: {
    chip: "bg-slate-50 text-slate-700 border-slate-200",
    soft: "bg-slate-50/70",
    ring: "ring-slate-100/80",
    accent: "from-slate-600 to-slate-500",
    cardBorder: "hover:border-slate-200",
    cardGlow: "hover:shadow-slate-100/60",
  },
  M: {
    chip: "bg-cyan-50 text-cyan-700 border-cyan-200",
    soft: "bg-cyan-50/70",
    ring: "ring-cyan-100/80",
    accent: "from-cyan-500 to-sky-500",
    cardBorder: "hover:border-cyan-200",
    cardGlow: "hover:shadow-cyan-100/60",
  },
  T: {
    chip: "bg-stone-50 text-stone-700 border-stone-200",
    soft: "bg-stone-50/70",
    ring: "ring-stone-100/80",
    accent: "from-stone-600 to-slate-500",
    cardBorder: "hover:border-stone-200",
    cardGlow: "hover:shadow-stone-100/60",
  },
  Z: {
    chip: "bg-orange-50 text-orange-700 border-orange-200",
    soft: "bg-orange-50/70",
    ring: "ring-orange-100/80",
    accent: "from-orange-500 to-amber-500",
    cardBorder: "hover:border-orange-200",
    cardGlow: "hover:shadow-orange-100/60",
  },
};

export function getTrafficSignName(sign: TrafficSign, language: LangKey): string {
  return (
    {
      nl: sign.nameNl,
      en: sign.nameEn,
      ar: sign.nameAr,
      fr: sign.nameFr,
    }[language] ||
    sign.nameEn ||
    sign.signCode
  );
}

export function getTrafficSignDescription(sign: TrafficSign, language: LangKey): string {
  return (
    {
      nl: sign.descriptionNl,
      en: sign.descriptionEn,
      ar: sign.descriptionAr,
      fr: sign.descriptionFr,
    }[language] ||
    sign.descriptionEn ||
    ""
  );
}

export function getTrafficSignLongDescription(sign: TrafficSign, language: LangKey): string {
  return (
    {
      nl: sign.longDescriptionNl,
      en: sign.longDescriptionEn,
      ar: sign.longDescriptionAr,
      fr: sign.longDescriptionFr,
    }[language] ||
    ""
  );
}

export function getTrafficSignGroup(sign: TrafficSign): string {
  const imagePath = (sign.imageUrl || "").toLowerCase();
  if (imagePath.includes("/road_markings/")) {
    return "FM";
  }

  const categoryCode = sign.categoryCode?.trim().toUpperCase();
  if (categoryCode && GROUP_INFO[categoryCode]) {
    return categoryCode;
  }

  const category = sign.category?.trim().toUpperCase();
  if (category && LEGACY_CATEGORY_TO_GROUP[category]) {
    return LEGACY_CATEGORY_TO_GROUP[category];
  }

  const firstLetter = sign.signCode?.trim().charAt(0).toUpperCase();
  return firstLetter && GROUP_INFO[firstLetter] ? firstLetter : "F";
}

export function getTrafficSignGroupInfo(sign: TrafficSign) {
  const group = getTrafficSignGroup(sign);
  return {
    group,
    info: GROUP_INFO[group] ?? GROUP_INFO.F,
    style: GROUP_STYLES[group] ?? GROUP_STYLES.F,
  };
}

export function getGroupInfo(group: string) {
  return {
    group,
    info: GROUP_INFO[group] ?? GROUP_INFO.F,
    style: GROUP_STYLES[group] ?? GROUP_STYLES.F,
  };
}
