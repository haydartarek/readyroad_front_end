import 'package:mobile_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile_app/core/providers/theme_provider.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/di/service_locator.dart';
import 'package:mobile_app/core/localization/app_localizations.dart';
import 'package:mobile_app/core/providers/language_provider.dart';
import 'package:mobile_app/features/exam/exam_results_screen.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// The app localization JSON is loaded before pumpWidget in setUp.
/// Returning it synchronously keeps widget tests deterministic across cases.
class _PreloadedLocalizationDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _PreloadedLocalizationDelegate(this.loaded);

  final AppLocalizations loaded;

  @override
  bool isSupported(Locale locale) =>
      locale.languageCode == loaded.locale.languageCode;

  @override
  Future<AppLocalizations> load(Locale locale) =>
      SynchronousFuture<AppLocalizations>(loaded);

  @override
  bool shouldReload(_PreloadedLocalizationDelegate old) => false;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AppLocalizations englishLocalization;

  setUp(() async {
    await getIt.reset();
    setupDependencies();
    SharedPreferences.setMockInitialValues({});
    englishLocalization = AppLocalizations(const Locale('en'));
    await englishLocalization.load();
  });

  tearDown(() => getIt.reset());

  testWidgets('renders the backend score and expandable answer review', (
    tester,
  ) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => LanguageProvider()),
          Provider<AuthBloc>.value(value: getIt<AuthBloc>()),
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ],
        child: MaterialApp(
          key: const ValueKey('results-review-app'),
          locale: const Locale('en'),
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: [
            _PreloadedLocalizationDelegate(englishLocalization),
          ],
          home: const ExamResultsScreen(
            examId: 42,
            initialResults: {
              'totalQuestions': 2,
              'correctAnswers': 1,
              'wrongAnswers': 1,
              'unansweredCount': 0,
              'scorePercentage': 50,
              'passed': false,
              'passingThreshold': 41,
              'pointsToPass': 40,
              'timeTakenSeconds': 30,
              'categoryBreakdown': [
                {
                  'categoryCode': 'A',
                  'categoryNameEn': 'Road rules',
                  'totalQuestions': 2,
                  'correctAnswers': 1,
                  'accuracyPercentage': 50,
                  'isWeakArea': true,
                },
              ],
              'incorrectQuestions': [
                {
                  'questionTextEn': 'What does this sign mean?',
                  'selectedOptionTextEn': 'Wrong answer',
                  'correctOptionTextEn': 'Correct answer',
                  'explanationEn': 'Read the sign shape.',
                  'categoryNameEn': 'Road rules',
                  'isCorrect': false,
                  'wasTimeout': false,
                },
              ],
            },
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text(englishLocalization.t('exam.results_failed_title')),
      findsOneWidget,
    );
    expect(find.text('50%'), findsWidgets);

    await tester.drag(
      find.byWidgetPredicate((w) => w is SingleChildScrollView && w.scrollDirection == Axis.vertical),
      const Offset(0, -500),
    );
    await tester.pumpAndSettle();

    expect(
      find.text(englishLocalization.t('exam.results_category_title')),
      findsOneWidget,
    );
    expect(find.textContaining('What does this sign mean?'), findsNothing);

    await tester.ensureVisible(
      find.byKey(const ValueKey('exam-review-button')),
    );
    await tester.tap(find.byKey(const ValueKey('exam-review-button')));
    await tester.pumpAndSettle();
    expect(find.textContaining('What does this sign mean?'), findsOneWidget);

    await tester.tap(find.textContaining('What does this sign mean?'));
    await tester.pumpAndSettle();
    await tester.drag(
      find.byWidgetPredicate((w) => w is SingleChildScrollView && w.scrollDirection == Axis.vertical),
      const Offset(0, -400),
    );
    await tester.pumpAndSettle();

    expect(
      find.text('Correct answer'),
      findsNWidgets(2), // The localized heading and this fixture's answer text.
    );
    expect(find.text('Read the sign shape.'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
  });

  testWidgets('starts with the wrong review filter and category progress bar', (
    tester,
  ) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => LanguageProvider()),
          Provider<AuthBloc>.value(value: getIt<AuthBloc>()),
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ],
        child: MaterialApp(
          key: const ValueKey('results-filter-app'),
          locale: const Locale('en'),
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: [
            _PreloadedLocalizationDelegate(englishLocalization),
          ],
          home: const ExamResultsScreen(
            examId: 42,
            initialResults: {
              'totalQuestions': 2,
              'correctAnswers': 1,
              'wrongAnswers': 1,
              'unansweredCount': 0,
              'scorePercentage': 50,
              'passed': false,
              'categoryBreakdown': [
                {
                  'categoryNameEn': 'Road rules',
                  'totalQuestions': 2,
                  'correctAnswers': 1,
                  'accuracyPercentage': 50,
                },
              ],
              'allAnswers': [
                {'questionTextEn': 'Correct question', 'isCorrect': true},
                {'questionTextEn': 'Wrong question', 'isCorrect': false},
              ],
            },
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.drag(
      find.byWidgetPredicate((w) => w is SingleChildScrollView && w.scrollDirection == Axis.vertical),
      const Offset(0, -500),
    );
    await tester.pumpAndSettle();

    expect(find.byType(LinearProgressIndicator), findsNWidgets(2));
    expect(find.textContaining('Correct question'), findsNothing);
    expect(find.textContaining('Wrong question'), findsNothing);

    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('exam-review-button')),
      250,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.byKey(const ValueKey('exam-review-button')));
    await tester.pumpAndSettle();

    expect(find.widgetWithText(ChoiceChip, 'Wrong'), findsOneWidget);
    expect(find.textContaining('Wrong question'), findsOneWidget);
    expect(find.textContaining('Correct question'), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
  });

  testWidgets('does not call the API for an invalid exam id', (tester) async {
    var loaderCalled = false;
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => LanguageProvider()),
          Provider<AuthBloc>.value(value: getIt<AuthBloc>()),
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ],
        child: MaterialApp(
          key: const ValueKey('results-invalid-app'),
          locale: const Locale('en'),
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: [
            _PreloadedLocalizationDelegate(englishLocalization),
          ],
          home: ExamResultsScreen(
            examId: 0,
            resultLoader: () async {
              loaderCalled = true;
              throw StateError('must not load');
            },
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(loaderCalled, isFalse);
    expect(find.text('Invalid exam result.'), findsOneWidget);
  });

  testWidgets(
    'primary review opens on a phone with a long category breakdown',
    (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(390, 844);
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => LanguageProvider()),
            Provider<AuthBloc>.value(value: getIt<AuthBloc>()),
            ChangeNotifierProvider(create: (_) => ThemeProvider()),
          ],
          child: MaterialApp(
            locale: const Locale('en'),
            localizationsDelegates: [
              _PreloadedLocalizationDelegate(englishLocalization),
            ],
            home: ExamResultsScreen(
              examId: 85,
              initialResults: {
                'totalQuestions': 50,
                'correctAnswers': 44,
                'wrongAnswers': 6,
                'scorePercentage': 88,
                'passed': true,
                'timeTakenSeconds': 387,
                'categoryBreakdown': [
                  for (var index = 0; index < 10; index++)
                    {
                      'categoryNameEn': 'Road category $index',
                      'totalQuestions': 5,
                      'correctAnswers': 4,
                      'accuracyPercentage': 80,
                    },
                ],
                'incorrectQuestions': [
                  {
                    'questionTextEn': 'Review target question',
                    'isCorrect': false,
                  },
                ],
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      final button = find.byKey(const ValueKey('exam-review-button'));
      await tester.scrollUntilVisible(button, 200);
      await Scrollable.ensureVisible(tester.element(button), alignment: 1);
      await tester.pumpAndSettle();
      await tester.tap(button);
      await tester.pumpAndSettle();
      expect(
        find.textContaining('Review target question').hitTestable(),
        findsOneWidget,
      );
      expect(tester.takeException(), isNull);
    },
  );
}
