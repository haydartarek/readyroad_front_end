"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import Link from "@/components/localized-link";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import { useAuth } from "@/hooks/useAuth";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NATIVE_SELECT_COMPACT_CLASS,
  NATIVE_SELECT_DISABLED_CLASS,
} from "@/lib/native-select-styles";
import { cn } from "@/lib/utils";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  BarChart3,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────

type UserRow = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
};
type UsersResponse = {
  users: UserRow[];
  total: number;
  page: number;
  size: number;
  totalPages?: number;
  query?: string;
};
type UserSummary = {
  total: number;
  active: number;
  locked: number;
  inactive: number;
  newThisWeek: number;
  newSince: string;
};

const ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
const EMPTY_CREATE_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
  preferredLanguage: "en",
  role: "USER",
  isActive: true,
  emailVerified: false,
};

// ─── Helpers ────────────────────────────────────────────

const AVATAR_COLOR: Record<string, string> = {
  ADMIN: "bg-purple-500",
  MODERATOR: "bg-blue-500",
  STUDENT: "bg-emerald-500",
  USER: "bg-slate-400",
};

const ROLE_SELECT: Record<string, string> = {
  ADMIN: "border-purple-200 bg-purple-500/10 text-purple-700",
  MODERATOR: "border-blue-200 bg-blue-500/10 text-blue-700",
  STUDENT: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  USER: "border-border bg-muted text-foreground",
};

