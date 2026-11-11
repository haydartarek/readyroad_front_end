/// Question contract returned by `/api/quiz/random` and `/api/quiz/category`.
/// Correctness is deliberately absent and is only returned after submission.
class QuizAnswerOption {
  final int id;
  final String textEn;
  final String textAr;
  final String textNl;
  final String textFr;

  const QuizAnswerOption({
    required this.id,
    required this.textEn,
    required this.textAr,
    required this.textNl,
    required this.textFr,
  });

  factory QuizAnswerOption.fromJson(Map<String, dynamic> json) {
    return QuizAnswerOption(
      id: _asInt(json['id']),
      textEn: _asString(json['optionTextEn']),
      textAr: _asString(json['optionTextAr']),
      textNl: _asString(json['optionTextNl']),
      textFr: _asString(json['optionTextFr']),
    );
  }

  String textFor(String language) => switch (language) {
    'ar' => _firstNonBlank([textAr, textEn, textNl, textFr]),
    'nl' => _firstNonBlank([textNl, textEn, textFr, textAr]),
    'fr' => _firstNonBlank([textFr, textEn, textNl, textAr]),
    _ => _firstNonBlank([textEn, textNl, textFr, textAr]),
  };
}

class QuizQuestion {
  final int id;
  final String questionEn;
  final String questionAr;
  final String questionNl;
  final String questionFr;
  final String? contentImageUrl;
  final int? categoryId;
  final String difficultyLevel;
  final String questionType;
  final List<QuizAnswerOption> options;

  const QuizQuestion({
    required this.id,
    required this.questionEn,
    required this.questionAr,
    required this.questionNl,
    required this.questionFr,
    required this.contentImageUrl,
    required this.categoryId,
    required this.difficultyLevel,
    required this.questionType,
    required this.options,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['options'] as List<dynamic>? ?? const [];
    return QuizQuestion(
      id: _asInt(json['id']),
      questionEn: _asString(json['questionEn']),
      questionAr: _asString(json['questionAr']),
      questionNl: _asString(json['questionNl']),
      questionFr: _asString(json['questionFr']),
      contentImageUrl: _asNullableString(json['contentImageUrl']),
      categoryId: _asNullableInt(json['categoryId']),
      difficultyLevel: _asString(
        json['difficultyLevel'] ?? json['difficulty'],
      ).toUpperCase(),
      questionType: _asString(json['questionType'] ?? json['type']),
      options: rawOptions
          .whereType<Map>()
          .map(
            (option) =>
                QuizAnswerOption.fromJson(Map<String, dynamic>.from(option)),
          )
          .toList(growable: false),
    );
  }

  String questionFor(String language) => switch (language) {
    'ar' => _firstNonBlank([questionAr, questionEn, questionNl, questionFr]),
    'nl' => _firstNonBlank([questionNl, questionEn, questionFr, questionAr]),
    'fr' => _firstNonBlank([questionFr, questionEn, questionNl, questionAr]),
    _ => _firstNonBlank([questionEn, questionNl, questionFr, questionAr]),
  };
}

/// Quiz Result Model
class QuizResult {
  final int totalQuestions;
  final int correctAnswers;
  final int wrongAnswers;
  final Duration timeTaken;
  final int? categoryId;
  final DateTime completedAt;
  final List<QuizReviewItem> review;

  QuizResult({
    required this.totalQuestions,
    required this.correctAnswers,
    required this.wrongAnswers,
    required this.timeTaken,
    this.categoryId,
    this.review = const [],
    DateTime? completedAt,
  }) : completedAt = completedAt ?? DateTime.now();

  int get score => ((correctAnswers / totalQuestions) * 100).round();

  bool get isPassed => score >= 70;

  String get grade {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

class QuizReviewItem {
  final QuizQuestion question;
  final int? selectedOptionId;
  final int? correctOptionId;
  final String explanationEn;
  final String explanationAr;
  final String explanationNl;
  final String explanationFr;

  const QuizReviewItem({
    required this.question,
    required this.selectedOptionId,
    required this.correctOptionId,
    required this.explanationEn,
    required this.explanationAr,
    required this.explanationNl,
    required this.explanationFr,
  });

  bool get isCorrect => selectedOptionId != null && selectedOptionId == correctOptionId;

  String explanationFor(String language) => switch (language) {
    'ar' => _firstNonBlank([explanationAr, explanationEn, explanationNl, explanationFr]),
    'nl' => _firstNonBlank([explanationNl, explanationEn, explanationFr, explanationAr]),
    'fr' => _firstNonBlank([explanationFr, explanationEn, explanationNl, explanationAr]),
    _ => _firstNonBlank([explanationEn, explanationNl, explanationFr, explanationAr]),
  };
}

int _asInt(Object? value) =>
    value is num ? value.toInt() : int.tryParse(value?.toString() ?? '') ?? 0;

int? _asNullableInt(Object? value) => value == null ? null : _asInt(value);

String _asString(Object? value) =>
    value is String ? value : value?.toString() ?? '';

String? _asNullableString(Object? value) {
  final text = _asString(value).trim();
  return text.isEmpty ? null : text;
}

String _firstNonBlank(Iterable<String> values) {
  for (final value in values) {
    if (value.trim().isNotEmpty) return value.trim();
  }
  return '';
}
