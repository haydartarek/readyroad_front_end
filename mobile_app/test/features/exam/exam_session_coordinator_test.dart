import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/exam/exam_session_coordinator.dart';

Map<String, dynamic> snapshot({
  int examId = 42,
  int order = 1,
  String mode = 'PREVIEW',
  String state = 'PREVIEW_ACTIVE',
  List<int> finalized = const [],
  String? deadline,
  int visibleCount = 10,
}) => {
  'examId': examId,
  'status': 'IN_PROGRESS',
  'accessMode': mode,
  'accessState': state,
  'totalQuestions': 50,
  'freeQuestionLimit': 10,
  'resumeQuestionOrder': order,
  'finalizedQuestionIds': finalized,
  'questionDeadlineAt': deadline,
  'serverTime': '2026-10-10T12:00:00Z',
  'questions': List.generate(
    visibleCount,
    (index) => {'questionId': 101 + index, 'questionOrder': index + 1},
  ),
};

Map<String, dynamic> response(Map<String, dynamic>? active) => {
  'hasActiveExam': active != null,
  'activeExam': active,
};

DioException rejected(int status) {
  final request = RequestOptions(path: '/api/exams/simulations/start');
  return DioException(
    requestOptions: request,
    response: Response(requestOptions: request, statusCode: status),
    type: DioExceptionType.badResponse,
  );
}

