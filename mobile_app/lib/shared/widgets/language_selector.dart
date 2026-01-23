import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/language_provider.dart';

/// Language Selector Widget
class LanguageSelector extends StatelessWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        return PopupMenuButton<String>(
          icon: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                languageProvider.currentLanguageOption.flag,
                style: const TextStyle(fontSize: 20),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.arrow_drop_down),
            ],
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
                      lang.flag,
                      style: const TextStyle(fontSize: 20),
                    ),
                    const SizedBox(width: 12),
                    Text(lang.name),
                    if (isSelected) ...[
                      const Spacer(),
                      Icon(
                        Icons.check,
                        color: Theme.of(context).primaryColor,
                      ),
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

