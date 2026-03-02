'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ───────────────────────────────────────────────

interface ServiceUnavailableBannerProps {
  /** Called when the user clicks "Retry". */
  onRetry?: () => void;
  /** Extra Tailwind classes on the wrapper. */
  className?: string;
}

// ─── Component ───────────────────────────────────────────

export function ServiceUnavailableBanner({
  onRetry,
  className,
}: ServiceUnavailableBannerProps) {
  const { t } = useLanguage();

  return (
    <Alert className={className}>
      <AlertDescription className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <span>{t('common.service_unavailable')}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
