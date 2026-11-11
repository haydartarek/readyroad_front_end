import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/shared/widgets/rijvia_markdown.dart';

void main() {
  for (final rtl in [false, true]) {
    testWidgets(
      'GFM tables, nesting, HTML omission and typography ${rtl ? 'RTL' : 'LTR'}',
      (tester) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = const Size(360, 900);
        addTearDown(tester.view.resetDevicePixelRatio);
        addTearDown(tester.view.resetPhysicalSize);
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: SingleChildScrollView(
                child: Directionality(
                  textDirection: rtl ? TextDirection.rtl : TextDirection.ltr,
                  child: MediaQuery(
                    data: const MediaQueryData(
                      textScaler: TextScaler.linear(2),
                    ),
                    child: const RijviaMarkdown(
                      typography: {'h1Size': 'LARGE', 'paragraphSize': 'LARGE'},
                      afterSecondParagraph: Text('Learning cards'),
                      text:
                          '# Heading\n\nFirst **bold** and *italic*.\n\nSecond ~~removed~~ and `code`.\n\n| Sign | Meaning |\n| --- | --- |\n| B1 | Yield |\n\n1. First item\n   - Nested item\n2. Second item\n\n> A quotation\n\n```dart\nprint("literal");\n```\n\n<script>hidden_script()</script>\n\nEscaped \\<b>literal\\</b>.',
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();
        expect(find.byType(Table), findsOneWidget);
        expect(find.text('Learning cards'), findsOneWidget);
        expect(
          find.byWidgetPredicate(
            (w) =>
                w is Text &&
                w.textSpan?.toPlainText().contains('hidden_script') == true,
          ),
          findsNothing,
        );
        expect(
          find.byWidgetPredicate(
            (w) =>
                w is Text &&
                w.textSpan?.toPlainText() == 'Heading' &&
                w.style?.fontSize == 36,
          ),
          findsOneWidget,
        );
        expect(
          find.byWidgetPredicate(
            (w) =>
                w is Text &&
                w.textSpan?.toPlainText().contains('Escaped <b>literal</b>.') ==
                    true,
          ),
          findsOneWidget,
        );
        expect(tester.takeException(), isNull);
      },
    );
  }
  testWidgets(
    'article links are keyboard accessible and unsafe links do not navigate',
    (tester) async {
      final routes = <String>[];
      await tester.pumpWidget(
        MaterialApp(
          onGenerateRoute: (settings) {
            routes.add(settings.name!);
            return MaterialPageRoute(
              builder: (_) => const Scaffold(body: Text('Lesson route')),
            );
          },
          home: const Scaffold(
            body: RijviaMarkdown(
              text: '[Read lesson](/lessons)\n\n[Unsafe](javascript:alert)',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.widgetWithText(TextButton, 'Unsafe'), findsNothing);
      for (var step = 0; step < 4; step++) {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pump();
        if (FocusManager.instance.primaryFocus?.context
                ?.findAncestorWidgetOfExactType<TextButton>() !=
            null) {
          break;
        }
      }
      expect(
        FocusManager.instance.primaryFocus?.context
            ?.findAncestorWidgetOfExactType<TextButton>(),
        isNotNull,
      );
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pumpAndSettle();
      expect(routes, ['/lessons']);
      expect(find.text('Lesson route'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
