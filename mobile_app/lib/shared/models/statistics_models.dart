import 'quiz_models.dart';

/// Quiz Statistics Model
class QuizStatistics {
  final List<QuizResult> results;

  QuizStatistics({required this.results});

  int get totalQuizzesTaken => results.length;

  int get totalQuestionsSolved => results.fold(
        0,
        (sum, result) => sum + result.totalQuestions,
      );

  int get totalCorrectAnswers => results.fold(
        0,
        (sum, result) => sum + result.correctAnswers,
      );

  int get totalWrongAnswers => results.fold(
        0,
        (sum, result) => sum + result.wrongAnswers,
      );

  double get averageScore {
    if (results.isEmpty) return 0;
    return results.fold(0, (sum, result) => sum + result.score) /
        results.length;
  }

  int get quizzesPassed =>
      results.where((result) => result.isPassed).length;

  int get quizzesFailed =>
      results.where((result) => !result.isPassed).length;

  double get passRate {
    if (results.isEmpty) return 0;
    return (quizzesPassed / results.length) * 100;
  }

  String get mostCommonGrade {
    if (results.isEmpty) return 'N/A';

    final grades = results.map((r) => r.grade).toList();
    final gradeCount = <String, int>{};

    for (final grade in grades) {
      gradeCount[grade] = (gradeCount[grade] ?? 0) + 1;
    }

    return gradeCount.entries
        .reduce((a, b) => a.value > b.value ? a : b)
        .key;
  }

  List<QuizResult> get recentResults {
    final sorted = List<QuizResult>.from(results)
      ..sort((a, b) => b.completedAt.compareTo(a.completedAt));
    return sorted.take(5).toList();
  }
}

