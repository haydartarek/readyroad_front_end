"use client";

import Link from "@/components/localized-link";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useCookieConsent } from "@/contexts/cookie-consent-context";
import { LANGUAGES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Facebook,
  Instagram,
  Youtube,
  KeyRound,
  Info,
  Cookie,
  Settings2,
  Scale,
  CircleHelp,
} from "lucide-react";

type LangCode = "en" | "ar" | "nl" | "fr";

const CURRENT_YEAR = new Date().getFullYear();

const sectionTitleClasses =
  "mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground";
const navItemClasses =
  "group flex items-center justify-between gap-3 rounded-2xl border border-transparent px-2.5 py-2 text-sm font-semibold text-foreground/80 transition-all duration-200 hover:border-border/60 hover:bg-background/85 hover:text-foreground";
const socialButtonClasses =
  "flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5 hover:text-primary";
const legalLinkClasses =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-border/60 hover:bg-background/85 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const iconBadgeClasses =
  "flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-primary shadow-sm";

export function Footer() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const { openSettings } = useCookieConsent();

  const learnLinks = [
    { label: t("home.footer.exam_sim"), href: "/exam", icon: GraduationCap },
    { label: t("home.footer.practice"), href: "/practice", icon: Dumbbell },
    { label: t("home.footer.lessons"), href: "/lessons", icon: BookMarked },
    {
      label: t("home.footer.road_signs"),
      href: "/traffic-signs",
      icon: SignpostBig,
    },
  ];

  const accountLinks = user
    ? [
        {
          label: t("nav.dashboard"),
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: t("home.footer.profile"),
          href: "/dashboard?section=profile",
          icon: UserCircle,
        },
        {
          label: t("home.footer.progress"),
          href: "/dashboard?section=exam-results",
          icon: BarChart3,
        },
        {
          label: t("home.footer.logout"),
          icon: LogOut,
          action: () => {
            void logout();
          },
        },
      ]
    : [
        { label: t("home.footer.login"), href: "/login", icon: LogIn },
        { label: t("home.footer.register"), href: "/register", icon: UserPlus },
        {
          label: t("auth.forgot_password"),
          href: "/forgot-password",
          icon: KeyRound,
        },
        {
          label: t("home.footer.support"),
          href: "/contact",
          icon: MessageCircle,
        },
      ];

  const popularLinks = [
    { label: t("home.footer.right_of_way"), href: "/lessons/les-19" },
    { label: t("home.footer.speed_limits"), href: "/lessons/les-3" },
    {
      label: t("home.footer.priority_signs"),
      href: "/traffic-signs?category=B",
    },
    { label: t("lessons.page_title"), href: "/lessons" },
  ];

  return (
    <footer
      role="contentinfo"
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background"
    >
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="relative px-0 py-1">
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-3">
              <Link
                href="/"
                prefetch={false}
                aria-label="RijVia"
                className="inline-flex items-center no-underline"
              >
                <span className="relative block h-[52px] w-[156px] shrink-0">
                  <Image
                    src="/images/logo.png"
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="156px"
                    className="object-contain dark:hidden"
                  />
                  <Image
                    src="/images/logo-dark.png"
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="156px"
                    className="hidden object-contain dark:block"
                  />
                </span>
              </Link>

              <p className="max-w-sm text-[13px] leading-6 text-foreground/78">
                {t("home.footer.description")}
              </p>
              <p className="max-w-sm text-[11px] leading-5 text-muted-foreground">
                {t("home.footer.disclaimer")}
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <a
                  href="https://www.facebook.com/people/Rij-Bewijs/61559077906506/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("home.footer.social_facebook")}
                  className={socialButtonClasses}
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://www.instagram.com/a.rib.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("home.footer.social_instagram")}
                  className={socialButtonClasses}
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.youtube.com/@RijBewijsBe"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("home.footer.social_youtube")}
                  className={socialButtonClasses}
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="https://www.tiktok.com/@trijbewijs"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("home.footer.social_tiktok")}
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

            <nav aria-label={t("home.footer.nav_learn")} className="w-full">
              <p className={sectionTitleClasses}>
                {t("home.footer.col_learn")}
              </p>
              <ul className="space-y-2">
                {learnLinks.map(({ label, href, icon: Icon }) => (
                  <li key={href + label}>
                    <Link
                      href={href}
                      prefetch={false}
                      className={navItemClasses}
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <span className={iconBadgeClasses}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{label}</span>
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary ${
                          isRTL ? "rotate-180" : ""
                        }`}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label={t("home.footer.nav_account")} className="w-full">
              <p className={sectionTitleClasses}>
                {t("home.footer.col_account")}
              </p>
              <ul className="space-y-2">
                {accountLinks.map(({ label, href, icon: Icon, action }) => (
                  <li key={href ?? label}>
                    {href ? (
                      <Link
                        href={href}
                        prefetch={false}
                        className={navItemClasses}
                      >
                        <span className="inline-flex items-center gap-2.5">
                          <span className={iconBadgeClasses}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>{label}</span>
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary ${
                            isRTL ? "rotate-180" : ""
                          }`}
                        />
                      </Link>
                    ) : (
                      <button
                        onClick={action}
                        className={`${navItemClasses} w-full text-start`}
                      >
                        <span className="inline-flex items-center gap-2.5">
                          <span className={iconBadgeClasses}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>{label}</span>
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary ${
                            isRTL ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label={t("home.footer.nav_popular")} className="w-full">
              <p className={sectionTitleClasses}>
                {t("home.footer.col_popular")}
              </p>
              <ul className="space-y-2">
                {popularLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      prefetch={false}
                      className={navItemClasses}
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <span className={iconBadgeClasses}>
                          <ChevronRight
                            className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`}
                          />
                        </span>
                        <span>{label}</span>
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary ${
                          isRTL ? "rotate-180" : ""
                        }`}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-4 border-t border-border/60 pt-3">
            <div
              data-testid="footer-bottom-row"
              className="flex flex-col gap-4"
            >
              <div
                data-testid="footer-utility-row"
                className="flex flex-col items-center gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:gap-6"
              >
                <div
                  data-testid="footer-legal-links"
                  className="flex min-w-0 flex-wrap items-center justify-center gap-2 xl:flex-nowrap xl:justify-self-start xl:justify-start"
                >
                  <Link
                    href="/about"
                    prefetch={false}
                    className={legalLinkClasses}
                  >
                    <Info className="h-3 w-3" />
                    {t("home.footer.about")}
                  </Link>
                  <Link
                    href="/faq"
                    prefetch={false}
                    className={legalLinkClasses}
                  >
                    <CircleHelp className="h-3 w-3" />
                    {t("home.footer.faq")}
                  </Link>
                  <Link
                    href="/privacy-policy"
                    prefetch={false}
                    className={legalLinkClasses}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {t("home.footer.privacy")}
                  </Link>
                  <Link
                    href="/cookie-policy"
                    prefetch={false}
                    className={legalLinkClasses}
                  >
                    <Cookie className="h-3 w-3" />
                    {t("home.footer.cookies")}
                  </Link>
                  <button
                    type="button"
                    onClick={openSettings}
                    className={legalLinkClasses}
                  >
                    <Settings2 className="h-3 w-3" />
                    {t("consent.footer_settings")}
                  </button>
                  <Link
                    href="/terms"
                    prefetch={false}
                    className={legalLinkClasses}
                  >
                    <FileText className="h-3 w-3" />
                    {t("home.footer.terms")}
                  </Link>
                  <Link
                    href="/disclaimer"
                    prefetch={false}
                    className={legalLinkClasses}
                  >
                    <Scale className="h-3 w-3" />
                    {t("home.footer.disclaimer_link")}
                  </Link>
                  <Link
                    href="/contact"
                    prefetch={false}
                    className={legalLinkClasses}
                  >
                    <MessageCircle className="h-3 w-3" />
                    {t("home.footer.contact")}
                  </Link>
                </div>

                <div
                  data-testid="footer-language"
                  className="flex items-center justify-center gap-2 xl:justify-self-end"
                >
                  <Globe
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-primary"
                  />
                  <label htmlFor="footer-lang" className="sr-only">
                    {t("home.footer.language")}
                  </label>
                  <input
                    type="hidden"
                    name="language"
                    autoComplete="language"
                    value={language}
                    readOnly
                  />
                  <Select
                    dir={isRTL ? "rtl" : "ltr"}
                    value={language}
                    onValueChange={(value) => setLanguage(value as LangCode)}
                  >
                    <SelectTrigger
                      id="footer-lang"
                      aria-label={t("home.footer.language")}
                      className="h-10 w-[160px] rounded-full border-border/60 bg-background/85 px-3.5 text-xs shadow-sm hover:border-primary/25 hover:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/12"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      align={isRTL ? "start" : "end"}
                      className="min-w-[160px] [&>div]:!h-auto"
                    >
                      {LANGUAGES.map((lang) => (
                        <SelectItem
                          key={lang.code}
                          value={lang.code}
                          className={
                            isRTL
                              ? "pl-3.5 pr-9 text-right [&>span:first-child]:left-auto [&>span:first-child]:right-2"
                              : undefined
                          }
                        >
                          {lang.nativeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="w-full border-t border-border/50 pt-4">
                <span
                  data-testid="footer-copyright"
                  className="mx-auto block w-full max-w-3xl break-words text-center text-xs font-medium leading-5 text-muted-foreground"
                >
                  &copy; {CURRENT_YEAR} RijVia. {t("home.footer.operator")}{" "}
                  {t("home.footer.rights")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