function formatDate(dateStr: string, language: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(`${language}-u-ca-gregory`, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Page ───────────────────────────────────────────────

export default function AdminUsersPage() {
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [page, setPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<number, string>>(
    {},
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  const pageSize = 20;
  const totalPages = Math.ceil(totalUsers / pageSize);

  const clearAction = (id: number) =>
    setActionLoading((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const fetchUsers = useCallback(
    async (pageNum = 0) => {
      setLoading(true);
      setError(null);
      setServiceUnavailable(false);
      try {
        const [res, summaryRes] = await Promise.all([
          apiClient.get<UsersResponse>("/admin/users", {
            page: pageNum,
            size: pageSize,
            q: searchQuery,
            sortField: "createdAt",
            sortDir: "desc",
          }),
          apiClient.get<UserSummary>("/admin/users/summary"),
        ]);
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.users ?? []);
        setUsers(list);
        setTotalUsers(data.total ?? list.length);
        setSummary(summaryRes.data);
        setPage(pageNum);
      } catch (e: unknown) {
        logApiError("Failed to fetch users", e);
        if (isServiceUnavailable(e)) setServiceUnavailable(true);
        else setError(t("admin.users.fetch_error"));
      } finally {
        setLoading(false);
      }
    },
    [t, searchQuery],
  );

  useEffect(() => {
    fetchUsers(0);
  }, [fetchUsers]);

  const toggleLock = async (user: UserRow) => {
    const next = !user.isLocked;
    if (!window.confirm(t(next ? "admin.users.confirm_lock" : "admin.users.confirm_unlock"))) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [user.id]: "lock" }));
    try {
      await apiClient.put(`/admin/users/${user.id}/lock`, { isLocked: next });
      await fetchUsers(page);
    } catch (e: unknown) {
      logApiError("Failed to toggle lock", e);
      if (isServiceUnavailable(e)) setServiceUnavailable(true);
      else setError(t("admin.users.lock_error"));
    } finally {
      clearAction(user.id);
    }
  };

  const changeRole = async (user: UserRow, newRole: string) => {
    if (newRole === user.role) return;
    if (!window.confirm(t("admin.users.confirm_role"))) return;
    setActionLoading((p) => ({ ...p, [user.id]: "role" }));
    try {
      await apiClient.put(`/admin/users/${user.id}/role`, { role: newRole });
      await fetchUsers(page);
    } catch (e: unknown) {
      logApiError("Failed to change role", e);
      if (isServiceUnavailable(e)) setServiceUnavailable(true);
      else setError(t("admin.users.role_error"));
    } finally {
      clearAction(user.id);
    }
  };

  const createUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await apiClient.post("/admin/users", createForm);
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      await fetchUsers(0);
    } catch (e: unknown) {
      logApiError("Failed to create admin user", e);
      const message = (e as { response?: { data?: { message?: string; error?: string } } })
        .response?.data;
      setCreateError(message?.message || message?.error || t("admin.users.create_error"));
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = useMemo(() => users, [users]);

  return (
    <div className="space-y-5">
      {serviceUnavailable && (
        <ServiceUnavailableBanner onRetry={() => fetchUsers(page)} />
      )}

      <AdminPageHeader
        icon={<Users className="h-6 w-6" />}
        title={t("admin.users.title")}
        description={t("admin.users.description")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {t("admin.users.create")}
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchUsers(page)}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              {loading ? t("common.loading") : t("admin.users.refresh")}
            </Button>
          </div>
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <form onSubmit={createUser} className="space-y-5">
            <DialogHeader>
              <DialogTitle>{t("admin.users.create_title")}</DialogTitle>
              <DialogDescription>{t("admin.users.create_description")}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["firstName", "admin.users.first_name", "given-name"],
                ["lastName", "admin.users.last_name", "family-name"],
                ["email", "admin.users.email", "email"],
                ["username", "admin.users.username", "username"],
              ] as const).map(([field, label, autoComplete]) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`create-${field}`}>{t(label)}</Label>
                  <Input
                    id={`create-${field}`}
                    type={field === "email" ? "email" : "text"}
                    autoComplete={autoComplete}
                    required
                    value={createForm[field]}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, [field]: event.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="create-password">{t("admin.users.password")}</Label>
                <Input
                  id="create-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">{t("admin.users.password_hint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-language">{t("admin.users.preferred_language")}</Label>
                <select
                  id="create-language"
                  value={createForm.preferredLanguage}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, preferredLanguage: event.target.value }))
                  }
                  className={NATIVE_SELECT_COMPACT_CLASS}
                >
                  <option value="en">English</option>
                  <option value="nl">Nederlands</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-role">{t("admin.users.col_role")}</Label>
                <select
                  id="create-role"
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, role: event.target.value }))
                  }
                  className={NATIVE_SELECT_COMPACT_CLASS}
                >
                  {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/50 bg-muted/25 p-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={createForm.isActive}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, isActive: event.target.checked }))
                  }
                  className="h-4 w-4 accent-primary"
                />
                {t("admin.users.status_active")}
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={createForm.emailVerified}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, emailVerified: event.target.checked }))
                  }
                  className="h-4 w-4 accent-primary"
                />
                {t("admin.users.email_verified")}
              </label>
            </div>

            {createError && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={creating} className="gap-2">
                {creating && <RefreshCw className="h-4 w-4 animate-spin" />}
                {creating ? t("common.loading") : t("admin.users.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminMetricCard
          label={t("admin.users.total_users")}
          value={summary?.total ?? totalUsers}
          icon={<Users className="w-5 h-5 text-primary" />}
          iconClassName="bg-primary/10 text-primary"
          loading={loading && !summary}
        />
        <AdminMetricCard
          label={t("admin.users.active_users")}
          value={summary?.active}
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          labelClassName="text-emerald-600"
          valueClassName="text-emerald-700"
          iconClassName="bg-emerald-500/10 text-emerald-600"
          loading={loading && !summary}
        />
        <AdminMetricCard
          label={t("admin.users.locked_users")}
          value={summary?.locked}
          icon={<UserX className="w-5 h-5 text-destructive" />}
          labelClassName="text-destructive"
          valueClassName="text-destructive"
          iconClassName="bg-destructive/10 text-destructive"
          loading={loading && !summary}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="admin-users-search"
            name="usersSearch"
            type="text"
            autoComplete="off"
            placeholder={t("admin.users.search_placeholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {filteredUsers.length}
          </span>{" "}
          / {totalUsers}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/40">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-left font-semibold">
                  {t("admin.users.col_user")}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {t("admin.users.col_email")}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {t("admin.users.col_role")}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {t("admin.users.col_status")}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {t("admin.users.col_joined")}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {t("admin.signs.col_actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>{t("common.loading")}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="space-y-2">
                      <div className="text-4xl">👤</div>
                      <p className="text-muted-foreground">
                        {t("admin.users.no_users")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isLoading = !!actionLoading[user.id];
                  const displayName = user.fullName || user.username;
                  const avatarColor = AVATAR_COLOR[user.role] || "bg-slate-400";
                  const isCurrentUser = currentUser?.username === user.username;

                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        user.isLocked && "bg-destructive/5",
                      )}
                    >
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0",
                              avatarColor,
                            )}
                          >
                            {(displayName || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {displayName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {user.email || "—"}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <select
                          id={`admin-user-role-${user.id}`}
                          name={`role-${user.id}`}
                          value={user.role}
                          onChange={(e) => changeRole(user, e.target.value)}
                          disabled={isLoading || isCurrentUser}
                          className={cn(
                            NATIVE_SELECT_COMPACT_CLASS,
                            NATIVE_SELECT_DISABLED_CLASS,
                            "px-2.5 text-xs shadow-none disabled:opacity-60",
                            ROLE_SELECT[user.role] || ROLE_SELECT.USER,
                          )}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                              user.isActive
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {user.isActive
                              ? t("admin.users.status_active")
                              : t("admin.users.status_inactive")}
                          </span>
                          {user.isLocked && (
                            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                              <Lock className="w-2.5 h-2.5" />
                              {t("admin.users.status_locked")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(user.createdAt, language)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.role === "USER" ? (
                            <Link
                              href={`/admin/users/${user.id}/learning`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                            >
                              <BarChart3 className="h-3 w-3" />
                              {t("admin.users.learning_profile")}
                            </Link>
                          ) : null}
                          <button
                            onClick={() => toggleLock(user)}
                            disabled={isLoading || isCurrentUser}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all disabled:opacity-50",
                              user.isLocked
                                ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                                : "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20",
                            )}
                          >
                            {isLoading && actionLoading[user.id] === "lock" ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : user.isLocked ? (
                              <>
                                <Unlock className="w-3 h-3" />{" "}
                                {t("admin.users.unlock")}
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />{" "}
                                {t("admin.users.lock")}
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 bg-muted/30 px-4 py-3">
            <span className="text-xs text-muted-foreground font-medium">
              {t("admin.users.page_info")
                .replace("{current}", String(page + 1))
                .replace("{total}", String(totalPages))}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(page - 1)}
                disabled={page === 0 || loading}
                className="w-8 h-8 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => fetchUsers(page + 1)}
                disabled={page >= totalPages - 1 || loading}
                className="w-8 h-8 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
