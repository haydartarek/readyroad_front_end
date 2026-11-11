import 'package:flutter/material.dart';

import '../../core/localization/app_localizations.dart';

class ServiceUnavailableBanner extends StatelessWidget {
  final VoidCallback onRetry;

  const ServiceUnavailableBanner({super.key, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Card(
      color: Theme.of(context).colorScheme.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              Icons.cloud_off,
              color: Theme.of(context).colorScheme.onErrorContainer,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                l10n.t('common.service_unavailable'),
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onErrorContainer,
                ),
              ),
            ),
            TextButton(
              onPressed: onRetry,
              child: Text(l10n.t('exam.results_retry_load')),
            ),
          ],
        ),
      ),
    );
  }
}
