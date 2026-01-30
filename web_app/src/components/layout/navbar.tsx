'use client';

import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES, LANGUAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Search, Bell, ChevronDown, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useSearch } from '@/hooks/use-search';
import { SearchDropdown, type SearchResult } from '@/components/layout/search-dropdown';

// Primary navigation items (visible in center)
const primaryNavItems = [
  { name: 'nav.home', href: '/' },
  { name: 'nav.dashboard', href: ROUTES.DASHBOARD },
  { name: 'nav.exam', href: ROUTES.EXAM },
  { name: 'nav.practice', href: ROUTES.PRACTICE },
];

// Secondary navigation items (in "More" dropdown)
const secondaryNavItems = [
  { name: 'nav.traffic_signs', href: ROUTES.TRAFFIC_SIGNS },
  { name: 'nav.lessons', href: ROUTES.LESSONS },
  { name: 'nav.analytics', href: ROUTES.ANALYTICS_WEAK_AREAS },
  { name: 'nav.progress', href: ROUTES.PROGRESS },
  { name: 'nav.profile', href: ROUTES.PROFILE },
];

export function Navbar() {
  const { user } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Search hook integration
  const {
    query: searchQuery,
    results: searchResults,
    isLoading: isSearchLoading,
    isOpen: isSearchOpen,
    highlightedIndex,
    handleQueryChange,
    handleClear,
    handleClose,
    handleKeyDown,
  } = useSearch(language);

  const currentLanguage = LANGUAGES.find(l => l.code === language);

  // Check if any secondary nav item is active
  const isSecondaryNavActive = secondaryNavItems.some(item => pathname.startsWith(item.href));

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const response = await apiClient.get<{ unreadCount: number }>('/users/me/notifications/unread-count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      // Silently fail - hide badge on error (safe fallback)
      console.warn('Failed to fetch unread notifications count:', error);
      setUnreadCount(0);
    }
  }, [user]);

  // Setup polling and visibility change handler
  useEffect(() => {
    // Reset count and exit early if no user
    if (!user) {
      // Stop polling when logged out
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      // Use queueMicrotask to avoid setState in effect body warning
      queueMicrotask(() => setUnreadCount(0));
      return;
    }

    // Fetch immediately on login (async to avoid setState warning)
    queueMicrotask(() => {
      fetchUnreadCount();
    });

    // Start polling every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    // Handle tab visibility change - refresh when user returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchUnreadCount]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSearchOpen, handleClose]);

  // Handle search result selection
  const handleSelectResult = (result: SearchResult) => {
    router.push(result.href);
    handleClear(); // Clear search and close dropdown after navigation
  };

  // Handle Enter key on highlighted result
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0 && isSearchOpen) {
      e.preventDefault();
      const selectedResult = searchResults[highlightedIndex];
      if (selectedResult) {
        handleSelectResult(selectedResult);
      }
    } else {
      handleKeyDown(e);
    }
  };

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Left: Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/images/logo.png"
              alt="ReadyRoad Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="text-lg font-semibold text-gray-900">ReadyRoad</span>
          </Link>

          {/* Center: Primary Navigation + More Dropdown */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {primaryNavItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors relative',
                    isActive
                      ? 'text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {t(item.name)}
                </Link>
              );
            })}

            {/* More Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors relative inline-flex items-center gap-1',
                    isSecondaryNavActive
                      ? 'text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {t('nav.more')}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {secondaryNavItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild className="cursor-pointer">
                    <Link href={item.href} className={cn(
                      pathname.startsWith(item.href) && 'bg-accent font-medium'
                    )}>
                      {t(item.name)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
                {[...primaryNavItems, ...secondaryNavItems].map((item) => (
                  <DropdownMenuItem key={item.href} asChild className="cursor-pointer">
                    <Link href={item.href} className={cn(
                      pathname.startsWith(item.href) && 'bg-accent font-medium'
                    )}>
                      {t(item.name)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right: Utilities */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search Input with Dropdown */}
            <div ref={searchContainerRef} className="hidden md:flex items-center relative">
              <Search className={cn(
                "absolute h-4 w-4 text-gray-400 pointer-events-none z-10",
                isRTL ? "right-3" : "left-3"
              )} />
              <input
                type="text"
                placeholder={t('nav.search')}
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={cn(
                  "py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 transition-all",
                  isRTL ? "pr-9 pl-10" : "pl-9 pr-10"
                )}
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className={cn(
                    "absolute h-4 w-4 text-gray-400 hover:text-gray-600 z-10",
                    isRTL ? "left-3" : "right-3"
                  )}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Search Results Dropdown */}
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

            {/* Notification Icon */}
            {user && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {/* Dynamic notification badge - only show when unreadCount > 0 */}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
            )}

            {/* Language Selector (Compact) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <span className="text-base">{currentLanguage?.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-40">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as 'en' | 'ar' | 'nl' | 'fr')}
                    className={cn(
                      'cursor-pointer gap-2',
                      language === lang.code && 'bg-accent'
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm">{lang.nativeName}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar or Auth Buttons */}
            {user ? (
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              </Button>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={ROUTES.LOGIN}>{t('auth.login')}</Link>
                </Button>
                <Button asChild size="sm">
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
