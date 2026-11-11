import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/exam/exam_flow_policy.dart';

void main() {
  group('free preview boundary', () {
    test('question ten shows paywall on answer or timeout', () {
      expect(ExamFlowPolicy.isPreviewBoundary(
        accessMode: 'PREVIEW', accessState: 'PREVIEW_ACTIVE',
        questionIndex: 9, visibleQuestionCount: 10,
        questionOrder: 10, freeQuestionLimit: 10,
      ), isTrue);
    });

    test('question nine remains within preview', () {
      expect(ExamFlowPolicy.isPreviewBoundary(
        accessMode: 'PREVIEW', accessState: 'PREVIEW_ACTIVE',
        questionIndex: 8, visibleQuestionCount: 10,
        questionOrder: 9, freeQuestionLimit: 10,
      ), isFalse);
    });

    test('a server paywall response is always respected', () {
      expect(ExamFlowPolicy.isPreviewBoundary(
        accessMode: 'PREVIEW', accessState: 'FREE_LIMIT_REACHED',
        questionIndex: 9, visibleQuestionCount: 10,
        questionOrder: 10, freeQuestionLimit: 10,
      ), isTrue);
    });
  });

  group('full exam submission', () {
    test('ten visible preview questions never permit submitting 50', () {
      expect(ExamFlowPolicy.canSubmitFullExam(
        accessMode: 'PREVIEW', accessState: 'FREE_LIMIT_REACHED',
        visibleQuestionCount: 10, totalQuestionCount: 50,
        finalizedCount: 10,
      ), isFalse);
    });

    test('paid attempt requires all fifty finalized on the server', () {
      for (final finalized in [0, 10, 49]) {
        expect(ExamFlowPolicy.canSubmitFullExam(
          accessMode: 'FULL', accessState: 'FULL_ACTIVE',
          visibleQuestionCount: 50, totalQuestionCount: 50,
          finalizedCount: finalized,
        ), isFalse);
      }
      expect(ExamFlowPolicy.canSubmitFullExam(
        accessMode: 'FULL', accessState: 'FULL_ACTIVE',
        visibleQuestionCount: 50, totalQuestionCount: 50,
        finalizedCount: 50,
      ), isTrue);
    });

    test('partial question lists never submit, even with full access', () {
      expect(ExamFlowPolicy.canSubmitFullExam(
        accessMode: 'FULL', accessState: 'FULL_ACTIVE',
        visibleQuestionCount: 10, totalQuestionCount: 50,
        finalizedCount: 10,
      ), isFalse);
    });
  });
}
