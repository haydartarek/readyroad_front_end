import 'content_item.dart';

/// Quiz Question Model
class QuizQuestion {
  final ContentItem correctContent;
  final List<ContentItem> options;
  final String questionType; // 'name' or 'image'

  QuizQuestion({
    required this.correctContent,
    required this.options,
    this.questionType = 'image',
  });

  /// Check if answer is correct
  bool isCorrect(int selectedIndex) {
    return options[selectedIndex].id == correctContent.id;
  }
}

/// Quiz Result Model
class QuizResult {
  final int totalQuestions;
  final int correctAnswers;
  final int wrongAnswers;
  final Duration timeTaken;
  final int? categoryId;
  final DateTime completedAt;

  QuizResult({
    required this.totalQuestions,
    required this.correctAnswers,
    required this.wrongAnswers,
    required this.timeTaken,
    this.categoryId,
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

