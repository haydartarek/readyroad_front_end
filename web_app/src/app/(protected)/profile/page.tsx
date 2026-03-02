'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LANGUAGES } from '@/lib/constants';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import {
  User, Mail, AtSign, Globe, BarChart2,
  ShieldCheck, Pencil, Save, X, Trophy, Target, Flame, Trash2,
} from 'lucide-react';

// ─── Section Header ──────────────────────────────────────

function SectionHeader({
  icon, title, color = 'bg-primary/10 text-primary',
}: { icon: React.ReactNode; title: string; color?: string; }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <CardTitle className="text-lg font-black">{title}</CardTitle>
    </div>
  );
}

// ─── Stat Pill ───────────────────────────────────────────

function StatPill({ icon, value, label, color, bg }: {
  icon: React.ReactNode; value: string; label: string; color: string; bg: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/40 bg-card px-4 py-5 text-center shadow-sm hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>{icon}</div>
      <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
    username:  user?.username  || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      logApiError('Failed to update profile', err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName:  user?.lastName  || '',
      email:     user?.email     || '',
      username:  user?.username  || '',
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading profile…</p>
        </div>
      </div>
    );
  }

  // Derive display name: prefer firstName+lastName, fall back to fullName
  const displayName = user.firstName || user.lastName
    ? [user.firstName, user.lastName].filter(Boolean).join(' ')
    : (user.fullName || 'User');
  const nameParts   = displayName.trim().split(/\s+/);
  const initials    = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : nameParts[0]?.[0]?.toUpperCase() || '';
  const fullName    = displayName;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      <div className="container mx-auto max-w-5xl px-4 py-10 space-y-8">

        {serviceUnavailable && (
          <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} />
        )}

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-8 py-10 shadow-xl shadow-primary/20">
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-4xl font-black shadow-2xl flex-shrink-0">
              {initials ? initials : <User className="w-12 h-12" strokeWidth={1.5} />}
            </div>

            {/* Info */}
            <div className="text-center sm:text-start space-y-1 flex-1">
              <h1 className="text-3xl font-black text-white tracking-tight">{fullName}</h1>
              <p className="text-white/70 text-sm font-medium">@{user.username}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-white ring-1 ring-white/30">
                  Free Account
                </span>
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-white ring-1 ring-white/30">
                  ✓ Verified
                </span>
              </div>
            </div>

            {/* Member since */}
            <div className="hidden sm:block text-end">
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">Member since</p>
              <p className="text-white font-bold mt-0.5">{memberSince}</p>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Left sidebar ── */}
          <div className="space-y-6">

            {/* Stats */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <SectionHeader icon={<BarChart2 className="w-4 h-4" />} title="Statistics" />
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                <StatPill icon={<Trophy className="w-4 h-4" />} value="12"  label="Exams Taken"        color="text-amber-500" bg="bg-amber-500/10" />
                <StatPill icon={<Target className="w-4 h-4" />} value="85%" label="Average Score"      color="text-green-500" bg="bg-green-500/10" />
                <StatPill icon={<Flame  className="w-4 h-4" />} value="245" label="Practice Questions" color="text-blue-500"  bg="bg-blue-500/10"  />
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <SectionHeader icon={<ShieldCheck className="w-4 h-4" />} title="Account Status" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Account Type',  value: <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Free Account</Badge> },
                  { label: 'Member Since',  value: <span className="text-xs font-semibold text-foreground">{memberSince}</span> },
                  { label: 'Email Verified', value: <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs">✓ Verified</Badge> },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                    <span className="text-xs text-muted-foreground font-medium">{row.label}</span>
                    {row.value}
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>

          {/* ── Right main content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Information */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <SectionHeader icon={<User className="w-4 h-4" />} title="Personal Information" />
                  {!isEditing && (
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-1.5 text-xs h-8 hover:bg-primary/5 hover:border-primary/30 transition-all"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { id: 'firstName', label: 'First Name', key: 'firstName' },
                    { id: 'lastName',  label: 'Last Name',  key: 'lastName'  },
                  ].map(({ id, label, key }) => (
                    <div key={id} className="space-y-1.5">
                      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input
                          id={id}
                          value={formData[key as keyof typeof formData]}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                          disabled={!isEditing}
                          className="pl-9 h-10 disabled:bg-muted/30 disabled:text-foreground/70"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      id="email" type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="pl-9 h-10 disabled:bg-muted/30 disabled:text-foreground/70"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input id="username" value={formData.username} disabled className="pl-9 h-10 bg-muted/50 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2 shadow-md shadow-primary/20">
                      {isSaving ? (
                        <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Saving…</>
                      ) : (
                        <><Save className="w-3.5 h-3.5" />Save Changes</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Language Preferences */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <SectionHeader icon={<Globe className="w-4 h-4" />} title="Language Preferences" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="language" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Preferred Language
                </Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'ar' | 'nl' | 'fr')}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.flag} {lang.nativeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This language will be used for questions and interface</p>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/25 shadow-sm">
              <CardHeader className="pb-4">
                <SectionHeader icon={<Trash2 className="w-4 h-4" />} title="Danger Zone" color="bg-destructive/10 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4">
                  <div>
                    <p className="font-bold text-destructive text-sm">Delete Account</p>
                    <p className="text-xs text-destructive/60 mt-0.5">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" size="sm" className="gap-1.5 flex-shrink-0 text-xs">
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