void main() {
  group('Fix 05B: exam entry and server-owned deadline', () {
    test('No active exam: create exactly once then persist presentation', () async {
      Map<String, dynamic>? active;
      var startCalls = 0;
      var presentedCalls = 0;
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(active),
        startNew: () async {
          startCalls++;
          active = snapshot();
          return active!;
        },
        markPresented: (examId, questionId) async {
          expect(examId, 42);
          expect(questionId, 101);
          presentedCalls++;
          active!['questionDeadlineAt'] = '2026-10-10T12:00:15Z';
        },
      );
      final ready = await coordinator.enter();
      expect(startCalls, 1);
      expect(presentedCalls, 1);
      expect(ready['examId'], 42);
      expect(ready['questionDeadlineAt'], '2026-10-10T12:00:15Z');
    });

    test('Active exam: resumes rather than creating another attempt', () async {
      final active = snapshot(deadline: '2026-10-10T12:00:15Z');
      var startCalls = 0;
      var presentedCalls = 0;
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(active),
        startNew: () async {
          startCalls++;
          throw StateError('Must never start');
        },
        markPresented: (_, _) async { presentedCalls++; },
      );
      expect((await coordinator.enter())['examId'], 42);
      expect(startCalls, 0);
      expect(presentedCalls, 1);
    });

    for (final status in [400, 409]) {
      test('Start race $status: adopt existing attempt, never retry POST', () async {
        Map<String, dynamic>? active;
        var startCalls = 0;
        final coordinator = ExamSessionCoordinator(
          loadActive: () async => response(active),
          startNew: () async {
            startCalls++;
            active = snapshot(examId: 77, deadline: '2026-10-10T12:00:15Z');
            throw rejected(status);
          },
          markPresented: (id, questionId) async {
            expect(id, 77);
            expect(questionId, 101);
          },
        );
        final ready = await coordinator.enter();
        expect(ready['examId'], 77);
        expect(startCalls, 1);
      });
    }

    test('Start race without active exam surfaces original conflict', () async {
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(null),
        startNew: () async => throw rejected(409),
        markPresented: (_, _) async {},
      );
      await expectLater(coordinator.enter(), throwsA(isA<DioException>()));
    });

    test('Other HTTP errors are never interpreted as a successful start', () async {
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(null),
        startNew: () async => throw rejected(401),
        markPresented: (_, _) async {},
      );
      await expectLater(coordinator.enter(), throwsA(isA<DioException>()));
    });

    test('Preview paywall is not presented or exposed beyond first 10', () async {
      final paused = snapshot(
        state: 'FREE_LIMIT_REACHED', order: 11,
        finalized: List.generate(10, (index) => 101 + index),
      );
      var presentedCalls = 0;
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(paused),
        startNew: () async => throw StateError('start not expected'),
        markPresented: (_, _) async { presentedCalls++; },
      );
      expect((await coordinator.presentAndRefresh(paused))['accessState'], 'FREE_LIMIT_REACHED');
      expect(presentedCalls, 0);
    });

    test('Explicit restart creates one new preview attempt', () async {
      Map<String, dynamic>? active = snapshot(
        examId: 42, state: 'FREE_LIMIT_REACHED', order: 11,
      );
      var startCalls = 0;
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(active),
        startNew: () async {
          startCalls++;
          active = snapshot(examId: 43, deadline: '2026-10-10T12:00:15Z');
          return active!;
        },
        markPresented: (_, _) async {},
      );
      expect((await coordinator.enter())['examId'], 43);
      expect(startCalls, 1);
    });

    test('Rejected preview restart cannot falsely claim completion', () async {
      final paused = snapshot(state: 'FREE_LIMIT_REACHED', order: 11);
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(paused),
        startNew: () async => throw rejected(400),
        markPresented: (_, _) async => throw StateError('not expected'),
      );
      await expectLater(coordinator.enter(), throwsA(isA<DioException>()));
    });

    test('Deadline is not reset by repeated idempotent presented calls', () async {
      final active = snapshot(deadline: '2026-10-10T12:00:15Z');
      var presentedCalls = 0;
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(active),
        startNew: () async => throw StateError('not expected'),
        markPresented: (_, _) async { presentedCalls++; },
      );
      final one = await coordinator.presentAndRefresh(active);
      final two = await coordinator.presentAndRefresh(one);
      expect(one['questionDeadlineAt'], '2026-10-10T12:00:15Z');
      expect(two['questionDeadlineAt'], '2026-10-10T12:00:15Z');
      expect(presentedCalls, 2);
    });

    test('Missing persisted deadline fails closed rather than creating 15s', () async {
      final active = snapshot();
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(active),
        startNew: () async => throw StateError('not expected'),
        markPresented: (_, _) async {},
      );
      await expectLater(
        coordinator.presentAndRefresh(active),
        throwsA(isA<StateError>()),
      );
    });

    test('Failed presentation leaves the existing attempt intact', () async {
      final active = snapshot();
      var startCalls = 0;
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(active),
        startNew: () async {
          startCalls++;
          throw StateError('not expected');
        },
        markPresented: (_, _) async => throw rejected(502),
      );
      await expectLater(coordinator.enter(), throwsA(isA<DioException>()));
      expect(startCalls, 0);
    });

    test('Concurrent device finalized question: move to persisted next order', () async {
      Map<String, dynamic> active = snapshot();
      final recorded = <int>[];
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(active),
        startNew: () async => throw StateError('not expected'),
        markPresented: (_, questionId) async {
          recorded.add(questionId);
          if (questionId == 101) {
            active = snapshot(order: 2, finalized: [101]);
          } else {
            active['questionDeadlineAt'] = '2026-10-10T12:00:30Z';
          }
        },
      );
      final ready = await coordinator.presentAndRefresh(active);
      expect(recorded, [101, 102]);
      expect(ready['resumeQuestionOrder'], 2);
      expect(ready['questionDeadlineAt'], '2026-10-10T12:00:30Z');
    });

    test('Different exam on server never reuses stale local question', () async {
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(snapshot(examId: 88)),
        startNew: () async => throw StateError('not expected'),
        markPresented: (_, _) async {},
      );
      await expectLater(
        coordinator.resumeExisting(42),
        throwsA(isA<StateError>()),
      );
    });

    test('All 50 finalized: do not present again or reset timer', () async {
      final completedAnswers = snapshot(
        mode: 'FULL', state: 'FULL_ACTIVE', order: 50,
        visibleCount: 50,
        finalized: List.generate(50, (index) => 101 + index),
      );
      var calls = 0;
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => response(completedAnswers),
        startNew: () async => throw StateError('not expected'),
        markPresented: (_, _) async { calls++; },
      );
      expect((await coordinator.resumeExisting(42))['resumeQuestionOrder'], 50);
      expect(calls, 0);
    });

    test('Malformed active wrapper is rejected instead of starting new exam', () async {
      final coordinator = ExamSessionCoordinator(
        loadActive: () async => {'hasActiveExam': true, 'activeExam': null},
        startNew: () async => throw StateError('must not start'),
        markPresented: (_, _) async {},
      );
      await expectLater(coordinator.enter(), throwsA(isA<StateError>()));
    });
  });
}
