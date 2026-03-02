'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, ChevronDown, Menu, X,
  User, LogOut, BarChart3, Settings, Shield, LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useSearch } from '@/hooks/use-search';
import { SearchDropdown, type SearchResult } from '@/components/layout/search-dropdown';
import { getUnreadNotificationCount } from '@/services';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { ROUTES, LANGUAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

type LangCode = 'en' | 'ar' | 'nl' | 'fr';
type UserRole = 'ADMIN' | 'MODERATOR' | 'USER';

// ─── Constants ───────────────────────────────────────────

const PRIMARY_NAV = [
  { name: 'nav.home',      href: '/'              },
  { name: 'nav.dashboard', href: ROUTES.DASHBOARD },
  { name: 'nav.exam',      href: ROUTES.EXAM      },
  { name: 'nav.practice',  href: ROUTES.PRACTICE  },
] as const;

const SECONDARY_NAV = [
  { name: 'nav.traffic_signs', href: ROUTES.TRAFFIC_SIGNS        },
  { name: 'nav.lessons',       href: ROUTES.LESSONS               },
  { name: 'nav.analytics',     href: ROUTES.ANALYTICS_WEAK_AREAS  },
  { name: 'nav.progress',      href: ROUTES.PROGRESS              },
  { name: 'nav.profile',       href: ROUTES.PROFILE               },
] as const;

const ALL_NAV  = [...PRIMARY_NAV, ...SECONDARY_NAV];

const MAX_ERRORS   = 3;
const BASE_POLL_MS = 30_000;
const DEDUPE_MS    = 2_000;

const ROLE_STYLES: Record<string, { trigger: string; avatar: string; text: string; chevron: string; header: string; badge: string }> = {
  ADMIN: {
    trigger: 'border-amber-300 bg-amber-50   hover:bg-amber-100  hover:border-amber-400  focus:ring-amber-300/50',
    avatar:  'bg-gradient-to-br from-amber-500 to-orange-600',
    text:    'text-amber-800',
    chevron: 'text-amber-400',
    header:  'border-amber-100 bg-amber-50/50',
    badge:   'bg-amber-100 text-amber-700 border-amber-200',
  },
  MODERATOR: {
    trigger: 'border-blue-300 bg-blue-50    hover:bg-blue-100   hover:border-blue-400   focus:ring-blue-300/50',
    avatar:  'bg-gradient-to-br from-blue-500 to-indigo-600',
    text:    'text-blue-800',
    chevron: 'text-muted-foreground',
    header:  'border-border',
    badge:   'bg-blue-100 text-blue-700 border-blue-200',
  },
  USER: {
    trigger: 'border-border bg-background  hover:bg-muted      hover:border-border     focus:ring-primary/50',
    avatar:  'bg-gradient-to-br from-primary to-primary/70',
    text:    'text-foreground',
    chevron: 'text-muted-foreground',
    header:  'border-border',
    badge:   '',
  },
};

// ─── Sub-components ──────────────────────────────────────

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors relative',
        isActive
          ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </Link>
  );
}

