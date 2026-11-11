import 'package:mobile_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile_app/core/providers/theme_provider.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/di/service_locator.dart';
import 'package:mobile_app/core/localization/app_localizations.dart';
import 'package:mobile_app/features/exam/exam_history_screen.dart';
import 'package:mobile_app/core/providers/language_provider.dart';
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

  testWidgets('renders history scores and supported attempt statuses', (
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
          key: const ValueKey('history-statuses-app'),
          locale: const Locale('en'),
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: [
            _PreloadedLocalizationDelegate(englishLocalization),
          ],
          home: const ExamHistoryScreen(
            initialHistory: {
              'totalExams': 4,
              'exams': [
                {
                  'examId': 4,
                  'status': 'COMPLETED',
                  'scorePercentage': 84,
                  'correctAnswers': 42,
                  'totalQuestions': 50,
                  'passed': true,
                  'startedAt': '2026-09-30T10:00:00Z',
                },
                {
                  'examId': 3,
                  'status': 'IN_PROGRESS',
                  'startedAt': '2026-09-29T10:00:00Z',
                },
                {
                  'examId': 2,
                  'status': 'ABANDONED',
                  'startedAt': '2026-09-28T10:00:00Z',
                },
                {
                  'examId': 1,
                  'status': 'EXPIRED',
                  'startedAt': '2026-09-27T10:00:00Z',
                },
              ],
            },
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Exam history'), findsOneWidget);
    expect(find.textContaining('84%'), findsOneWidget);

    final scrollable = find.byType(Scrollable).first;

    await tester.scrollUntilVisible(
      find.textContaining('In progress'),
      250,
      scrollable: scrollable,
    );
    expect(find.textContaining('In progress'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.textContaining('Abandoned'),
      250,
      scrollable: scrollable,
    );
    expect(find.textContaining('Abandoned'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.textContaining('Expired'),
      250,
      scrollable: scrollable,
    );
    expect(find.textContaining('Expired'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
  });

  testWidgets('renders history totals and pass rate summary', (tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => LanguageProvider()),
          Provider<AuthBloc>.value(value: getIt<AuthBloc>()),
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ],
        child: MaterialApp(
          key: const ValueKey('history-summary-app'),
          locale: const Locale('en'),
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: [
            _PreloadedLocalizationDelegate(englishLocalization),
          ],
          home: const ExamHistoryScreen(
            initialHistory: {
              'totalExams': 2,
              'exams': [
                {
                  'examId': 2,
                  'status': 'COMPLETED',
                  'scorePercentage': 84,
                  'correctAnswers': 42,
                  'totalQuestions': 50,
                  'passed': true,
                },
                {
                  'examId': 1,
                  'status': 'COMPLETED',
                  'scorePercentage': 50,
                  'correctAnswers': 25,
                  'totalQuestions': 50,
                  'passed': false,
                },
              ],
            },
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Total attempts'), findsOneWidget);
    expect(find.text('Pass rate'), findsOneWidget);
    expect(find.text('50%'), findsOneWidget);
  });
}
