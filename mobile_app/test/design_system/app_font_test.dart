import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/constants/app_theme.dart';
import 'package:mobile_app/design_system/widgets/rijvia_app_bar.dart';
import '../support/load_app_fonts.dart';

void main() {
  setUpAll(loadAppFonts);

  for (final brightness in Brightness.values) {
    final theme = brightness == Brightness.dark
        ? AppTheme.darkTheme
        : AppTheme.lightTheme;

    test(
      'Tajawal applies to text and explicit theme overrides: $brightness',
      () {
        final text = theme.textTheme;
        final primary = theme.primaryTextTheme;
        for (final style in [
          text.displayLarge,
          text.displayMedium,
          text.displaySmall,
          text.headlineLarge,
          text.headlineMedium,
          text.headlineSmall,
          text.titleLarge,
          text.titleMedium,
          text.titleSmall,
          text.bodyLarge,
          text.bodyMedium,
          text.bodySmall,
          text.labelLarge,
          text.labelMedium,
          text.labelSmall,
          primary.titleLarge,
          primary.bodyMedium,
          primary.labelLarge,
          theme.appBarTheme.titleTextStyle,
          theme.chipTheme.labelStyle,
          theme.navigationBarTheme.labelTextStyle?.resolve({}),
        ]) {
          expect(style?.fontFamily, 'Tajawal');
        }
      },
    );

    for (final direction in TextDirection.values) {
      testWidgets('custom text inherits Tajawal: $brightness $direction', (
        tester,
      ) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = const Size(390, 844);
        addTearDown(tester.view.resetDevicePixelRatio);
        addTearDown(tester.view.resetPhysicalSize);
        const body = 'Rijvia Français België العربية';
        const heading = 'امتحان السياقة';
        const button = 'ابدأ';
        const chip = 'الإشارات';
        const navigation = 'الدروس';
        await tester.pumpWidget(
          MaterialApp(
            theme: theme,
            home: Directionality(
              textDirection: direction,
              child: Scaffold(
                appBar: const RijviaAppBar(
                  title: Text(heading),
                  showWebNavigation: false,
                ),
                body: SingleChildScrollView(
                  child: Column(
                    children: [
                      const Text(
                        body,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      TextField(controller: TextEditingController(text: body)),
                      FilledButton(onPressed: () {}, child: const Text(button)),
                      const Chip(label: Text(chip)),
                    ],
                  ),
                ),
                bottomNavigationBar: NavigationBar(
                  destinations: const [
                    NavigationDestination(
                      icon: Icon(Icons.menu_book_outlined),
                      label: navigation,
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.person_outline),
                      label: 'الحساب',
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();
        for (final label in [body, heading, button, chip, navigation]) {
          final richText = find.descendant(
            of: find.text(label),
            matching: find.byType(RichText),
          );
          expect(
            tester.widget<RichText>(richText).text.style?.fontFamily,
            'Tajawal',
          );
        }
        expect(
          tester
              .widget<EditableText>(find.byType(EditableText))
              .style
              .fontFamily,
          'Tajawal',
        );
        expect(tester.takeException(), isNull);
      });
    }
  }
}