// ─── Main Component ──────────────────────────────────────

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const pathname  = usePathname();
  const router    = useRouter();

  const [unreadCount, setUnreadCount] = useState(0);
  const pollingRef      = useRef<NodeJS.Timeout | null>(null);
  const errorsRef       = useRef(0);
  const lastFetchRef    = useRef(0);
  const searchContainer = useRef<HTMLDivElement>(null);

  const currentLanguage      = LANGUAGES.find(l => l.code === language);
  const isSecondaryNavActive = SECONDARY_NAV.some(item => pathname.startsWith(item.href));

  const role     = (user?.role ?? 'USER') as UserRole;
  const roleKey  = role in ROLE_STYLES ? role : 'USER';
  const roleCfg  = ROLE_STYLES[roleKey];
  const isAdmin  = role === 'ADMIN';
  const isStaff  = role === 'ADMIN' || role === 'MODERATOR';

  // ── Search ──
  const {
    query: searchQuery, results: searchResults,
    isLoading: isSearchLoading, isOpen: isSearchOpen,
    highlightedIndex, handleQueryChange, handleClear,
    handleClose, handleKeyDown,
  } = useSearch(language);

  const handleSelectResult = useCallback((result: SearchResult) => {
    router.push(result.href);
    handleClear();
  }, [router, handleClear]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0 && isSearchOpen) {
      e.preventDefault();
      const hit = searchResults[highlightedIndex];
      if (hit) handleSelectResult(hit);
    } else {
      handleKeyDown(e);
    }
  }, [searchResults, isSearchOpen, highlightedIndex, handleSelectResult, handleKeyDown]);

  // Click-outside for search
  useEffect(() => {
    if (!isSearchOpen) return;
    const handler = (e: MouseEvent) => {
      if (!searchContainer.current?.contains(e.target as Node)) handleClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSearchOpen, handleClose]);

  // ── Notification polling ──
  const restartPolling = useCallback((ms: number) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchUnread, ms);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    if (now - lastFetchRef.current < DEDUPE_MS) return;
    lastFetchRef.current = now;

    if (errorsRef.current >= MAX_ERRORS) {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      return;
    }

    try {
      setUnreadCount(await getUnreadNotificationCount());
      errorsRef.current = 0;
      restartPolling(BASE_POLL_MS);
    } catch {
      errorsRef.current += 1;
      setUnreadCount(0);
      if (errorsRef.current >= MAX_ERRORS) {
        console.warn('[Navbar] Notification polling stopped after repeated failures');
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      } else {
        restartPolling(BASE_POLL_MS * Math.pow(2, errorsRef.current));
      }
    }
  }, [user, restartPolling]);

  useEffect(() => {
    if (!user) {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      queueMicrotask(() => setUnreadCount(0));
      return;
    }
    errorsRef.current  = 0;
    lastFetchRef.current = 0;
    queueMicrotask(fetchUnread);
    restartPolling(BASE_POLL_MS);

    const onVisibility = () => { if (document.visibilityState === 'visible') fetchUnread(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user, fetchUnread, restartPolling]);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-6">

          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/images/logo.png" alt="ReadyRoad Logo" width={32} height={32} className="rounded-md" />
            <span className="text-lg font-black text-foreground">ReadyRoad</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {PRIMARY_NAV.map(item => (
              <NavLink key={item.href} href={item.href} label={t(item.name)} pathname={pathname} />
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  'relative inline-flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors',
                  isSecondaryNavActive
                    ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                  {t('nav.more')} <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {SECONDARY_NAV.map(item => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className={cn(pathname.startsWith(item.href) && 'bg-primary/8 font-semibold text-primary')}>
                      {t(item.name)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu */}
          <div className="flex items-center lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm"><Menu className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                {ALL_NAV.map(item => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className={cn(pathname.startsWith(item.href) && 'bg-primary/8 font-semibold text-primary')}>
                      {t(item.name)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right utilities */}
          <div className="flex shrink-0 items-center gap-3">

            {/* Search */}
            <div ref={searchContainer} className="relative hidden items-center md:flex">
              <Search className={cn('pointer-events-none absolute z-10 h-4 w-4 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
              <input
                type="text"
                placeholder={t('nav.search')}
                value={searchQuery}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={cn(
                  'w-48 rounded-full border border-border bg-muted py-2 text-sm transition-all focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20',
                  isRTL ? 'pl-10 pr-9' : 'pl-9 pr-10',
                )}
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  aria-label="Clear search"
                  className={cn('absolute z-10 text-muted-foreground hover:text-foreground', isRTL ? 'left-3' : 'right-3')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {isSearchOpen && (
                <SearchDropdown
                  results={searchResults}
                  isLoading={isSearchLoading}
                  query={searchQuery}
                  highlightedIndex={highlightedIndex}
                  onSelect={handleSelectResult}
                />
              )}
            </div>

            {/* Notifications panel */}
            {user && (
              <NotificationPanel
                unreadCount={unreadCount}
                onAllRead={() => setUnreadCount(0)}
              />
            )}

            {/* Language selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <span className="text-base">{currentLanguage?.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                {LANGUAGES.map(lang => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as LangCode)}
                    className={cn(language === lang.code && 'bg-primary/8 font-semibold text-primary')}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm">{lang.nativeName}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu / Auth buttons */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account menu"
                    className={cn(
                      'flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 shadow-sm transition-all focus:outline-none focus:ring-2',
                      roleCfg.trigger,
                    )}
                  >
                    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', roleCfg.avatar)}>
                      {isAdmin
                        ? <Shield className="h-4 w-4 text-primary-foreground" />
                        : <User   className="h-4 w-4 text-primary-foreground" />
                      }
                    </span>
                    <span className={cn('hidden max-w-[100px] truncate text-sm font-semibold sm:block', roleCfg.text)}>
                      {user.fullName ?? user.username ?? 'User'}
                    </span>
                    <ChevronDown className={cn('hidden h-3.5 w-3.5 sm:block', roleCfg.chevron)} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-52">
                  {/* User info */}
                  <div className={cn('border-b px-3 py-2', roleCfg.header)}>
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-black text-foreground">
                        {user.fullName ?? user.username}
                      </p>
                      {isStaff && (
                        <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide', roleCfg.badge)}>
                          {user.role}
                        </span>
                      )}
                    </div>
                    {user.email && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
                    )}
                  </div>

                  {/* Admin link */}
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/admin" className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4 text-amber-600" />
                          <span className="font-semibold text-amber-700">Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                      <div className="my-1 border-t border-border" />
                    </>
                  )}

                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={ROUTES.PROFILE} className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={ROUTES.PROGRESS} className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      {t('nav.progress')}
                    </Link>
                  </DropdownMenuItem>

                  <div className="my-1 border-t border-border" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={ROUTES.LOGIN}>{t('auth.login')}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={ROUTES.REGISTER}>{t('auth.register')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
