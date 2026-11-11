import 'package:mobile_app/design_system/widgets/rijvia_answer_option.dart';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/constants/app_theme.dart';
import 'package:mobile_app/design_system/rijvia_tokens.dart';
import 'package:mobile_app/design_system/widgets/rijvia_components.dart';

import '../support/load_app_fonts.dart';

void main() {
  setUpAll(loadAppFonts);

  // Compare against the web source, including its theme overrides and aliases.
  final css = File('../web_app/src/app/globals.css').readAsStringSync();
  Map<String, String> variables(String selector) {
    final block = RegExp(
      '${RegExp.escape(selector)} \\{([^}]+)\\}',
    ).firstMatch(css)!.group(1)!;
    return {
      for (final match in RegExp(r'--([\w-]+):\s*([^;]+);').allMatches(block))
        match.group(1)!: match.group(2)!.trim(),
    };
  }

  final light = variables(':root');
  final dark = {...light, ...variables('.dark')};
  Color sourceColor(Map<String, String> tokens, String role) {
    var value = tokens[role]!;
    while (value.startsWith('var(')) {
      value = tokens[value.substring(6, value.length - 1)]!;
    }
    final hsl = value
        .replaceAll('%', '')
        .split(RegExp(r'\s+'))
        .map(double.parse)
        .toList();
    return HSLColor.fromAHSL(1, hsl[0], hsl[1] / 100, hsl[2] / 100).toColor();
  }

  double contrast(Color a, Color b) {
    final x = a.computeLuminance();
    final y = b.computeLuminance();
    return ((x > y ? x : y) + 0.05) / ((x < y ? x : y) + 0.05);
  }

  test('fourth image radii come from equivalent web components', () {
    final radiusRem = double.parse(
      RegExp(r'--radius: ([\d.]+)rem').firstMatch(css)!.group(1)!,
    );
    final webLesson = File(
      '../web_app/src/app/lessons/[lessonId]/lesson-detail-client.tsx',
    ).readAsStringSync();
    expect(webLesson, contains('rounded-xl object-contain'));
    expect(RijviaDesignLayout.lessonImageRadius, radiusRem * 16 + 4);
    final webFrame = File(
      '../web_app/src/components/exam/exam-question-image-frame.tsx',
    ).readAsStringSync();
    final frameRadius = double.parse(
      RegExp(r'rounded-\[(\d+)px\]').firstMatch(webFrame)!.group(1)!,
    );
    expect(RijviaDesignLayout.questionImageRadius, frameRadius);
    final webPractice = File(
      '../web_app/src/app/(protected)/practice/[category]/page.tsx',
    ).readAsStringSync();
    final cardRadiusRem = double.parse(
      RegExp(
        r'rounded-\[([\d.]+)rem\] border border-border/50 p-4',
      ).firstMatch(webPractice)!.group(1)!,
    );
    expect(RijviaDesignLayout.signCardRadius, cardRadiusRem * 16);
  });
  for (final brightness in Brightness.values) {
    for (final direction in TextDirection.values) {
      testWidgets(
        'fifth sparse desktop preserves width for each content role $brightness $direction',
        (tester) async {
          await tester.binding.setSurfaceSize(const Size(1280, 900));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          await tester.pumpWidget(
            MaterialApp(
              theme: brightness == Brightness.dark
                  ? AppTheme.darkTheme
                  : AppTheme.lightTheme,
              home: Directionality(
                textDirection: direction,
                child: Scaffold(
                  body: Column(
                    children: [
                      for (final role in [
                        RijviaDesignLayout.lessonCardMaxWidth,
                        RijviaDesignLayout.categoryCardMaxWidth,
                      ])
                        RijviaAdaptiveGrid(
                          maxCellWidth: role,
                          children: [
                            SizedBox(key: ValueKey(role), height: 100),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            ),
          );
          for (final role in [
            RijviaDesignLayout.lessonCardMaxWidth,
            RijviaDesignLayout.categoryCardMaxWidth,
          ]) {
            final rect = tester.getRect(find.byKey(ValueKey(role)));
            expect(rect.width, closeTo(role, .01));
            expect(rect.width, lessThan(RijviaDesignLayout.maxCardWidth));
            if (direction == TextDirection.rtl) {
              expect(rect.right, 1280);
            } else {
              expect(rect.left, 0);
            }
          }
          expect(
            RijviaDesignLayout.categoryCardMaxWidth,
            lessThan(RijviaDesignLayout.lessonCardMaxWidth),
          );
          expect(tester.takeException(), isNull);
        },
      );
    }

    for (final direction in TextDirection.values) {
      testWidgets(
        'fourth compact lesson padding preserves type $brightness $direction',
        (tester) async {
          await tester.binding.setSurfaceSize(const Size(390, 844));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          await tester.pumpWidget(
            MaterialApp(
              theme: brightness == Brightness.dark
                  ? AppTheme.darkTheme
                  : AppTheme.lightTheme,
              home: Directionality(
                textDirection: direction,
                child: Scaffold(
                  body: RijviaAdaptiveGrid(
                    maxColumns: 1,
                    children: [
                      RijviaTopicCard(
                        key: const Key('compact'),
                        title: 'قواعد السير والأولوية عند التقاطعات',
                        icon: Icons.menu_book_outlined,
                        progress: .5,
                        compact: true,
                        onTap: () {},
                      ),
                      RijviaTopicCard(
                        key: const Key('standard'),
                        title: 'قواعد السير والأولوية عند التقاطعات',
                        icon: Icons.menu_book_outlined,
                        progress: .5,
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
          final compact = tester.getSize(find.byKey(const Key('compact')));
          final standard = tester.getSize(find.byKey(const Key('standard')));
          expect(compact.height, lessThan(standard.height));
          final titles = tester
              .widgetList<Text>(
                find.text('قواعد السير والأولوية عند التقاطعات'),
              )
              .toList();
          expect(titles[0].style, titles[1].style);
          expect(tester.takeException(), isNull);
        },
      );
    }
  }

  for (final direction in TextDirection.values) {
    for (final count in [0, 1, 2, 4, 5]) {
      testWidgets('review sparse grid uses actual cards $count $direction', (
        tester,
      ) async {
        await tester.binding.setSurfaceSize(const Size(1280, 900));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: Directionality(
              textDirection: direction,
              child: Scaffold(
                body: RijviaAdaptiveGrid(
                  minCellWidth: 260,
                  children: [
                    for (var i = 0; i < count; i++)
                      RijviaTopicCard(
                        key: ValueKey('card-$i'),
                        title: 'قواعد المرور $i',
                        icon: Icons.menu_book_outlined,
                        onTap: () {},
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
        expect(find.byType(RijviaTopicCard), findsNWidgets(count));
        if (count == 0) {
          expect(tester.getSize(find.byType(RijviaAdaptiveGrid)).height, 0);
        } else {
          final columns = count.clamp(1, 4);
          final expectedWidth = ((1280 - 16 * (columns - 1)) / columns).clamp(
            0,
            RijviaDesignLayout.maxCardWidth,
          );
          for (var i = 0; i < count; i++) {
            final rect = tester.getRect(find.byKey(ValueKey('card-$i')));
            expect(rect.width, closeTo(expectedWidth, .01));
            expect(rect.left, greaterThanOrEqualTo(0));
            expect(rect.right, lessThanOrEqualTo(1280));
          }
          if (count > 1) {
            final first = tester.getRect(find.byKey(const ValueKey('card-0')));
            final second = tester.getRect(find.byKey(const ValueKey('card-1')));
            expect(first.height, second.height);
            expect(
              direction == TextDirection.rtl
                  ? first.left > second.right
                  : first.right < second.left,
              isTrue,
            );
          }
        }
        expect(tester.takeException(), isNull);
      });
    }
  }

  for (final brightness in Brightness.values) {
    for (final state in RijviaAnswerState.values) {
      testWidgets(
        'review answer contrast and scaled badge $brightness $state',
        (tester) async {
          final theme = brightness == Brightness.dark
              ? AppTheme.darkTheme
              : AppTheme.lightTheme;
          await tester.binding.setSurfaceSize(const Size(360, 844));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          for (var index = 0; index < 3; index++) {
            await tester.pumpWidget(
              MaterialApp(
                theme: theme,
                home: MediaQuery(
                  data: const MediaQueryData(textScaler: TextScaler.linear(2)),
                  child: Scaffold(
                    body: RijviaAnswerOption(
                      index: index,
                      text: 'السيارة الزرقاء',
                      state: state,
                      onSelect: () {},
                    ),
                  ),
                ),
              ),
            );
            final label = find.text(['A', 'B', 'C'][index]);
            final badge = find
                .ancestor(of: label, matching: find.byType(Container))
                .first;
            final background =
                (tester.widget<Container>(badge).decoration! as BoxDecoration)
                    .color!;
            final foreground = tester.widget<Text>(label).style!.color!;
            expect(contrast(foreground, background), greaterThanOrEqualTo(4.5));
            final badgeRect = tester.getRect(badge);
            final labelRect = tester.getRect(label);
            expect(badgeRect.contains(labelRect.topLeft), isTrue);
            expect(badgeRect.contains(labelRect.bottomRight), isTrue);
            final answer = tester.widget<Text>(find.text('السيارة الزرقاء'));
            final material = tester.widget<Material>(
              find
                  .descendant(
                    of: find.byType(RijviaAnswerOption),
                    matching: find.byType(Material),
                  )
                  .first,
            );
            final surface = Color.alphaBlend(
              material.color!,
              theme.colorScheme.surface,
            );
            expect(
              contrast(answer.style!.color!, surface),
              greaterThanOrEqualTo(4.5),
            );
            expect(tester.takeException(), isNull);
          }
        },
      );
    }
  }

  for (final brightness in Brightness.values) {
    final theme = brightness == Brightness.dark
        ? AppTheme.darkTheme
        : AppTheme.lightTheme;
    final source = brightness == Brightness.dark ? dark : light;
    test('theme uses actual web semantic colors: $brightness', () {
      final colors = theme.colorScheme;
      final roles = {
        'background': theme.scaffoldBackgroundColor,
        'card': colors.surface,
        'foreground': colors.onSurface,
        'muted': colors.surfaceContainerHighest,
        'muted-foreground': colors.onSurfaceVariant,
        'primary': colors.primary,
        'primary-foreground': colors.onPrimary,
        'secondary': colors.secondary,
        'border': colors.outlineVariant,
      };
      for (final role in roles.entries) {
        final expected = sourceColor(source, role.key);
        for (final channels in [
          (role.value.r, expected.r),
          (role.value.g, expected.g),
          (role.value.b, expected.b),
        ]) {
          expect(channels.$1, closeTo(channels.$2, 1 / 255), reason: role.key);
        }
      }
    });
    test('reading and primary action meet AA contrast: $brightness', () {
      final colors = theme.colorScheme;
      expect(
        contrast(colors.onSurface, colors.surface),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        contrast(colors.onSurfaceVariant, colors.surface),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        contrast(colors.onPrimary, colors.primary),
        greaterThanOrEqualTo(4.5),
      );
      final linkColor = theme.textButtonTheme.style!.foregroundColor!.resolve(
        {},
      )!;
      final outlineColor = theme.outlinedButtonTheme.style!.foregroundColor!
          .resolve({})!;
      expect(
        contrast(linkColor, theme.scaffoldBackgroundColor),
        greaterThanOrEqualTo(4.5),
      );
      expect(contrast(outlineColor, colors.surface), greaterThanOrEqualTo(4.5));
      expect(theme.textTheme.bodyLarge!.fontSize, greaterThanOrEqualTo(16));
      final navigation = theme.navigationBarTheme;
      final selectedIcon = navigation.iconTheme!.resolve({
        WidgetState.selected,
      })!;
      expect(selectedIcon.size, 24);
      expect(
        contrast(selectedIcon.color!, navigation.indicatorColor!),
        greaterThanOrEqualTo(3),
      );
      final selectedLabel = navigation.labelTextStyle!.resolve({
        WidgetState.selected,
      })!;
      expect(selectedLabel.fontSize, 14);
      expect(
        contrast(selectedLabel.color!, navigation.backgroundColor!),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        contrast(
          theme.navigationRailTheme.selectedIconTheme!.color!,
          theme.navigationRailTheme.indicatorColor!,
        ),
        greaterThanOrEqualTo(3),
      );
    });

    for (final direction in TextDirection.values) {
      for (final scale in [1.0, 2.0]) {
        testWidgets(
          'feature and metric text stay beside icon: $brightness $direction $scale',
          (tester) async {
            await tester.binding.setSurfaceSize(const Size(360, 844));
            addTearDown(() => tester.binding.setSurfaceSize(null));
            const title =
                'تعلّم قواعد المرور واستعد لامتحان السياقة النظري België';
            await tester.pumpWidget(
              MaterialApp(
                theme: theme,
                home: MediaQuery(
                  data: MediaQueryData(textScaler: TextScaler.linear(scale)),
                  child: Directionality(
                    textDirection: direction,
                    child: Scaffold(
                      body: SingleChildScrollView(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: RijviaAdaptiveGrid(
                            children: [
                              RijviaTopicCard(
                                title: title,
                                icon: Icons.school_outlined,
                                progress: 0.4,
                                onTap: () {},
                              ),
                              const RijviaMetricCard(
                                label: 'الأسئلة المجاب عنها Beantwoorde vragen',
                                value: '320',
                                icon: Icons.speed_outlined,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
            for (final pair in [
              (Icons.school_outlined, title),
              (Icons.speed_outlined, '320'),
            ]) {
              final icon = tester.getRect(find.byIcon(pair.$1));
              final label = tester.getRect(find.text(pair.$2));
              if (direction == TextDirection.rtl) {
                expect(icon.left, greaterThan(label.right));
              } else {
                expect(icon.right, lessThan(label.left));
              }
            }
            expect(tester.takeException(), isNull);
          },
        );
      }
    }
  }
}
