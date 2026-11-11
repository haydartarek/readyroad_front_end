import 'quiz_models.dart';

/// Local practice sessions are intentionally not presented as account-wide
/// metrics: the server persists answers, not these device-only session groups.
class QuizStatistics {
  final List<QuizResult> results;
  const QuizStatistics({required this.results});

  int get totalQuizzesTaken => results.length;
  int get totalQuestionsSolved =>
      results.fold(0, (sum, result) => sum + result.totalQuestions);
  int get totalCorrectAnswers =>
      results.fold(0, (sum, result) => sum + result.correctAnswers);
  int get totalWrongAnswers =>
      results.fold(0, (sum, result) => sum + result.wrongAnswers);
  double get averageScore => results.isEmpty
      ? 0
      : results.fold(0, (sum, result) => sum + result.score) / results.length;
  int get quizzesPassed => results.where((result) => result.isPassed).length;
  int get quizzesFailed => results.where((result) => !result.isPassed).length;
  double get passRate => results.isEmpty
      ? 0
      : quizzesPassed / results.length * 100;
  String get mostCommonGrade {
    if (results.isEmpty) return 'N/A';
    final counts = <String, int>{};
    for (final result in results) {
      counts[result.grade] = (counts[result.grade] ?? 0) + 1;
    }
    return counts.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
  }
  List<QuizResult> get recentResults {
    final sorted = List<QuizResult>.of(results)
      ..sort((a, b) => b.completedAt.compareTo(a.completedAt));
    return List.unmodifiable(sorted.take(5));
  }
}

/// Server-owned per-answer practice aggregates, from /progress/overall.
class ServerPracticeProgress {
  final int attempted;
  final int correct;
  final double accuracy;
  final int examsTaken;
  final int examsPassed;
  final int examsFailed;
  final double examPassRate;

  const ServerPracticeProgress({
    required this.attempted,
    required this.correct,
    required this.accuracy,
    required this.examsTaken,
    required this.examsPassed,
    required this.examsFailed,
    required this.examPassRate,
  });

  int get wrong => attempted - correct;

  factory ServerPracticeProgress.fromJson(Map<String, dynamic> data) {
    final attempted = _intField(data, 'totalAttempted');
    final correct = _intField(data, 'totalCorrect');
    final examsTaken = _intField(data, 'totalExamsTaken');
    final passed = _intField(data, 'passedExams');
    final failed = _intField(data, 'failedExams');
    final accuracy = _percentField(data, 'overallAccuracy');
    final rate = _percentField(data, 'passRate');
    if (correct > attempted || passed + failed > examsTaken) {
      throw const FormatException('Invalid statistics totals from server');
    }
    return ServerPracticeProgress(
      attempted: attempted,
      correct: correct,
      accuracy: accuracy,
      examsTaken: examsTaken,
      examsPassed: passed,
      examsFailed: failed,
      examPassRate: rate,
    );
  }
}

/// A completed theory exam, as reported by the server exam history endpoint.
class ServerTheoryExam {
  final int examId;
  final int totalQuestions;
  final int correctAnswers;
  final bool passed;
  final DateTime completedAt;

  const ServerTheoryExam({
    required this.examId,
    required this.totalQuestions,
    required this.correctAnswers,
    required this.passed,
    required this.completedAt,
  });

  double get score => totalQuestions <= 0
      ? 0
      : correctAnswers * 100 / totalQuestions;

  static List<ServerTheoryExam> completedFromHistory(
    Map<String, dynamic> response,
  ) {
    final raw = response['exams'];
    if (raw is! List) {
      throw const FormatException('Missing exam history list');
    }
    final completed = <ServerTheoryExam>[];
    for (final item in raw) {
      if (item is! Map) {
        throw const FormatException('Invalid exam history entry');
      }
      final json = Map<String, dynamic>.from(item);
      if (json['status']?.toString() != 'COMPLETED') continue;
      final examId = _intField(json, 'examId');
      final total = _intField(json, 'totalQuestions');
      final correct = _intField(json, 'correctAnswers');
      final passed = json['passed'];
      final completedAt = DateTime.tryParse(json['completedAt']?.toString() ?? '');
      if (examId <= 0 || total <= 0 || correct > total ||
          passed is! bool || completedAt == null) {
        throw const FormatException('Invalid completed exam data');
      }
      completed.add(ServerTheoryExam(
        examId: examId,
        totalQuestions: total,
        correctAnswers: correct,
        passed: passed,
        completedAt: completedAt,
      ));
    }
    completed.sort((a, b) => b.completedAt.compareTo(a.completedAt));
    return List.unmodifiable(completed);
  }
}

int _intField(Map<String, dynamic> data, String key) {
  final raw = data[key];
  final value = raw is int
      ? raw
      : raw is num && raw.isFinite && raw == raw.roundToDouble()
          ? raw.toInt()
          : int.tryParse(raw?.toString() ?? '');
  if (value == null || value < 0) {
    throw FormatException('Missing or invalid $key');
  }
  return value;
}

double _percentField(Map<String, dynamic> data, String key) {
  final raw = data[key];
  final value = raw is num
      ? raw.toDouble()
      : double.tryParse(raw?.toString() ?? '');
  if (value == null || !value.isFinite || value < 0 || value > 100) {
    throw FormatException('Missing or invalid $key');
  }
  return value;
}
