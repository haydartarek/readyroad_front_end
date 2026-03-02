/**
 * Test Component for Services
 * Location: src/app/test-services/page.tsx
 * Usage: Navigate to http://localhost:3000/test-services
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentUser, getUnreadNotificationCount,
  isAdmin, isModerator, hasRole,
  type UserProfile,
} from '@/services';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  RefreshCw, User, Bell, ShieldCheck,
  Radio, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';

// ─── Sub-components ─────────────────────────────────────

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 space-y-4">
      <h2 className="text-lg font-black text-foreground flex items-center gap-2">
        {icon}{title}
      </h2>
      {children}
    </div>
  );
}

function PermissionRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
      <span className="font-semibold text-foreground">{label}</span>
      <span className={cn('flex items-center gap-1.5 font-semibold', value ? 'text-emerald-600' : 'text-destructive')}>
        {value
          ? <><CheckCircle2 className="w-4 h-4" /> Yes</>
          : <><XCircle className="w-4 h-4" /> No</>}
      </span>
    </div>
  );
}

type EndpointStatus = 'ok' | 'pending';

function EndpointRow({ method, path, status }: {
  method: string; path: string; status: EndpointStatus;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {status === 'ok'
        ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        : <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
      <Badge variant="outline" className="font-mono text-xs">{method}</Badge>
      <code className="bg-muted px-2 py-0.5 rounded-lg text-xs flex-1">{path}</code>
      <span className={cn('text-xs font-medium', status === 'ok' ? 'text-emerald-600' : 'text-yellow-600')}>
        {status === 'ok' ? 'Working' : 'Not Implemented'}
      </span>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────

export default function TestServicesPage() {
  const [user, setUser]                     = useState<UserProfile | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [userData, count] = await Promise.all([
        getCurrentUser(),
        getUnreadNotificationCount(),
      ]);
      console.log('✅ User loaded:', userData);
      console.log('✅ Notification count:', count);
      console.log('✅ Is Admin?', isAdmin(userData));
      console.log('✅ Is Moderator?', isModerator(userData));
      console.log('✅ Has USER role?', hasRole(userData, 'USER'));
      setUser(userData);
      setNotificationCount(count);
    } catch (err) {
      console.error('❌ Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-destructive/5 border border-destructive/30 rounded-2xl p-6 max-w-md w-full space-y-4">
          <div className="flex items-center gap-2 text-destructive font-black">
            <XCircle className="w-5 h-5" /> Error
          </div>
          <p className="text-sm text-destructive/80">{error}</p>
          <Button variant="destructive" onClick={loadUserData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
          <h1 className="text-3xl font-black tracking-tight text-foreground">🧪 Services Test Page</h1>
          <p className="text-muted-foreground mt-1">Testing userService and authService functionality</p>
        </div>

        {/* User Profile */}
        {user && (
          <SectionCard
            title="User Profile"
            icon={<User className="w-5 h-5 text-primary" />}
          >
            <div className="flex flex-wrap gap-2 mb-2">
              {isAdmin(user) && (
                <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">👑 ADMIN</Badge>
              )}
              {isModerator(user) && !isAdmin(user) && (
                <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">🛡️ MODERATOR</Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                ['User ID',        user.userId],
                ['Username',       user.username],
                ['Full Name',      user.fullName],
                ['Email',          user.email],
                ['Role',           user.role],
              ] as [string, string | number][]).map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-base font-medium text-foreground mt-0.5">{val}</p>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account Status</p>
                <p className={cn('text-base font-semibold mt-0.5 flex items-center gap-1.5',
                  user.isActive ? 'text-emerald-600' : 'text-destructive')}>
                  {user.isActive
                    ? <><CheckCircle2 className="w-4 h-4" /> Active</>
                    : <><XCircle className="w-4 h-4" /> Inactive</>}
                </p>
              </div>
              {user.createdAt && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created At</p>
                  <p className="text-base font-medium text-foreground mt-0.5">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {user.lastLogin && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Login</p>
                  <p className="text-base font-medium text-foreground mt-0.5">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Notifications */}
        <SectionCard title="Notifications" icon={<Bell className="w-5 h-5 text-primary" />}>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black text-primary">{notificationCount}</div>
            <div>
              <p className="font-semibold text-foreground">Unread Notifications</p>
              <p className="text-sm text-muted-foreground">
                {notificationCount === 0
                  ? "You're all caught up!"
                  : `You have ${notificationCount} unread notification${notificationCount > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Role Permissions */}
        {user && (
          <SectionCard title="Role Permissions" icon={<ShieldCheck className="w-5 h-5 text-primary" />}>
            <div className="space-y-2">
              <PermissionRow label="Has USER role"             value={hasRole(user, 'USER')} />
              <PermissionRow label="Has MODERATOR role"        value={hasRole(user, 'MODERATOR')} />
              <PermissionRow label="Has ADMIN role"            value={hasRole(user, 'ADMIN')} />
              <PermissionRow label="Is Admin (exact match)"    value={isAdmin(user)} />
              <PermissionRow label="Is Moderator or higher"    value={isModerator(user)} />
            </div>
          </SectionCard>
        )}

        {/* API Endpoints Status */}
        <SectionCard title="API Endpoints Status" icon={<Radio className="w-5 h-5 text-primary" />}>
          <div className="space-y-3">
            <EndpointRow method="GET" path="/api/users/me"                              status="ok" />
            <EndpointRow method="GET" path="/api/users/me/notifications/unread-count"   status="ok" />
            <EndpointRow method="GET" path="/api/users/me/stats"                        status="pending" />
            <EndpointRow method="PUT" path="/api/users/me"                              status="pending" />
          </div>
        </SectionCard>

        {/* Reload */}
        <div className="flex justify-center pb-4">
          <Button onClick={loadUserData} className="gap-2 rounded-xl shadow-md shadow-primary/20 px-6">
            <RefreshCw className="w-4 h-4" /> Reload Data
          </Button>
        </div>
      </div>
    </div>
  );
}
