import type { LucideIcon } from 'lucide-react';
import {
  Ban,
  Bike,
  CircleArrowRight,
  Diamond,
  Info,
  MapPinned,
  Navigation,
  PanelsTopLeft,
  Route,
  SignpostBig,
  SquareParking,
  TriangleAlert,
} from 'lucide-react';

export interface CategoryVisual {
  icon: LucideIcon;
  iconWrap: string;
  iconTone: string;
  countBadge: string;
  progressBar: string;
  cardGlow: string;
  actionTone: string;
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  A: {
    icon: TriangleAlert,
    iconWrap: 'bg-gradient-to-br from-red-500 to-orange-500 ring-red-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-red-50 text-red-700',
    progressBar: 'bg-red-500/80',
    cardGlow: 'bg-red-500/12',
    actionTone: 'text-red-700',
  },
  B: {
    icon: Diamond,
    iconWrap: 'bg-gradient-to-br from-amber-500 to-yellow-500 ring-amber-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-amber-50 text-amber-700',
    progressBar: 'bg-amber-500/80',
    cardGlow: 'bg-amber-500/12',
    actionTone: 'text-amber-700',
  },
  C: {
    icon: Ban,
    iconWrap: 'bg-gradient-to-br from-rose-500 to-red-500 ring-rose-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-rose-50 text-rose-700',
    progressBar: 'bg-rose-500/80',
    cardGlow: 'bg-rose-500/12',
    actionTone: 'text-rose-700',
  },
  D: {
    icon: CircleArrowRight,
    iconWrap: 'bg-gradient-to-br from-sky-500 to-blue-500 ring-sky-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-sky-50 text-sky-700',
    progressBar: 'bg-sky-500/80',
    cardGlow: 'bg-sky-500/12',
    actionTone: 'text-sky-700',
  },
  E: {
    icon: SquareParking,
    iconWrap: 'bg-gradient-to-br from-blue-600 to-indigo-500 ring-blue-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-blue-50 text-blue-700',
    progressBar: 'bg-blue-500/80',
    cardGlow: 'bg-blue-500/12',
    actionTone: 'text-blue-700',
  },
  F: {
    icon: SignpostBig,
    iconWrap: 'bg-gradient-to-br from-emerald-500 to-teal-500 ring-emerald-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-emerald-50 text-emerald-700',
    progressBar: 'bg-emerald-500/80',
    cardGlow: 'bg-emerald-500/12',
    actionTone: 'text-emerald-700',
  },
  FM: {
    icon: Route,
    iconWrap: 'bg-gradient-to-br from-orange-500 to-amber-500 ring-orange-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-orange-50 text-orange-700',
    progressBar: 'bg-orange-500/80',
    cardGlow: 'bg-orange-500/12',
    actionTone: 'text-orange-700',
  },
  G: {
    icon: PanelsTopLeft,
    iconWrap: 'bg-gradient-to-br from-slate-600 to-slate-500 ring-slate-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-slate-50 text-slate-700',
    progressBar: 'bg-slate-500/80',
    cardGlow: 'bg-slate-500/12',
    actionTone: 'text-slate-700',
  },
  M: {
    icon: Bike,
    iconWrap: 'bg-gradient-to-br from-cyan-500 to-sky-500 ring-cyan-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-cyan-50 text-cyan-700',
    progressBar: 'bg-cyan-500/80',
    cardGlow: 'bg-cyan-500/12',
    actionTone: 'text-cyan-700',
  },
  T: {
    icon: Navigation,
    iconWrap: 'bg-gradient-to-br from-violet-500 to-indigo-500 ring-violet-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-violet-50 text-violet-700',
    progressBar: 'bg-violet-500/80',
    cardGlow: 'bg-violet-500/12',
    actionTone: 'text-violet-700',
  },
  Z: {
    icon: MapPinned,
    iconWrap: 'bg-gradient-to-br from-fuchsia-500 to-violet-500 ring-fuchsia-200/80',
    iconTone: 'text-white',
    countBadge: 'bg-fuchsia-50 text-fuchsia-700',
    progressBar: 'bg-fuchsia-500/80',
    cardGlow: 'bg-fuchsia-500/12',
    actionTone: 'text-fuchsia-700',
  },
};

const DEFAULT_CATEGORY_VISUAL: CategoryVisual = {
  icon: Info,
  iconWrap: 'bg-gradient-to-br from-slate-500 to-slate-600 ring-slate-200/80',
  iconTone: 'text-white',
  countBadge: 'bg-slate-50 text-slate-700',
  progressBar: 'bg-slate-500/80',
  cardGlow: 'bg-slate-500/12',
  actionTone: 'text-slate-700',
};

export function getCategoryVisual(code: string): CategoryVisual {
  return CATEGORY_VISUALS[code] ?? DEFAULT_CATEGORY_VISUAL;
}
