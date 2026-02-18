'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { LANGUAGES } from '@/lib/constants';

/**
 * Production-ready footer with legal links, language switcher,
 * and the required disclaimer.
 */
export function Footer() {
    const { t, language, setLanguage } = useLanguage();

    const legalLinks = [
        { label: t('home.footer.terms'), href: '/terms' },
        { label: t('home.footer.privacy'), href: '/privacy' },
        { label: t('home.footer.contact'), href: 'mailto:contact@readyroad.be' },
        { label: t('home.footer.support'), href: 'mailto:support@readyroad.be' },
        { label: t('home.footer.report'), href: 'mailto:report@readyroad.be' },
    ];

    return (
        <footer className="border-t border-gray-200 bg-[#2C3E50] text-gray-300" role="contentinfo">
            <div className="container mx-auto px-4 py-10 lg:py-14">
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Brand column */}
                    <div className="space-y-3">
                        <p className="text-lg font-bold text-white">ReadyRoad</p>
                        <p className="max-w-xs text-sm leading-relaxed text-gray-400">
                            {t('home.footer.description')}
                        </p>
                        {/* Disclaimer */}
                        <p className="text-xs italic text-gray-500">
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
                                        className="text-sm text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF5830] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2C3E50]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Language selector column */}
                    <div>
                        <label htmlFor="footer-lang" className="mb-2 block text-sm font-medium text-gray-400">
                            {t('home.footer.language')}
                        </label>
                        <select
                            id="footer-lang"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'en' | 'ar' | 'nl' | 'fr')}
                            className="w-full max-w-[200px] rounded-lg border border-gray-600 bg-[#2C3E50] px-3 py-2 text-sm text-gray-200 transition-colors hover:border-gray-500 focus:border-[#DF5830] focus:outline-none focus:ring-1 focus:ring-[#DF5830]"
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
                <div className="mt-8 border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} ReadyRoad. {t('home.footer.rights')}
                </div>
            </div>
        </footer>
    );
}
