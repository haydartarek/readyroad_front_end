'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { LANGUAGES } from '@/lib/constants';
import { Globe, Mail, BookOpen, ShieldCheck, FileText, MessageCircle } from 'lucide-react';

type LangCode = 'en' | 'ar' | 'nl' | 'fr';

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  const { t, language, setLanguage, isRTL } = useLanguage();

  const legalLinks = [
    { label: t('home.footer.terms'),   href: '/terms',          icon: FileText },
    { label: t('home.footer.privacy'), href: '/privacy-policy', icon: ShieldCheck },
    { label: t('home.footer.contact'), href: '/contact',        icon: MessageCircle },
    { label: t('home.footer.support'), href: 'mailto:support@readyroad.be', icon: Mail },
  ];

  return (
    <footer
      role="contentinfo"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="border-t border-border bg-secondary text-secondary-foreground"
    >
      {/* Main content */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-3 md:items-start">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-secondary-foreground">
                ReadyRoad
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-secondary-foreground/65">
              {t('home.footer.description')}
            </p>
            <p className="max-w-xs text-xs italic leading-relaxed text-secondary-foreground/45">
              {t('home.why.disclaimer')}
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation" className="md:justify-self-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-secondary-foreground/45">
              {t('home.footer.language') ? 'Links' : 'Links'}
            </p>
            <ul className="space-y-2.5">
              {legalLinks.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 text-sm text-secondary-foreground/65 transition-colors hover:text-secondary-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary/70 transition-colors group-hover:text-primary" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Language selector */}
          <div className="md:justify-self-end">
            <label
              htmlFor="footer-lang"
              className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-secondary-foreground/45"
            >
              <Globe className="h-3.5 w-3.5" />
              {t('home.footer.language')}
            </label>
            <select
              id="footer-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LangCode)}
              style={{ backgroundColor: '#1e3a5f', color: '#ffffff', borderColor: 'rgba(255,255,255,0.25)' }}
              className="w-full max-w-[200px] cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} style={{ backgroundColor: '#1e3a5f', color: '#ffffff' }}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-secondary-foreground/10">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-secondary-foreground/40">
          &copy; {CURRENT_YEAR} ReadyRoad &mdash; {t('home.footer.rights')}
        </div>
      </div>
    </footer>
  );
}
