/// Action chosen after checking the active exam on the backend.
enum ExamEntryAction { start, resume, restartPreview }

/// Server-owned theory exam boundary decisions shared by the Flutter screen
/// and its regression tests. This class does not grant access or score answers.
class ExamFlowPolicy {
  const ExamFlowPolicy._();

  static ExamEntryAction entryAction({
    required bool hasActiveExam,
    required String? accessMode,
    required String? accessState,
  }) {
    if (!hasActiveExam) return ExamEntryAction.start;
    if (accessMode == 'PREVIEW' && accessState == 'FREE_LIMIT_REACHED') {
      return ExamEntryAction.restartPreview;
    }
    return ExamEntryAction.resume;
  }

  static bool isPreviewBoundary({
    required String? accessMode,
    required String? accessState,
    required int questionIndex,
    required int visibleQuestionCount,
    required int questionOrder,
    required int freeQuestionLimit,
  }) {
    if (accessState == 'FREE_LIMIT_REACHED') return true;
    return accessMode == 'PREVIEW' &&
        visibleQuestionCount > 0 &&
        questionIndex == visibleQuestionCount - 1 &&
        freeQuestionLimit > 0 &&
        questionOrder >= freeQuestionLimit;
  }

  static bool canSubmitFullExam({
    required String? accessMode,
    required String? accessState,
    required int visibleQuestionCount,
    required int totalQuestionCount,
    required int finalizedCount,
  }) {
    if (accessMode == 'PREVIEW' ||
        accessState == 'PREVIEW_ACTIVE' ||
        accessState == 'FREE_LIMIT_REACHED') {
      return false;
    }
    return totalQuestionCount > 0 &&
        visibleQuestionCount == totalQuestionCount &&
        finalizedCount == totalQuestionCount;
  }
}
