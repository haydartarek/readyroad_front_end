import 'package:dio/dio.dart';

import 'exam_flow_policy.dart';

/// Serial, server-authoritative exam entry and presentation transitions.
/// It deliberately does not cache progress, issue retries for mutations,
/// or infer paid access from client-side state.
class ExamSessionCoordinator {
  final Future<Map<String, dynamic>> Function() loadActive;
  final Future<Map<String, dynamic>> Function() startNew;
  final Future<void> Function(int examId, int questionId) markPresented;

  const ExamSessionCoordinator({
    required this.loadActive,
    required this.startNew,
    required this.markPresented,
  });

  Future<Map<String, dynamic>?> activeExam() async {
    final result = await loadActive();
    if (result['hasActiveExam'] == false) return null;
    if (result['hasActiveExam'] != true || result['activeExam'] is! Map) {
      throw StateError('Invalid active exam response from server');
    }
    return Map<String, dynamic>.from(result['activeExam'] as Map);
  }

  /// Start only when the server finds no active attempt, or when the learner
  /// explicitly requests to restart a paused FREE preview.
  /// An overlapping start on Web can return 400/409. In that case adopt the
  /// existing server attempt; never retry the POST and create another exam.
  Future<Map<String, dynamic>> enter() async {
    final current = await activeExam();
    final action = ExamFlowPolicy.entryAction(
      hasActiveExam: current != null,
      accessMode: current?['accessMode']?.toString(),
      accessState: current?['accessState']?.toString(),
    );
    if (action == ExamEntryAction.resume) {
      return presentAndRefresh(current!);
    }

    Map<String, dynamic> created;
    try {
      created = await startNew();
    } on DioException catch (error) {
      if (error.response?.statusCode != 400 &&
          error.response?.statusCode != 409) {
        rethrow;
      }
      final latest = await activeExam();
      // A stopped/free-preview attempt must not be silently treated as a
      // successfully restarted exam when the server rejected its mutation.
      if (latest == null ||
          (action == ExamEntryAction.restartPreview &&
              latest['accessMode'] == 'PREVIEW' &&
              latest['accessState'] == 'FREE_LIMIT_REACHED')) {
        rethrow;
      }
      return presentAndRefresh(latest);
    }
    return presentAndRefresh(created);
  }

  /// Reconcile after answer/timeout and use the server's first unfinalized
  /// question. A changed/absent exam ID means this device has stale state.
  Future<Map<String, dynamic>> resumeExisting(int expectedExamId) async {
    final current = await activeExam();
    if (current == null || _examId(current) != expectedExamId) {
      throw StateError('Exam changed on another device. Reload the exam.');
    }
    return presentAndRefresh(current);
  }

  /// POST /presented is idempotent in Backend. After it succeeds, GET /active
  /// supplies the persisted first-presentation deadline, not a fresh local
  /// 15-second timer. A failed GET may be retried safely without a reset.
  Future<Map<String, dynamic>> presentAndRefresh(
    Map<String, dynamic> snapshot,
  ) async {
    var current = snapshot;
    // Another client may finalize the question between GET and POST.
    // Bounded reconciliation picks up the next server-owned order without
    // leaking a fresh client-side timer or spinning forever under contention.
    for (var attempt = 0; attempt < 4; attempt++) {
      final examId = _examId(current);
      if (examId == null || examId <= 0) {
        throw StateError('Missing exam ID from server');
      }
      if (current['status']?.toString() != 'IN_PROGRESS' ||
          current['accessState'] == 'FREE_LIMIT_REACHED') {
        return current;
      }
      final questions = current['questions'];
      if (questions is! List || questions.isEmpty) {
        throw StateError('Missing exam questions from server');
      }
      final order = (current['resumeQuestionOrder'] as num?)?.toInt();
      if (order == null) {
        throw StateError('Missing resume question order from server');
      }
      Map<String, dynamic>? pending;
      for (final entry in questions) {
        if (entry is Map &&
            (entry['questionOrder'] as num?)?.toInt() == order) {
          pending = Map<String, dynamic>.from(entry);
          break;
        }
      }
      if (pending == null) {
        throw StateError('Resume question is unavailable to this account');
      }
      final questionId = (pending['questionId'] as num?)?.toInt();
      if (questionId == null || questionId <= 0) {
        throw StateError('Missing question ID from server');
      }
      final finalized = current['finalizedQuestionIds'];
      if (finalized is! List) {
        throw StateError('Missing finalized question IDs from server');
      }
      if (finalized.whereType<num>().any((v) => v.toInt() == questionId)) {
        // All questions may be finalized awaiting explicit submit.
        return current;
      }
      await markPresented(examId, questionId);
      final refreshed = await activeExam();
      if (refreshed == null || _examId(refreshed) != examId) {
        throw StateError('Exam changed while presenting the question');
      }
      if (refreshed['status']?.toString() != 'IN_PROGRESS' ||
          refreshed['accessState'] == 'FREE_LIMIT_REACHED') {
        return refreshed;
      }
      if ((refreshed['resumeQuestionOrder'] as num?)?.toInt() == order) {
        final latestFinalized = refreshed['finalizedQuestionIds'];
        if (latestFinalized is List &&
            latestFinalized.whereType<num>().any(
              (v) => v.toInt() == questionId,
            )) {
          current = refreshed;
          continue;
        }
        if (DateTime.tryParse(
                  refreshed['questionDeadlineAt']?.toString() ?? '',
                ) ==
                null ||
            DateTime.tryParse(refreshed['serverTime']?.toString() ?? '') ==
                null) {
          throw StateError(
            'Server did not return the question deadline and clock',
          );
        }
        return refreshed;
      }
      current = refreshed;
    }
    throw StateError('Exam changed repeatedly. Reload before continuing.');
  }

  static int? _examId(Map<String, dynamic> exam) =>
      (exam['examId'] as num?)?.toInt();
}
