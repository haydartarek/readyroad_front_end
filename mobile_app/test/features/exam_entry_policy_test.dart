import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/exam/exam_flow_policy.dart';

void main() {
  group('entry action follows the latest server session', () {
    test('opening exam with no active session does not auto-start it', () {
      expect(
        ExamFlowPolicy.entryAction(
          hasActiveExam: false,
          accessMode: null,
          accessState: null,
        ),
        ExamEntryAction.start,
      );
    });

    test('unfinished preview resumes the same persisted attempt', () {
      expect(
        ExamFlowPolicy.entryAction(
          hasActiveExam: true,
          accessMode: 'PREVIEW',
          accessState: 'PREVIEW_ACTIVE',
        ),
        ExamEntryAction.resume,
      );
    });

    test('preview paused at paywall can be restarted by POST start', () {
      expect(
        ExamFlowPolicy.entryAction(
          hasActiveExam: true,
          accessMode: 'PREVIEW',
          accessState: 'FREE_LIMIT_REACHED',
        ),
        ExamEntryAction.restartPreview,
      );
    });

    test('paid learner continues existing attempt after checkout', () {
      expect(
        ExamFlowPolicy.entryAction(
          hasActiveExam: true,
          accessMode: 'FULL',
          accessState: 'FULL_ACTIVE',
        ),
        ExamEntryAction.resume,
      );
    });

    test('a legacy active session is not replaced without approval', () {
      expect(
        ExamFlowPolicy.entryAction(
          hasActiveExam: true,
          accessMode: null,
          accessState: null,
        ),
        ExamEntryAction.resume,
      );
    });
  });
}
