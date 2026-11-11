import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app/core/providers/statistics_provider.dart';
import 'package:mobile_app/shared/models/quiz_models.dart';
import 'package:mobile_app/shared/models/statistics_models.dart';

final _overall = <String, dynamic>{
  'totalAttempted': 27,
  'totalCorrect': 19,
  'overallAccuracy': 70.37,
  'totalExamsTaken': 2,
  'passedExams': 1,
  'failedExams': 1,
  'passRate': 50.0,
};
final _history = <String, dynamic>{
  'totalExams': 3,
  'exams': [
    {
      'examId': 34,
      'status': 'IN_PROGRESS',
      'startedAt': '2026-10-10T08:00:00Z',
    },
    {
      'examId': 33,
      'status': 'COMPLETED',
      'totalQuestions': 50,
      'correctAnswers': 42,
      'passed': true,
      'completedAt': '2026-10-10T11:00:00Z',
    },
    {
      'examId': 32,
      'status': 'COMPLETED',
      'totalQuestions': 50,
      'correctAnswers': 20,
      'passed': false,
      'completedAt': '2026-10-09T11:00:00Z',
    },
  ],
};

class _FakeRemote implements StatisticsRemoteSource {
  Future<Map<String, dynamic>> Function()? onProgress;
  Future<Map<String, dynamic>> Function()? onHistory;
  int progressCalls = 0;
  int historyCalls = 0;

  @override
  Future<Map<String, dynamic>> overallProgress() {
    progressCalls++;
    return onProgress?.call() ?? Future.value(_overall);
  }

  @override
  Future<Map<String, dynamic>> theoryExamHistory() {
    historyCalls++;
    return onHistory?.call() ?? Future.value(_history);
  }
}

