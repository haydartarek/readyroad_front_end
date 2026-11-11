import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/language_provider.dart';
import '../../core/localization/app_localizations.dart';

/// Language Selector Widget
class LanguageSelector extends StatelessWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        return PopupMenuButton<String>(
          tooltip: AppLocalizations.of(context).navLanguage,
          padding: EdgeInsets.zero,
          icon: Text(
            languageProvider.currentLanguageOption.label,
            style: Theme.of(context).textTheme.labelMedium,
          ),
          onSelected: (languageCode) {
            languageProvider.setLanguage(languageCode);
          },
          itemBuilder: (context) {
            return languageProvider.supportedLanguages.map((lang) {
              final isSelected = lang.code == languageProvider.currentLanguage;
              return PopupMenuItem<String>(
                value: lang.code,
                child: Row(
                  children: [
                    Text(
                      lang.label,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Text(lang.name)),
                    if (isSelected) ...[
                      const SizedBox(width: 8),
                      Icon(Icons.check, color: Theme.of(context).primaryColor),
                    ],
                  ],
                ),
              );
            }).toList();
          },
        );
      },
    );
  }
}
