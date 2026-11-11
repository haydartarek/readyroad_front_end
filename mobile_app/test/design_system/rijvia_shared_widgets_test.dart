import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/core/constants/app_theme.dart';
import 'package:mobile_app/design_system/widgets/rijvia_action_card.dart';
import 'package:mobile_app/design_system/widgets/rijvia_components.dart';
import 'package:mobile_app/design_system/widgets/rijvia_content.dart';

Widget harness({
  required Widget child,
  required Brightness brightness,
  required TextDirection direction,
  double textScale = 1.0,
}) {
  return MaterialApp(
    theme: AppTheme.lightTheme,
    darkTheme: AppTheme.darkTheme,
    themeMode: brightness == Brightness.dark ? ThemeMode.dark : ThemeMode.light,
    home: MediaQuery(
      data: MediaQueryData(textScaler: TextScaler.linear(textScale)),
      child: Directionality(
        textDirection: direction,
        child: Scaffold(body: SingleChildScrollView(child: child)),
      ),
    ),
  );
}

void main() {
  testWidgets('Arabic action card uses existing navigation callback', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    var taps = 0;
    await tester.pumpWidget(
      harness(
        brightness: Brightness.light,
        direction: TextDirection.rtl,
        child: RijviaContent(
          child: RijviaActionCard(
            title: 'الدروس',
            subtitle: 'ابدأ التعلم',
            icon: Icons.book_outlined,
            onTap: () => taps++,
          ),
        ),
      ),
    );
    expect(find.text('الدروس'), findsOneWidget);
    await tester.tap(find.byType(RijviaActionCard));
    expect(taps, 1);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Dark mode text scale retains action content', (tester) async {
    await tester.binding.setSurfaceSize(const Size(360, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      harness(
        brightness: Brightness.dark,
        direction: TextDirection.rtl,
        textScale: 1.3,
        child: RijviaContent(
          child: RijviaActionCard(
            title: 'امتحان السياقة النظري',
            subtitle: 'تدرب على أسئلة الامتحان',
            icon: Icons.quiz_outlined,
            onTap: () {},
          ),
        ),
      ),
    );
    expect(find.text('امتحان السياقة النظري'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('LTR components render without overflow', (tester) async {
    await tester.binding.setSurfaceSize(const Size(768, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      harness(
        brightness: Brightness.light,
        direction: TextDirection.ltr,
        child: const RijviaContent(
          child: Column(
            children: [
              RijviaSectionHeading(
                title: 'Lessons',
                subtitle: 'Start learning',
              ),
              RijviaNotice(message: 'Sample notice'),
              RijviaEmptyState(
                title: 'No data',
                description: 'Try again later',
                icon: Icons.info_outline,
              ),
            ],
          ),
        ),
      ),
    );
    expect(find.text('Lessons'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Wide layout is constrained without changing MaterialApp', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1280, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      harness(
        brightness: Brightness.light,
        direction: TextDirection.ltr,
        child: const RijviaContent(child: Text('Rijvia')),
      ),
    );
    expect(find.text('Rijvia'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Shared metric and status components stay readable on phone', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      harness(
        brightness: Brightness.light,
        direction: TextDirection.rtl,
        child: SizedBox(
          height: 500,
          child: RijviaScrollFrame(
            child: ListView(
              children: const [
                RijviaMetricCard(
                  label: 'الدقة',
                  value: '82%',
                  icon: Icons.insights_outlined,
                ),
                RijviaStatusBadge(
                  label: 'ناجح',
                  icon: Icons.check_circle,
                  color: AppColors.success,
                ),
              ],
            ),
          ),
        ),
      ),
    );
    expect(find.text('82%'), findsOneWidget);
    expect(find.text('ناجح'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
