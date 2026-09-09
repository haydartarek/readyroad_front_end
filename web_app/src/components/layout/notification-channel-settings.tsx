"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { CHANNELS_URL, disableLearningPush, enableLearningPush, learningPushSubscription, supportsLearningPush } from "@/lib/learning-push";

type Settings = { emailEnabled: boolean; emailAvailable: boolean; pushAvailable: boolean; publicKey: string };

export function NotificationChannelSettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [push, setPush] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    try {
      const result = await apiClient.get<Settings>(CHANNELS_URL);
      setSettings(result.data);
      const subscription = await learningPushSubscription();
      if (subscription) {
        const status = await apiClient.post<{ subscribed: boolean }>(CHANNELS_URL + "/push/status", { endpoint: subscription.endpoint });
        setPush(status.data.subscribed);
      } else setPush(false);
      setFailed(false);
    } catch { setFailed(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function change(channel: "email" | "push", enabled: boolean) {
    if (!settings || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      if (channel === "email") {
        await apiClient.put(CHANNELS_URL + "/email", { enabled });
        setSettings({ ...settings, emailEnabled: enabled });
      } else {
        if (enabled) await enableLearningPush(settings.publicKey);
        else await disableLearningPush();
        setPush(enabled);
      }
    } catch { setFailed(true);
    } finally { setBusy(false); }
  }

  return <details className="mb-2 border-b border-border px-3 py-2 text-sm">
    <summary className="cursor-pointer font-semibold">{t("notif.channels")}</summary>
    <div className="space-y-3 py-3">
      <label className="flex items-center gap-2">
        <input name="learning-notifications-email" type="checkbox" checked={settings?.emailEnabled ?? false}
          disabled={busy || !settings || (!settings.emailAvailable && !settings.emailEnabled)} onChange={(event) => void change("email", event.target.checked)} />
        {t("notif.channel_email")}
      </label>
      <label className="flex items-center gap-2">
        <input name="learning-notifications-push" type="checkbox" checked={push}
          disabled={busy || !settings || (!settings.pushAvailable && !push) || !supportsLearningPush()} onChange={(event) => void change("push", event.target.checked)} />
        {t("notif.channel_push")}
      </label>
      {settings && (!settings.emailAvailable || !settings.pushAvailable || !supportsLearningPush())
        && <p className="text-xs text-muted-foreground">{t("notif.channels_unavailable")}</p>}
      {failed && <div role="alert" className="flex items-center gap-2 text-destructive">
        <span className="min-w-0 flex-1">{t("notif.channels_failed")}</span>
        <Button type="button" size="icon" variant="ghost" disabled={busy} onClick={() => void load()}
          aria-label={t("notif.retry")} title={t("notif.retry")}><RotateCw className="h-4 w-4" /></Button>
      </div>}
    </div>
  </details>;
}
