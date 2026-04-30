'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { LANGUAGES } from '@/lib/constants';
import {
  Globe,
  GraduationCap,
  Dumbbell,
  BookMarked,
  SignpostBig,
  LayoutDashboard,
  UserCircle,
  BarChart3,
  LogOut,
  LogIn,
  UserPlus,
  FileText,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Facebook,
  Instagram,
  Youtube,
  KeyRound,
} from 'lucide-react';

type LangCode = 'en' | 'ar' | 'nl' | 'fr';

const CURRENT_YEAR = new Date().getFullYear();

const sectionTitleClasses =
  'mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground';
const navItemClasses =
  'group flex items-center justify-between gap-3 rounded-2xl border border-transparent px-2.5 py-2 text-sm font-semibold text-foreground/80 transition-all duration-200 hover:border-border/60 hover:bg-background/85 hover:text-foreground';
const socialButtonClasses =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5 hover:text-primary';
const legalLinkClasses =
  'inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-border/60 hover:bg-background/85 hover:text-foreground';
const languageSelectClasses =
  'h-9 min-w-[132px] cursor-pointer appearance-none rounded-full border border-border/60 bg-background/85 px-3 pe-9 text-xs font-semibold text-foreground shadow-sm transition-all duration-200 hover:border-primary/20 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20';
const iconBadgeClasses =
  'flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-primary shadow-sm';

export function Footer() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user, logout } = useAuth();

  const learnLinks = [
    { label: t('home.footer.exam_sim'), href: '/exam', icon: GraduationCap },
    { label: t('home.footer.practice'), href: '/practice', icon: Dumbbell },
    { label: t('home.footer.lessons'), href: '/lessons', icon: BookMarked },
    { label: t('home.footer.road_signs'), href: '/traffic-signs', icon: SignpostBig },
  ];

  const accountLinks = user
    ? [
        { label: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
        {
          label: t('home.footer.profile'),
          href: '/dashboard?section=profile',
          icon: UserCircle,
        },
        {
          label: t('home.footer.progress'),
          href: '/dashboard?section=exam-results',
          icon: BarChart3,
        },
        { label: t('home.footer.logout'), icon: LogOut, action: () => logout() },
      ]
    : [
        { label: t('home.footer.login'), href: '/login', icon: LogIn },
        { label: t('home.footer.register'), href: '/register', icon: UserPlus },
        { label: t('auth.forgot_password'), href: '/forgot-password', icon: KeyRound },
        { label: t('home.footer.support'), href: '/contact', icon: MessageCircle },
      ];

  const popularLinks = [
    { label: t('home.footer.right_of_way'), href: '/lessons/les-23' },
    { label: t('home.footer.speed_limits'), href: '/lessons/les-3' },
    { label: t('home.footer.priority_signs'), href: '/traffic-signs?category=PRIORITY' },
    { label: t('home.footer.road_markings'), href: '/lessons' },
  ];

  return (
    <footer
      role="contentinfo"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background"
    >
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-secondary/8 blur-3xl" />
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="relative px-0 py-1">
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-3">
                <Link href="/" prefetch={false} className="inline-flex items-center gap-3 no-underline">
                  <Image
                    src="/images/logo.png"
                    alt={t('home.footer.logo_alt')}
                    width={42}
                    height={42}
                    className="rounded-2xl ring-1 ring-border/50"
                  />
                  <span className="text-[1.2rem] font-black tracking-tight">
                    <span className="text-primary">R</span>
                    <span className="text-secondary">eady</span>
                    <span className="text-primary">R</span>
                    <span className="text-secondary">oad</span>
                  </span>
                </Link>

                <p className="max-w-sm text-[13px] leading-6 text-foreground/78">
                  {t('home.footer.description')}
                </p>
                <p className="max-w-sm text-[11px] leading-5 text-muted-foreground">
                  {t('home.footer.disclaimer')}
                </p>

                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href="https://www.facebook.com/people/Rij-Bewijs/61559077906506/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('home.footer.social_facebook')}
                    className={socialButtonClasses}
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.instagram.com/a.rib.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('home.footer.social_instagram')}
                    className={socialButtonClasses}
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.youtube.com/@RijBewijsBe"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('home.footer.social_youtube')}
                    className={socialButtonClasses}
                  >
                    <Youtube className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.tiktok.com/@trijbewijs"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('home.footer.social_tiktok')}
                    className={socialButtonClasses}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                    </svg>
                  </a>
                </div>
              </div>

              <nav aria-label={t('home.footer.nav_learn')} className="w-full">
                <p className={sectionTitleClasses}>{t('home.footer.col_learn')}</p>
                <ul className="space-y-2">
                  {learnLinks.map(({ label, href, icon: Icon }) => (
                    <li key={href + label}>
                      <Link href={href} prefetch={false} className={navItemClasses}>
                        <span className="inline-flex items-center gap-2.5">
                          <span className={iconBadgeClasses}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>{label}</span>
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary ${
                            isRTL ? 'rotate-180' : ''
                          }`}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <nav aria-label={t('home.footer.nav_account')} className="w-full">
                <p className={sectionTitleClasses}>{t('home.footer.col_account')}</p>
                <ul className="space-y-2">
                  {accountLinks.map(({ label, href, icon: Icon, action }) => (
                    <li key={href ?? label}>
                      {href ? (
                        <Link href={href} prefetch={false} className={navItemClasses}>
                          <span className="inline-flex items-center gap-2.5">
                            <span className={iconBadgeClasses}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>{label}</span>
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary ${
                              isRTL ? 'rotate-180' : ''
                            }`}
                          />
                        </Link>
                      ) : (
                        <button onClick={action} className={`${navItemClasses} w-full text-start`}>
                          <span className="inline-flex items-center gap-2.5">
                            <span className={iconBadgeClasses}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>{label}</span>
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary ${
                              isRTL ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              <nav aria-label={t('home.footer.nav_popular')} className="w-full">
                <p className={sectionTitleClasses}>{t('home.footer.col_popular')}</p>
                <ul className="space-y-2">
                  {popularLinks.map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} prefetch={false} className={navItemClasses}>
                        <span className="inline-flex items-center gap-2.5">
                          <span className={iconBadgeClasses}>
                            <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                          </span>
                          <span>{label}</span>
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary ${
                            isRTL ? 'rotate-180' : ''
                          }`}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

          <div className="mt-4 border-t border-border/60 pt-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/privacy-policy" prefetch={false} className={legalLinkClasses}>
                  <ShieldCheck className="h-3 w-3" />
                  {t('home.footer.privacy')}
                </Link>
                <Link href="/terms" prefetch={false} className={legalLinkClasses}>
                  <FileText className="h-3 w-3" />
                  {t('home.footer.terms')}
                </Link>
                <Link href="/contact" prefetch={false} className={legalLinkClasses}>
                  <MessageCircle className="h-3 w-3" />
                  {t('home.footer.contact')}
                </Link>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                <span className="text-xs font-medium text-muted-foreground">
                  &copy; {CURRENT_YEAR} ReadyRoad - {t('home.footer.rights')}
                </span>
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="relative">
                    <select
                      id="footer-lang"
                      name="language"
                      autoComplete="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as LangCode)}
                      className={languageSelectClasses}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.nativeName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