QuizResult _localResult({DateTime? time}) => QuizResult(
  totalQuestions: 10,
  correctAnswers: 6,
  wrongAnswers: 4,
  timeTaken: const Duration(seconds: 93),
  completedAt: time ?? DateTime.utc(2026, 10, 10, 9),
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('Backend model contract', () {
    test('practice and exam totals use distinct server fields', () {
      final progress = ServerPracticeProgress.fromJson(_overall);
      expect(progress.attempted, 27);
      expect(progress.correct, 19);
      expect(progress.wrong, 8);
      expect(progress.examsTaken, 2);
      expect(progress.examsPassed, 1);
      expect(progress.examsFailed, 1);
      expect(progress.examPassRate, 50);
    });

    test('does not invent missing account statistics as zeros', () {
      expect(() => ServerPracticeProgress.fromJson({}), throwsFormatException);
      expect(
        () => ServerPracticeProgress.fromJson({..._overall, 'totalCorrect': 50}),
        throwsFormatException,
      );
      expect(
        () => ServerPracticeProgress.fromJson({..._overall, 'overallAccuracy': double.nan}),
        throwsFormatException,
      );
    });

    test('recent exam history includes only completed server exams', () {
      final exams = ServerTheoryExam.completedFromHistory(_history);
      expect(exams.map((exam) => exam.examId), [33, 32]);
      expect(exams.first.score, 84);
      expect(exams.first.passed, true);
      expect(exams.last.passed, false);
    });

    test('missing exam history list is not treated as no exams', () {
      expect(() => ServerTheoryExam.completedFromHistory({}), throwsFormatException);
    });

    test('local session numbers are never merged into server aggregates', () {
      final local = QuizStatistics(results: [_localResult()]);
      final server = ServerPracticeProgress.fromJson(_overall);
      expect(local.totalQuizzesTaken, 1);
      expect(local.totalQuestionsSolved, 10);
      expect(local.totalWrongAnswers, 4);
      expect(server.attempted, 27);
      expect(server.wrong, 8);
      expect(server.examsTaken, 2);
    });
  });

  group('User-scoped statistics provider', () {
    test('fetches both backend sources for signed-in user', () async {
      final source = _FakeRemote();
      final provider = StatisticsProvider(remoteSource: source);
      addTearDown(provider.dispose);
      await provider.bindToUser('7');
      expect(provider.progressState, StatisticsLoadState.ready);
      expect(provider.historyState, StatisticsLoadState.ready);
      expect(provider.serverProgress!.attempted, 27);
      expect(provider.serverExams.length, 2);
      expect(source.progressCalls, 1);
      expect(source.historyCalls, 1);
    });

    test('network failure does not synthesize zero or local values', () async {
      final source = _FakeRemote();
      source.onProgress = () async => throw Exception('offline');
      source.onHistory = () async => throw Exception('offline');
      final provider = StatisticsProvider(remoteSource: source);
      addTearDown(provider.dispose);
      await provider.bindToUser('7');
      await provider.saveResult(_localResult());
      expect(provider.progressState, StatisticsLoadState.unavailable);
      expect(provider.historyState, StatisticsLoadState.unavailable);
      expect(provider.serverProgress, isNull);
      expect(provider.serverExams, isEmpty);
      expect(provider.statistics.totalQuizzesTaken, 1);
    });

    test('partial API outage preserves healthy independent source', () async {
      final source = _FakeRemote()
        ..onHistory = () async => throw Exception('history 503');
      final provider = StatisticsProvider(remoteSource: source);
      addTearDown(provider.dispose);
      await provider.bindToUser('7');
      expect(provider.progressState, StatisticsLoadState.ready);
      expect(provider.historyState, StatisticsLoadState.unavailable);
      expect(provider.serverProgress!.correct, 19);
      expect(provider.serverExams, isEmpty);
    });

    test('retry after offline obtains server totals and history', () async {
      var online = false;
      final source = _FakeRemote()
        ..onProgress = () async {
          if (!online) throw Exception('offline');
          return _overall;
        }
        ..onHistory = () async {
          if (!online) throw Exception('offline');
          return _history;
        };
      final provider = StatisticsProvider(remoteSource: source);
      addTearDown(provider.dispose);
      await provider.bindToUser('7');
      expect(provider.progressState, StatisticsLoadState.unavailable);
      online = true;
      await provider.refreshRemote();
      expect(provider.progressState, StatisticsLoadState.ready);
      expect(provider.serverProgress!.examsTaken, 2);
      expect(provider.serverExams.first.examId, 33);
    });

    test('logout wipes server counters and local user cache from view', () async {
      final provider = StatisticsProvider(remoteSource: _FakeRemote());
      addTearDown(provider.dispose);
      await provider.bindToUser('7');
      await provider.saveResult(_localResult());
      expect(provider.serverProgress, isNotNull);
      await provider.bindToUser(null);
      expect(provider.isAuthenticatedScope, false);
      expect(provider.serverProgress, isNull);
      expect(provider.serverExams, isEmpty);
      expect(provider.quizResults, isEmpty);
      expect(provider.progressState, StatisticsLoadState.notApplicable);
    });

    test('late response for previous account cannot overwrite new account', () async {
      final first = Completer<Map<String, dynamic>>();
      final second = Completer<Map<String, dynamic>>();
      final source = _FakeRemote();
      source.onProgress = () => source.progressCalls == 1
          ? first.future
          : second.future;
      final provider = StatisticsProvider(remoteSource: source);
      addTearDown(provider.dispose);
      final oldLoad = provider.bindToUser('user-a');
      await Future<void>.delayed(Duration.zero);
      final newLoad = provider.bindToUser('user-b');
      await Future<void>.delayed(Duration.zero);
      second.complete({..._overall, 'totalAttempted': 3, 'totalCorrect': 2});
      await newLoad;
      first.complete({..._overall, 'totalAttempted': 999, 'totalCorrect': 999});
      await oldLoad;
      expect(provider.serverProgress!.attempted, 3);
      expect(provider.serverProgress!.correct, 2);
    });

    test('local sessions are per-user and clear does not erase server totals', () async {
      final provider = StatisticsProvider(remoteSource: _FakeRemote());
      addTearDown(provider.dispose);
      await provider.bindToUser('a');
      await provider.saveResult(_localResult());
      expect(provider.statistics.totalQuizzesTaken, 1);
      await provider.bindToUser('b');
      expect(provider.statistics.totalQuizzesTaken, 0);
      await provider.bindToUser('a');
      expect(provider.statistics.totalQuizzesTaken, 1);
      await provider.clearStatistics();
      expect(provider.statistics.totalQuizzesTaken, 0);
      expect(provider.serverProgress!.attempted, 27);
      await provider.bindToUser('b');
      await provider.bindToUser('a');
      expect(provider.quizResults, isEmpty);
    });

    test('one quiz result is not counted twice by repeated save', () async {
      final provider = StatisticsProvider(remoteSource: _FakeRemote());
      addTearDown(provider.dispose);
      await provider.bindToUser('a');
      final result = _localResult();
      await provider.saveResult(result);
      await provider.saveResult(result);
      expect(provider.statistics.totalQuizzesTaken, 1);
    });

    test('corrupt device cache entries do not break signed-in statistics', () async {
      SharedPreferences.setMockInitialValues({
        'quiz_results.7': [
          '{ invalid json',
          jsonEncode({
            'totalQuestions': 10,
            'correctAnswers': 6,
            'wrongAnswers': 4,
            'timeInSeconds': 93,
            'completedAt': '2026-10-10T09:00:00Z',
          }),
        ],
      });
      final provider = StatisticsProvider(remoteSource: _FakeRemote());
      addTearDown(provider.dispose);
      await provider.bindToUser('7');
      expect(provider.quizResults.length, 1);
      expect(provider.progressState, StatisticsLoadState.ready);
    });
  });
}
