'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell, X, CheckCheck, Loader2,
  Trophy, BookX, AlertTriangle, Flame, Star, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
} from '@/services/userService';

// ─── Types & constants ────────────────────────────────────

type NotifType = AppNotification['type'];

interface TypeConfig {
  icon:       React.ElementType;
  iconClass:  string;
  dotClass:   string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  EXAM_PASSED:      { icon: Trophy,        iconClass: 'text-green-600',  dotClass: 'bg-green-500'  },
  EXAM_FAILED:      { icon: BookX,         iconClass: 'text-red-500',    dotClass: 'bg-red-500'    },
  EXAM_RESULT:      { icon: Trophy,        iconClass: 'text-blue-600',   dotClass: 'bg-blue-500'   },
  WEAK_AREA:        { icon: AlertTriangle, iconClass: 'text-amber-500',  dotClass: 'bg-amber-400'  },
  STREAK_ACHIEVED:  { icon: Flame,         iconClass: 'text-orange-500', dotClass: 'bg-orange-400' },
  ACHIEVEMENT:      { icon: Star,          iconClass: 'text-yellow-500', dotClass: 'bg-yellow-400' },
  STUDY_REMINDER:   { icon: Bell,          iconClass: 'text-blue-500',   dotClass: 'bg-blue-400'   },
  SYSTEM:           { icon: Info,          iconClass: 'text-slate-500',  dotClass: 'bg-slate-400'  },
};

const DEFAULT_CFG: TypeConfig = { icon: Info, iconClass: 'text-slate-500', dotClass: 'bg-slate-400' };

function getTypeCfg(type: NotifType): TypeConfig {
  return TYPE_CONFIG[type] ?? DEFAULT_CFG;
}

// ─── Props ────────────────────────────────────────────────

interface NotificationPanelProps {
  /** Current unread count (from navbar polling) */
  unreadCount: number;
  /** Called when user marks all as read (so parent resets its counter) */
  onAllRead: () => void;
}

// ─── Component ────────────────────────────────────────────

export function NotificationPanel({ unreadCount, onAllRead }: NotificationPanelProps) {
  const { t } = useLanguage();

  const [isOpen,      setIsOpen]      = useState(false);
  const [items,       setItems]       = useState<AppNotification[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [localUnread, setLocalUnread] = useState(unreadCount);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Helpers ──────────────────────────────────────────────

  /** Translate relative time using i18n keys */
  const timeAgo = useCallback((iso: string): string => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)    return t('notif.time_just_now');
    if (diff < 3600)  return t('notif.time_minutes').replace('{n}', String(Math.floor(diff / 60)));
    if (diff < 86400) return t('notif.time_hours').replace('{n}', String(Math.floor(diff / 3600)));
    return t('notif.time_days').replace('{n}', String(Math.floor(diff / 86400)));
  }, [t]);

  /** Footer text with pluralisation */
  const footerText = useCallback((count: number): string => {
    const key = count === 1 ? 'notif.footer' : 'notif.footer_plural';
    return t(key).replace('{count}', String(count));
  }, [t]);

  // ── Sync badge with parent ─────────────────────────────
  useEffect(() => { setLocalUnread(unreadCount); }, [unreadCount]);

  // ── Click-outside to close ────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── Load + auto-mark-all-read when panel opens ────────
  const openPanel = useCallback(async () => {
    setIsOpen(true);
    setIsLoading(true);
    try {
      const notifs = await getNotifications();
      setItems(notifs);
      if (localUnread > 0) {
        await markAllNotificationsAsRead().catch(() => {});
        setLocalUnread(0);
        onAllRead();
      }
    } catch {
      // Never block the UI on fetch failure
    } finally {
      setIsLoading(false);
    }
  }, [localUnread, onAllRead]);

  // ── Mark one as read locally + on server ─────────────
  const handleItemClick = useCallback(async (notif: AppNotification) => {
    if (!notif.isRead) {
      setItems(prev =>
        prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
      );
      await markNotificationAsRead(notif.id).catch(() => {});
    }
  }, []);

  const badgeCount = localUnread > 99 ? '99+' : localUnread;

  return (
    <div ref={panelRef} className="relative">

      {/* ── Bell trigger ── */}
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0"
        aria-label={
          localUnread > 0
            ? `${t('notif.title')} (${localUnread} ${t('notif.unread_label')})`
            : t('notif.title')
        }
        onClick={isOpen ? () => setIsOpen(false) : openPanel}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {localUnread > 0 && (
          <span className={cn(
            'absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center',
            'rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white',
          )}>
            {badgeCount}
          </span>
        )}
      </Button>

      {/* ── Panel ── */}
      {isOpen && (
        <div className={cn(
          'absolute right-0 top-11 z-50 w-80 sm:w-96',
          'rounded-2xl border border-border/60 bg-popover shadow-xl',
          'animate-in fade-in-0 zoom-in-95 duration-150',
        )}>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{t('notif.title')}</span>
              {localUnread > 0 && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                  {badgeCount} {t('notif.badge_new')}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
              aria-label={t('notif.close')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              // Loading state
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>

            ) : items.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CheckCheck className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">{t('notif.empty_title')}</p>
                <p className="text-xs text-muted-foreground">{t('notif.empty_subtitle')}</p>
              </div>

            ) : (
              // Notification list
              <ul className="divide-y divide-border/40" role="list">
                {items.map(notif => {
                  const cfg  = getTypeCfg(notif.type);
                  const Icon = cfg.icon;

                  const content = (
                    <div
                      className={cn(
                        'flex gap-3 px-4 py-3 transition-colors',
                        'hover:bg-muted/60 cursor-pointer',
                        !notif.isRead && 'bg-primary/5',
                      )}
                      onClick={() => handleItemClick(notif)}
                    >
                      {/* Icon */}
                      <div className={cn(
                        'relative flex h-9 w-9 shrink-0 items-center justify-center',
                        'rounded-full bg-muted',
                      )}>
                        <Icon className={cn('h-4 w-4', cfg.iconClass)} />
                        {!notif.isRead && (
                          <span className={cn(
                            'absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full',
                            cfg.dotClass, 'ring-2 ring-background',
                          )} />
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'text-sm leading-tight',
                          notif.isRead ? 'font-medium text-foreground/80' : 'font-bold text-foreground',
                        )}>
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/70">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  );

                  return (
                    <li key={notif.id}>
                      {notif.link ? (
                        <Link href={notif.link} onClick={() => handleItemClick(notif)}>
                          {content}
                        </Link>
                      ) : content}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border/50 px-4 py-2">
              <p className="text-center text-xs text-muted-foreground">
                {footerText(items.length)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
