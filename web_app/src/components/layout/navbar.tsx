"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useSearch } from "@/hooks/use-search";
import {
  SearchDropdown,
  type SearchResult,
} from "@/components/layout/search-dropdown";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { LANGUAGES, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type LangCode = "en" | "ar" | "nl" | "fr";

const NAV_ITEMS = [
  { name: "nav.home", href: "/" },
  { name: "nav.lessons", href: ROUTES.LESSONS },
  { name: "nav.traffic_signs", href: ROUTES.TRAFFIC_SIGNS },
  { name: "nav.dashboard", href: ROUTES.DASHBOARD },
  { name: "nav.exam", href: ROUTES.EXAM },
  { name: "nav.practice", href: ROUTES.PRACTICE },
] as const;

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

function getRoleLabelKey(role?: string) {
  if (role === "ADMIN") return "nav.role_admin";
  if (role === "MODERATOR") return "nav.role_moderator";
  return "nav.role_member";
}

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "text-muted-foreground hover:bg-background hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const searchContainer = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage = AUTH_PATHS.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminDashboardPage = pathname === "/admin/dashboard";

  const currentLanguage = LANGUAGES.find((item) => item.code === language);
  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const roleLabel = t(getRoleLabelKey(user?.role));
  const displayName = user?.fullName ?? user?.username ?? t("nav.profile");
  const userInitial = displayName.trim().charAt(0).toUpperCase();
  const themeMounted = typeof resolvedTheme === "string";
  const isDarkTheme = resolvedTheme === "dark";

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

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      router.push(result.href);
      handleClear();
      setMobileMenuOpen(false);
    },
    [router, handleClear],
  );

  const handleLogout = useCallback(() => {
    setMobileMenuOpen(false);
    logout();
  }, [logout]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && searchResults.length > 0 && isSearchOpen) {
        e.preventDefault();
        const hit = searchResults[highlightedIndex];
        if (hit) handleSelectResult(hit);
      } else {
        handleKeyDown(e);
      }
    },
    [
      searchResults,
      isSearchOpen,
      highlightedIndex,
      handleSelectResult,
      handleKeyDown,
    ],
  );

  useEffect(() => {
    if (!isSearchOpen) return;
    const handler = (e: MouseEvent) => {
      if (!searchContainer.current?.contains(e.target as Node)) handleClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSearchOpen, handleClose]);

  if (isAuthPage || (isAdminPage && !isAdminDashboardPage)) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/92 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-[74px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" prefetch={false} className="flex shrink-0 items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="ReadyRoad Logo"
            width={48}
            height={48}
            className="rounded-2xl ring-1 ring-border/50"
          />
          <span className="text-[1.12rem] font-black leading-none tracking-tight sm:text-[1.24rem] md:text-[1.34rem] lg:text-[1.48rem]">
            <span className="text-primary">R</span>
            <span className="text-secondary">eady</span>
            <span className="text-primary">R</span>
            <span className="text-secondary">oad</span>
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/45 p-1 shadow-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={t(item.name)}
                pathname={pathname}
              />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div ref={searchContainer} className="relative hidden items-center xl:flex">
            <Search
              className={cn(
                "pointer-events-none absolute z-10 h-4 w-4 text-muted-foreground",
                isRTL ? "right-4" : "left-4",
              )}
            />
            <input
              id="navbar-search"
              name="search"
              type="text"
              autoComplete="off"
              placeholder={t("nav.search")}
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className={cn(
                "h-11 w-40 rounded-full border border-border/70 bg-muted/40 py-2 text-sm transition-all duration-200 focus:border-primary/30 focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/12 2xl:w-48",
                isRTL ? "pl-11 pr-10" : "pl-10 pr-11",
              )}
            />
            {searchQuery ? (
              <button
                onClick={handleClear}
                aria-label={t("nav.clear_search")}
                className={cn(
                  "absolute z-10 text-muted-foreground transition-colors hover:text-foreground",
                  isRTL ? "left-4" : "right-4",
                )}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            {isSearchOpen ? (
              <SearchDropdown
                results={searchResults}
                isLoading={isSearchLoading}
                query={searchQuery}
                highlightedIndex={highlightedIndex}
                onSelect={handleSelectResult}
              />
            ) : null}
          </div>

          <div className="hidden lg:block">
            {user ? <NotificationPanel /> : null}
          </div>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("nav.account_menu")}
                  className="relative h-11 w-11 rounded-full border border-border/70 bg-card p-0 shadow-sm transition-all duration-200 hover:border-primary/20 hover:bg-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/12"
                >
                  <span
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-full text-[15px] font-black uppercase text-primary-foreground shadow-sm ring-1",
                      isStaff
                        ? "bg-gradient-to-br from-primary to-primary/80 ring-primary/25"
                        : "bg-secondary ring-secondary/20",
                    )}
                  >
                    {userInitial}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align={isRTL ? "start" : "end"}
                className="w-64"
              >
                <div className="mb-2 rounded-[1.25rem] border border-border/60 bg-muted/35 px-3.5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black uppercase text-primary-foreground shadow-sm ring-1",
                        isStaff
                          ? "bg-gradient-to-br from-primary to-primary/80 ring-primary/25"
                          : "bg-secondary ring-secondary/20",
                      )}
                    >
                      {userInitial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-foreground">
                        {displayName}
                      </p>
                      {user.email ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      ) : null}
                      {isStaff ? (
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                          {roleLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {isAdmin ? (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/admin/dashboard" prefetch={false}>
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                        {t("nav.admin_panel")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : null}

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={ROUTES.PROFILE} prefetch={false}>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    {t("nav.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  {t("auth.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <button
            type="button"
            aria-label={
              themeMounted
                ? isDarkTheme
                  ? t("nav.theme_light")
                  : t("nav.theme_dark")
                : t("nav.toggle_theme")
            }
            title={
              themeMounted
                ? isDarkTheme
                  ? t("nav.theme_light")
                  : t("nav.theme_dark")
                : t("nav.toggle_theme")
            }
            onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/20 hover:bg-muted/50 hover:text-primary lg:inline-flex"
          >
            {themeMounted && isDarkTheme ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("nav.language_menu")}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-card px-3 text-sm font-semibold shadow-sm transition-colors hover:border-primary/20 hover:bg-muted/50"
                >
                  <span className="text-xs font-bold text-muted-foreground">
                    {currentLanguage?.flag}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-52">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as LangCode)}
                    className={cn(
                      language === lang.code &&
                        "border-primary/12 bg-primary/[0.09] font-bold text-foreground",
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm">{lang.nativeName}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {!isAuthenticated || !user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="rounded-full px-4 font-semibold"
              >
                <Link href={ROUTES.LOGIN} prefetch={false}>{t("auth.login")}</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="rounded-full px-5 font-semibold shadow-lg shadow-primary/20"
              >
                <Link href={ROUTES.REGISTER} prefetch={false}>{t("auth.register")}</Link>
              </Button>
            </div>
          ) : null}

          <div className="flex items-center lg:hidden">
            <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-full border-border/70 bg-card p-0 shadow-sm transition-all duration-200 hover:border-primary/20 hover:bg-muted/50"
                >
                  <span className="sr-only">{t("nav.open_menu")}</span>
                  <Menu className="h-5 w-5" />
                </Button>
              </DialogTrigger>

              <DialogContent
                showCloseButton={false}
                overlayClassName="bg-secondary/35 backdrop-blur-sm supports-[backdrop-filter]:bg-secondary/20"
                className="left-0 top-[74px] h-[calc(100dvh-74px)] max-h-[calc(100dvh-74px)] w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-x-0 border-b border-border/60 bg-background/90 p-0 shadow-2xl backdrop-blur-2xl supports-[backdrop-filter]:bg-background/78"
              >
                <DialogTitle className="sr-only">{t("nav.open_menu")}</DialogTitle>
                <DialogDescription className="sr-only">
                  {t("nav.mobile_menu_description")}
                </DialogDescription>

                <div className="flex h-full flex-col overflow-hidden">
                  <div className="border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                          <Menu className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-foreground">
                            {t("nav.open_menu")}
                          </p>
                          <p className="truncate text-xs font-medium text-muted-foreground">
                            {isAuthenticated ? displayName : t("app.name")}
                          </p>
                        </div>
                      </div>

                      <DialogClose asChild>
                        <button
                          type="button"
                          aria-label={t("common.close")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/20 hover:bg-muted/50 hover:text-primary"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </DialogClose>
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-[1.6rem] border border-border/60 bg-muted/35 p-2">
                      {user ? (
                        <div className="shrink-0">
                          <NotificationPanel />
                        </div>
                      ) : null}

                      <button
                        type="button"
                        aria-label={
                          themeMounted
                            ? isDarkTheme
                              ? t("nav.theme_light")
                              : t("nav.theme_dark")
                            : t("nav.toggle_theme")
                        }
                        title={
                          themeMounted
                            ? isDarkTheme
                              ? t("nav.theme_light")
                              : t("nav.theme_dark")
                            : t("nav.toggle_theme")
                        }
                        onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/20 hover:bg-muted/50 hover:text-primary"
                      >
                        {themeMounted && isDarkTheme ? (
                          <Sun className="h-[18px] w-[18px]" />
                        ) : (
                          <Moon className="h-[18px] w-[18px]" />
                        )}
                      </button>

                      <div className="flex min-w-0 flex-1 items-center justify-end gap-1 rounded-full border border-border/70 bg-card p-1 shadow-sm">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => setLanguage(lang.code as LangCode)}
                            className={cn(
                              "inline-flex min-w-10 items-center justify-center rounded-full px-2.5 py-2 text-xs font-bold transition-all duration-200",
                              language === lang.code
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                            )}
                            aria-label={lang.nativeName}
                            title={lang.nativeName}
                          >
                            {lang.flag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isAuthenticated && user ? (
                      <div className="mt-4 flex items-center gap-3 rounded-[1.6rem] border border-border/60 bg-card/85 px-3.5 py-3.5 shadow-sm">
                        <span
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-black uppercase text-primary-foreground shadow-sm ring-1",
                            isStaff
                              ? "bg-gradient-to-br from-primary to-primary/80 ring-primary/25"
                              : "bg-secondary ring-secondary/20",
                          )}
                        >
                          {userInitial}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {isStaff ? roleLabel : user.email ?? t("nav.profile")}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="grid gap-2.5">
                      {NAV_ITEMS.map((item) => {
                        const isActive =
                          item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);

                        return (
                          <DialogClose asChild key={item.href}>
                            <Link
                              href={item.href}
                              prefetch={false}
                              className={cn(
                                "flex items-center justify-between rounded-[1.6rem] border px-4 py-4 text-sm font-semibold transition-all duration-200",
                                isActive
                                  ? "border-primary/20 bg-primary/[0.07] text-foreground shadow-sm"
                                  : "border-border/60 bg-card/80 text-foreground hover:border-primary/20 hover:bg-muted/40",
                              )}
                            >
                              <span>{t(item.name)}</span>
                              <span
                                className={cn(
                                  "h-2.5 w-2.5 rounded-full",
                                  isActive ? "bg-primary" : "bg-border",
                                )}
                              />
                            </Link>
                          </DialogClose>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-[1.8rem] border border-border/60 bg-card/70 p-3 shadow-sm">
                      <div className="grid gap-2">
                        {!isAuthenticated ? (
                          <>
                            <DialogClose asChild>
                              <Link
                                href={ROUTES.LOGIN}
                                prefetch={false}
                                className="flex items-center justify-between rounded-[1.3rem] border border-border/60 bg-background/80 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/20 hover:bg-muted/40"
                              >
                                <span>{t("auth.login")}</span>
                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                              </Link>
                            </DialogClose>
                            <DialogClose asChild>
                              <Link
                                href={ROUTES.REGISTER}
                                prefetch={false}
                                className="flex items-center justify-between rounded-[1.3rem] border border-primary/15 bg-primary/[0.07] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/25 hover:bg-primary/[0.11]"
                              >
                                <span>{t("auth.register")}</span>
                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                              </Link>
                            </DialogClose>
                          </>
                        ) : (
                          <>
                            {isAdmin ? (
                              <DialogClose asChild>
                                <Link
                                  href="/admin/dashboard"
                                  prefetch={false}
                                  className="flex items-center gap-3 rounded-[1.3rem] border border-border/60 bg-background/80 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/20 hover:bg-muted/40"
                                >
                                  <LayoutDashboard className="h-4 w-4 text-primary" />
                                  <span>{t("nav.admin_panel")}</span>
                                </Link>
                              </DialogClose>
                            ) : null}
                            <DialogClose asChild>
                              <Link
                                href={ROUTES.PROFILE}
                                prefetch={false}
                                className="flex items-center gap-3 rounded-[1.3rem] border border-border/60 bg-background/80 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/20 hover:bg-muted/40"
                              >
                                <Settings className="h-4 w-4 text-muted-foreground" />
                                <span>{t("nav.profile")}</span>
                              </Link>
                            </DialogClose>
                            <button
                              type="button"
                              onClick={handleLogout}
                              className="flex items-center gap-3 rounded-[1.3rem] border border-destructive/15 bg-destructive/[0.05] px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:border-destructive/25 hover:bg-destructive/[0.08]"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>{t("auth.logout")}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </nav>
  );
}
