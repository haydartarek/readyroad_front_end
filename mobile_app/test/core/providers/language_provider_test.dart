import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:mobile_app/core/providers/language_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));
  for (final code in ['ar', 'en', 'nl', 'fr']) {
    test('new install follows supported device language $code', () async {
      final provider = LanguageProvider(deviceLocales: [Locale(code, 'BE')]);
      expect(provider.currentLanguage, code);
      await Future<void>.delayed(Duration.zero);
      expect(provider.currentLanguage, code);
      provider.dispose();
    });
  }
  test(
    'device preference list picks supported language, then English fallback',
    () async {
      final matched = LanguageProvider(
        deviceLocales: [const Locale('de'), const Locale('nl')],
      );
      final fallback = LanguageProvider(deviceLocales: [const Locale('de')]);
      await Future<void>.delayed(Duration.zero);
      expect(matched.currentLanguage, 'nl');
      expect(fallback.currentLanguage, 'en');
      matched.dispose();
      fallback.dispose();
    },
  );
  test(
    'saved manual language wins over device and invalid preference is ignored',
    () async {
      SharedPreferences.setMockInitialValues({'readyroad_locale': 'fr'});
      final provider = LanguageProvider(deviceLocales: [const Locale('ar')]);
      await Future<void>.delayed(Duration.zero);
      expect(provider.currentLanguage, 'fr');
      await provider.setLanguage('ar');
      final restored = LanguageProvider(deviceLocales: [const Locale('nl')]);
      await Future<void>.delayed(Duration.zero);
      expect(restored.currentLanguage, 'ar');
      provider.dispose();
      restored.dispose();
      SharedPreferences.setMockInitialValues({
        'readyroad_locale': 'unsupported',
      });
      final invalid = LanguageProvider(deviceLocales: [const Locale('nl')]);
      await Future<void>.delayed(Duration.zero);
      expect(invalid.currentLanguage, 'nl');
      invalid.dispose();
    },
  );
  test(
    'choosing device default explicitly persists it before account response',
    () async {
      final provider = LanguageProvider(deviceLocales: [const Locale('nl')]);
      await provider.setLanguage('nl');
      expect(
        (await SharedPreferences.getInstance()).getString('readyroad_locale'),
        'nl',
      );
      await provider.applyAccountLanguage('ar');
      expect(provider.currentLanguage, 'nl');
      provider.dispose();
    },
  );
  test(
    'selecting the current language still saves the account preference like web',
    () async {
      final saved = <String>[];
      final provider = LanguageProvider(
        persistAccountLanguage: (code) async => saved.add(code),
      );
      await provider.applyAccountLanguage('en');
      await provider.setLanguage('en');
      expect(saved, ['en']);
      provider.dispose();
    },
  );
  test(
    'language selector uses the same labels as web and persists account changes',
    () async {
      final saved = <String>[];
      final provider = LanguageProvider(
        persistAccountLanguage: (code) async => saved.add(code),
      );
      await provider.applyAccountLanguage('nl');
      expect(provider.currentLanguage, 'nl');
      expect(provider.currentLanguageOption.label, 'Nl');
      await provider.setLanguage('ar');
      expect(saved, ['ar']);
      expect(
        (await SharedPreferences.getInstance()).getString('readyroad_locale'),
        'ar',
      );
      expect(provider.supportedLanguages.map((language) => language.label), [
        'En',
        'Ar',
        'Nl',
        'Fr',
      ]);
      await provider.applyAccountLanguage('fr');
      expect(provider.currentLanguage, 'ar');
      provider.dispose();
    },
  );
  test(
    'offline account persistence does not undo the selected UI language',
    () async {
      final provider = LanguageProvider(
        persistAccountLanguage: (_) async => throw StateError('offline'),
      );
      await provider.setLanguage('fr');
      expect(provider.currentLanguage, 'fr');
      await provider.setLanguage('unsupported');
      expect(provider.currentLanguage, 'fr');
      provider.dispose();
    },
  );
}
