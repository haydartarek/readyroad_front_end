import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/constants/app_theme.dart';
import 'package:mobile_app/core/localization/app_localizations.dart';
import 'package:mobile_app/shared/widgets/rijvia_legal_links.dart';

import '../support/load_app_fonts.dart';

void main() {
  final locales = <String, AppLocalizations>{};
  setUpAll(() async {
    await loadAppFonts();
    for (final code in ['ar', 'en', 'nl', 'fr']) {
      final l10n = AppLocalizations(Locale(code));
      await l10n.load();
      locales[code] = l10n;
    }
  });

  Future<void> mount(
    WidgetTester tester,
    String code,
    Future<bool> Function(Uri) launcher, {
    Brightness brightness = Brightness.light,
  }) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(360, 844);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetPhysicalSize);
    await tester.pumpWidget(
      MaterialApp(
        locale: Locale(code),
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: [
          _LoadedLocale(locales[code]!),
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: brightness == Brightness.dark
            ? AppTheme.darkTheme
            : AppTheme.lightTheme,
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(
            context,
          ).copyWith(textScaler: TextScaler.linear(2)),
          child: child!,
        ),
        home: Scaffold(body: RijviaLegalLinks(launcher: launcher)),
      ),
    );
    await tester.pumpAndSettle();
  }

  for (final code in ['ar', 'en', 'nl', 'fr']) {
    test('public web routes explicitly select $code including English', () {
      for (final document in RijviaPublicDocument.values) {
        expect(
          document.uriFor(Locale(code)).toString(),
          'https://rijvia.be/$code${document.path}',
        );
      }
    });
    for (final brightness in Brightness.values) {
      testWidgets('public links $code $brightness 360px 200%', (tester) async {
        final opened = <Uri>[];
        await mount(tester, code, (uri) async {
          opened.add(uri);
          return true;
        }, brightness: brightness);
        final links = find.byType(TextButton);
        expect(links, findsNWidgets(3));
        for (var i = 0; i < 3; i++) {
          final link = links.at(i);
          expect(tester.getSize(link).height, greaterThanOrEqualTo(48));
          expect(tester.getSize(link).width, greaterThanOrEqualTo(48));
          await tester.tap(link);
          await tester.pumpAndSettle();
          expect(
            opened.last,
            RijviaPublicDocument.values[i].uriFor(Locale(code)),
          );
        }
        expect(find.byType(SnackBar), findsNothing);
        expect(tester.takeException(), isNull);
      });
    }
  }
  for (final throws in [false, true]) {
    testWidgets('failed public link preserves page and reports error $throws', (
      tester,
    ) async {
      await mount(tester, 'ar', (_) async {
        if (throws) throw StateError('No browser available');
        return false;
      });
      await tester.tap(find.byType(TextButton).first);
      await tester.pump();
      final context = tester.element(find.byType(RijviaLegalLinks));
      expect(
        find.text(AppLocalizations.of(context).t('wire.open_link_error')),
        findsOneWidget,
      );
      expect(find.byType(RijviaLegalLinks), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }
  testWidgets('late browser failure after leaving page is safe', (
    tester,
  ) async {
    final result = Completer<bool>();
    await mount(tester, 'en', (_) => result.future);
    await tester.tap(find.byType(TextButton).first);
    await tester.pumpWidget(const SizedBox.shrink());
    result.complete(false);
    await tester.pump();
    expect(tester.takeException(), isNull);
  });
}

class _LoadedLocale extends LocalizationsDelegate<AppLocalizations> {
  const _LoadedLocale(this.value);
  final AppLocalizations value;
  @override
  bool isSupported(Locale locale) => locale == value.locale;
  @override
  Future<AppLocalizations> load(Locale locale) => SynchronousFuture(value);
  @override
  bool shouldReload(_LoadedLocale old) => value.locale != old.value.locale;
}
