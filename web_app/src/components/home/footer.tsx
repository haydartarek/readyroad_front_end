'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { LANGUAGES } from '@/lib/constants';

/**
 * Production-ready footer with legal links, language switcher,
 * and the required disclaimer.  All colors from design tokens only.
 */
export function Footer() {
    const { t, language, setLanguage } = useLanguage();

    const legalLinks = [
        { label: t('home.footer.terms'), href: '/terms' },
        { label: t('home.footer.privacy'), href: '/privacy-policy' },
        { label: t('home.footer.contact'), href: 'mailto:contact@readyroad.be' },
        { label: t('home.footer.support'), href: 'mailto:support@readyroad.be' },
        { label: t('home.footer.report'), href: 'mailto:report@readyroad.be' },
    ];

    return (
        <footer className="border-t border-border bg-secondary text-secondary-foreground" role="contentinfo">
            <div className="container mx-auto px-4 py-10 lg:py-14">
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Brand column */}
                    <div className="space-y-3">
                        <p className="text-lg font-bold text-secondary-foreground">ReadyRoad</p>
                        <p className="max-w-xs text-sm leading-relaxed text-secondary-foreground/60">
                            {t('home.footer.description')}
                        </p>
                        {/* Disclaimer */}
                        <p className="text-xs italic text-secondary-foreground/40">
                            {t('home.why.disclaimer')}
                        </p>
                    </div>

                    {/* Links column */}
                    <nav aria-label="Footer navigation">
                        <ul className="flex flex-wrap gap-x-6 gap-y-2">
                            {legalLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-secondary-foreground/60 transition-colors hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Language selector column */}
                    <div>
                        <label htmlFor="footer-lang" className="mb-2 block text-sm font-medium text-secondary-foreground/60">
                            {t('home.footer.language')}
                        </label>
                        <select
                            id="footer-lang"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'en' | 'ar' | 'nl' | 'fr')}
                            className="w-full max-w-[200px] rounded-lg border border-secondary-foreground/20 bg-secondary px-3 py-2 text-sm text-secondary-foreground/90 transition-colors hover:border-secondary-foreground/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.nativeName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 border-t border-secondary-foreground/15 pt-6 text-center text-xs text-secondary-foreground/40">
                    &copy; {new Date().getFullYear()} ReadyRoad. {t('home.footer.rights')}
                </div>
            </div>
        </footer>
    );
}
