import 'package:flutter/material.dart';

import '../../core/localization/app_localizations.dart';

enum RijviaPublicDocument {
  privacy('wire.privacy', '/privacy-policy'),
  terms('wire.terms', '/terms'),
  support('wire.support', '/contact');

  const RijviaPublicDocument(this.labelKey, this.path);

  final String labelKey;
  final String path;

  Uri uriFor(Locale locale) {
    final code =
        AppLocalizations.supportedLocales.any(
          (supported) => supported.languageCode == locale.languageCode,
        )
        ? locale.languageCode
        : 'en';
    // The web proxy accepts /en and resets an older language cookie before
    // redirecting to its canonical English URL. Every language is explicit.
    return Uri.https('rijvia.be', '/$code$path');
  }
}

Future<void> openRijviaPublicDocument(
  BuildContext context,
  RijviaPublicDocument document, {
  Future<bool> Function(Uri)? launcher,
}) async {
  if (launcher == null) {
    await Navigator.pushNamed(context, document.path);
    return;
  }
  final uri = document.uriFor(AppLocalizations.of(context).locale);
  try {
    final opened = await launcher(uri);
    if (opened) return;
  } catch (_) {
    // A platform launch failure should leave the current auth form intact.
  }
  if (!context.mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(AppLocalizations.of(context).t('wire.open_link_error')),
    ),
  );
}

/// Public policies and support remain reachable without an account.
class RijviaLegalLinks extends StatelessWidget {
  const RijviaLegalLinks({super.key, this.launcher});

  final Future<bool> Function(Uri)? launcher;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 8,
      runSpacing: 4,
      children: [
        for (final document in RijviaPublicDocument.values)
          TextButton(
            style: TextButton.styleFrom(
              minimumSize: const Size(48, 48),
              foregroundColor: Theme.of(context).colorScheme.onSurfaceVariant,
              textStyle: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 14,
                fontWeight: FontWeight.w500,
                height: 1.4,
              ),
            ),
            onPressed: () =>
                openRijviaPublicDocument(context, document, launcher: launcher),
            child: Text(l10n.t(document.labelKey), textAlign: TextAlign.center),
          ),
      ],
    );
  }
}
