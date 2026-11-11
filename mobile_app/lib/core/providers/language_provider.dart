import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Language Provider for managing app language
/// Uses contract-compliant storage key 'readyroad_locale'
class LanguageProvider extends ChangeNotifier {
  String _currentLanguage = 'en';
  bool _explicitSelection = false;
  final Future<void> Function(String)? persistAccountLanguage;
  late final Future<void> _initialLoad;

  String get currentLanguage => _currentLanguage;

  // ✅ Contract-compliant storage key
  static const String _storageKey = 'readyroad_locale';

  // Supported languages
  final List<LanguageOption> supportedLanguages = [
    LanguageOption(code: 'en', name: 'English', label: 'En'),
    LanguageOption(code: 'ar', name: 'العربية', label: 'Ar'),
    LanguageOption(code: 'nl', name: 'Nederlands', label: 'Nl'),
    LanguageOption(code: 'fr', name: 'Français', label: 'Fr'),
  ];

  LanguageProvider({this.persistAccountLanguage, List<Locale>? deviceLocales}) {
    final preferred =
        deviceLocales ?? WidgetsBinding.instance.platformDispatcher.locales;
    _currentLanguage =
        preferred
            .map((locale) => locale.languageCode)
            .where(
              (code) =>
                  supportedLanguages.any((language) => language.code == code),
            )
            .firstOrNull ??
        'en';
    _initialLoad = _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    if (!_explicitSelection) {
      final saved = prefs.getString(_storageKey);
      if (supportedLanguages.any((language) => language.code == saved)) {
        _currentLanguage = saved!;
      }
      notifyListeners();
    }
  }

  Future<void> setLanguage(String languageCode) async {
    if (!supportedLanguages.any((language) => language.code == languageCode)) {
      return;
    }
    _explicitSelection = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, languageCode);
    if (_currentLanguage != languageCode) {
      _currentLanguage = languageCode;
      notifyListeners();
    }
    try {
      await persistAccountLanguage?.call(languageCode);
    } catch (_) {
      // Same as web: an offline account request does not undo the local choice.
    }
  }

  Future<void> applyAccountLanguage(String? languageCode) async {
    await _initialLoad;
    if (_explicitSelection ||
        !supportedLanguages.any((language) => language.code == languageCode)) {
      return;
    }
    _currentLanguage = languageCode!;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, languageCode);
    notifyListeners();
  }

  LanguageOption get currentLanguageOption {
    return supportedLanguages.firstWhere(
      (lang) => lang.code == _currentLanguage,
      orElse: () => supportedLanguages[0],
    );
  }
}

/// Language Option Model
class LanguageOption {
  final String code;
  final String name;
  final String label;

  LanguageOption({required this.code, required this.name, required this.label});
}
