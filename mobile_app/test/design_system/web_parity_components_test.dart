import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/constants/app_theme.dart';
import 'package:mobile_app/design_system/widgets/rijvia_answer_option.dart';
import 'package:mobile_app/design_system/widgets/rijvia_components.dart';

import '../support/load_app_fonts.dart';

void main() {
  setUpAll(loadAppFonts);
  for (final count in [2, 3]) {
    testWidgets(
      'question displays exactly $count API choices with web letters',
      (tester) async {
        var selected = -1;
        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: Scaffold(
              body: Column(
                children: [
                  for (var index = 0; index < count; index++)
                    RijviaAnswerOption(
                      index: index,
                      text: 'Answer $index',
                      onSelect: () => selected = index,
                    ),
                ],
              ),
            ),
          ),
        );
        expect(find.text('A'), findsOneWidget);
        expect(find.text('B'), findsOneWidget);
        expect(find.text('C'), count == 3 ? findsOneWidget : findsNothing);
        await tester.tap(find.text('B'));
        expect(selected, 1);
      },
    );
  }
  testWidgets(
    'disabled answer preserves letter and feedback without submitting',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: const Scaffold(
            body: RijviaAnswerOption(
              index: 1,
              text: 'Correct answer',
              state: RijviaAnswerState.correct,
              onSelect: null,
            ),
          ),
        ),
      );
      expect(find.text('B'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
  for (final direction in TextDirection.values) {
    testWidgets('cards share row height with wrapped text: $direction', (
      tester,
    ) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Directionality(
            textDirection: direction,
            child: Scaffold(
              body: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: RijviaAdaptiveGrid(
                    minCellWidth: 140,
                    maxColumns: 2,
                    children: [
                      RijviaTopicCard(
                        key: const Key('long'),
                        title:
                            'تعلم قواعد المرور واستعد لامتحان السياقة النظري',
                        icon: Icons.menu_book_outlined,
                        onTap: () {},
                      ),
                      RijviaTopicCard(
                        key: const Key('short'),
                        title: 'الدروس',
                        icon: Icons.menu_book_outlined,
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      expect(
        tester.getSize(find.byKey(const Key('long'))).height,
        tester.getSize(find.byKey(const Key('short'))).height,
      );
      expect(tester.takeException(), isNull);
    });
  }
}
