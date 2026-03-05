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
  UserCircle,
  BarChart3,
  LogOut,
  LogIn,
  UserPlus,
  FileText,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
  Facebook,
  Instagram,
  Youtube,
} from 'lucide-react';

type LangCode = 'en' | 'ar' | 'nl' | 'fr';

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user } = useAuth();

  const learnLinks = [
    { label: t('home.footer.exam_sim'),   href: '/exam',          icon: GraduationCap },
    { label: t('home.footer.practice'),   href: '/practice',      icon: Dumbbell },
    { label: t('home.footer.lessons'),    href: '/lessons',       icon: BookMarked },
    { label: t('home.footer.road_signs'), href: '/traffic-signs', icon: SignpostBig },
  ];

  const accountLinks = user
    ? [
        { label: t('home.footer.profile'),  href: '/profile',     icon: UserCircle },
        { label: t('home.footer.progress'), href: '/progress',    icon: BarChart3 },
        { label: t('home.footer.logout'),   href: '/auth/logout', icon: LogOut },
      ]
    : [
        { label: t('home.footer.login'),    href: '/auth/login',    icon: LogIn },
        { label: t('home.footer.register'), href: '/auth/register', icon: UserPlus },
      ];

  const popularLinks = [
    { label: t('home.footer.right_of_way'),   href: '/lessons/les-23' },
    { label: t('home.footer.speed_limits'),   href: '/lessons/les-3' },
    { label: t('home.footer.priority_signs'), href: '/traffic-signs?category=PRIORITY' },
    { label: t('home.footer.road_markings'),  href: '/lessons' },
    { label: t('home.footer.danger_signs'),   href: '/traffic-signs?category=DANGER' },
  ];

  return (
    <footer
      role="contentinfo"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative overflow-hidden border-t border-border bg-secondary text-secondary-foreground"
    >
      {/* Decorative blurred circles */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-teal-500/15 blur-3xl" />
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0 lg:gap-x-16 lg:items-start">

          {/* Column 1 — Identity */}
          <div className="sm:col-span-2 lg:col-span-1 w-full space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 no-underline">
              <Image
                src="/favicon-32x32.png"
                alt="ReadyRoad logo"
                width={48}
                height={48}
                className="rounded-xl"
              />
              <span className="text-lg font-extrabold tracking-tight text-secondary-foreground">
                ReadyRoad
              </span>
            </Link>
            <p className="w-full text-sm leading-relaxed text-secondary-foreground/65">
              {t('home.footer.description')}
            </p>
            <p className="w-full text-xs italic leading-relaxed text-secondary-foreground/45">
              {t('home.footer.disclaimer')}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.facebook.com/people/Rij-Bewijs/61559077906506/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-foreground/10 text-secondary-foreground/50 transition-colors hover:bg-primary/20 hover:text-primary"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/a.rib.0/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-foreground/10 text-secondary-foreground/50 transition-colors hover:bg-primary/20 hover:text-primary"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.youtube.com/@RijBewijsBe"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-foreground/10 text-secondary-foreground/50 transition-colors hover:bg-primary/20 hover:text-primary"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@trijbewijs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-foreground/10 text-secondary-foreground/50 transition-colors hover:bg-primary/20 hover:text-primary"
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

          {/* Column 2 — Learn */}
          <nav aria-label="Learn navigation" className="w-full">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-secondary-foreground/45">
              {t('home.footer.col_learn')}
            </p>
            <ul className="space-y-2.5">
              {learnLinks.map(({ label, href, icon: Icon }) => (
                <li key={href + label}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 text-sm text-secondary-foreground/65 transition-colors hover:text-secondary-foreground"
                  >
                    <span className="inline-flex w-5 justify-center">
                      <Icon className="h-3.5 w-3.5 text-primary/70 transition-colors group-hover:text-primary" />
                    </span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3 — Account */}
          <nav aria-label="Account navigation" className="w-full">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-secondary-foreground/45">
              {t('home.footer.col_account')}
            </p>
            <ul className="space-y-2.5">
              {accountLinks.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 text-sm text-secondary-foreground/65 transition-colors hover:text-secondary-foreground"
                  >
                    <span className="inline-flex w-5 justify-center">
                      <Icon className="h-3.5 w-3.5 text-primary/70 transition-colors group-hover:text-primary" />
                    </span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 4 — Popular Topics */}
          <nav aria-label="Popular topics" className="w-full">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-secondary-foreground/45">
              {t('home.footer.col_popular')}
            </p>
            <ul className="space-y-2.5">
              {popularLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 text-sm text-secondary-foreground/65 transition-colors hover:text-secondary-foreground"
                  >
                    <span className="inline-flex w-5 justify-center">
                      <ChevronRight
                        className={`h-3.5 w-3.5 text-primary/70 transition-colors group-hover:text-primary ${
                          isRTL ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-secondary-foreground/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link
                href="/privacy-policy"
                className="inline-flex items-center gap-1 text-xs text-secondary-foreground/40 transition-colors hover:text-secondary-foreground/70"
              >
                <ShieldCheck className="h-3 w-3" />
                {t('home.footer.privacy')}
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center gap-1 text-xs text-secondary-foreground/40 transition-colors hover:text-secondary-foreground/70"
              >
                <FileText className="h-3 w-3" />
                {t('home.footer.terms')}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-xs text-secondary-foreground/40 transition-colors hover:text-secondary-foreground/70"
              >
                <MessageCircle className="h-3 w-3" />
                {t('home.footer.contact')}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs text-secondary-foreground/40">
                &copy; {CURRENT_YEAR} ReadyRoad &mdash; {t('home.footer.rights')}
              </span>
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-secondary-foreground/40" />
                <select
                  id="footer-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LangCode)}
                  style={{
                    backgroundColor: '#1e3a5f',
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.15)',
                  }}
                  className="cursor-pointer rounded-lg border px-2 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {LANGUAGES.map((lang) => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      style={{ backgroundColor: '#1e3a5f', color: '#ffffff' }}
                    >
                      {lang.nativeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
