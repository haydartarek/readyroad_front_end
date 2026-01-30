import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Language Provider for managing app language
/// Uses contract-compliant storage key 'readyroad_locale'
class LanguageProvider extends ChangeNotifier {
  String _currentLanguage = 'en';

  String get currentLanguage => _currentLanguage;

  // ✅ Contract-compliant storage key
  static const String _storageKey = 'readyroad_locale';

  // Supported languages
  final List<LanguageOption> supportedLanguages = [
    LanguageOption(code: 'en', name: 'English', flag: '🇬🇧'),
    LanguageOption(code: 'ar', name: 'العربية', flag: '🇸🇦'),
    LanguageOption(code: 'nl', name: 'Nederlands', flag: '🇳🇱'),
    LanguageOption(code: 'fr', name: 'Français', flag: '🇫🇷'),
  ];

  LanguageProvider() {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    _currentLanguage = prefs.getString(_storageKey) ?? 'en';
    notifyListeners();
  }

  Future<void> setLanguage(String languageCode) async {
    // Guard: prevent redundant changes
    if (_currentLanguage == languageCode) {
      return;
    }

    _currentLanguage = languageCode;
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
  final String flag;

  LanguageOption({required this.code, required this.name, required this.flag});
}
