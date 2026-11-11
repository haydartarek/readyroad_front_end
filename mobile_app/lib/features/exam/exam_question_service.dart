import '../../core/constants/api_constants.dart';
import '../../core/network/authenticated_api_client.dart';

/// Typed representation of the backend exam-results contract.
class ExamResults {
  final int? examId;
  final int? userId;
  final DateTime? completedAt;
  final int? totalQuestions;
  final int? correctAnswers;
  final int? wrongAnswers;
  final double? scorePercentage;
  final bool passed;
  final int? passingScore;
  final int? timeTakenSeconds;
  final int? averageTimePerQuestion;
  final int? durationMinutes;
  final int? answeredCount;
  final int? unansweredCount;
  final String? resultStatus;
  final int? passingThreshold;
  final int? pointsToPass;
  final List<String> weakCategories;
  final String? recommendedAction;
  final List<ExamCategoryBreakdown> categoryBreakdown;
  final List<ExamAnswerReview> answers;

  const ExamResults({
    this.examId,
    this.userId,
    this.completedAt,
    this.totalQuestions,
    this.correctAnswers,
    this.wrongAnswers,
    this.scorePercentage,
    this.passed = false,
    this.passingScore,
    this.timeTakenSeconds,
    this.averageTimePerQuestion,
    this.durationMinutes,
    this.answeredCount,
    this.unansweredCount,
    this.resultStatus,
    this.passingThreshold,
    this.pointsToPass,
    this.weakCategories = const [],
    this.recommendedAction,
    this.categoryBreakdown = const [],
    this.answers = const [],
  });

  factory ExamResults.fromJson(Map<String, dynamic> json) {
    final allAnswers = _mapList(json['allAnswers']);
    final fallbackAnswers = allAnswers.isEmpty
        ? _mapList(json['incorrectQuestions'])
        : allAnswers;
    return ExamResults(
      examId: _intValue(json['examId']),
      userId: _intValue(json['userId']),
      completedAt: _dateValue(json['completedAt']),
      totalQuestions: _intValue(json['totalQuestions']),
      correctAnswers: _intValue(json['correctAnswers']),
      wrongAnswers: _intValue(json['wrongAnswers']),
      scorePercentage: _doubleValue(json['scorePercentage']),
      passed: _boolValue(json['passed']),
      passingScore: _intValue(json['passingScore']),
      timeTakenSeconds: _intValue(json['timeTakenSeconds']),
      averageTimePerQuestion: _intValue(json['averageTimePerQuestion']),
      durationMinutes: _intValue(json['durationMinutes']),
      answeredCount: _intValue(json['answeredCount']),
      unansweredCount: _intValue(json['unansweredCount'] ?? json['unanswered']),
      resultStatus: json['resultStatus']?.toString(),
      passingThreshold: _intValue(json['passingThreshold']),
      pointsToPass: _intValue(json['pointsToPass']),
      weakCategories: _stringList(json['weakCategories']),
      recommendedAction: json['recommendedAction']?.toString(),
      categoryBreakdown: _mapList(
        json['categoryBreakdown'],
      ).map(ExamCategoryBreakdown.fromJson).toList(),
      answers: fallbackAnswers.map(ExamAnswerReview.fromJson).toList(),
    );
  }

  /// Adapt the two sign-result DTOs to the same answer-review presentation.
  factory ExamResults.fromSignResult(Map<String, dynamic> json) {
    final questions = _firstNonEmptyMapList([
      json['questions'],
      json['questionResults'],
      json['allAnswers'],
      json['incorrectQuestions'],
    ]);
    final total = _intValue(json['totalQuestions'] ?? json['totalLinked']);
    final correct = _intValue(json['correctAnswers']);
    final threshold = _intValue(json['passingThreshold']);
    return ExamResults.fromJson({
      ...json,
      'totalQuestions': total,
      'unansweredCount': json['unansweredCount'] ?? json['unanswered'],
      if (threshold != null && correct != null)
        'pointsToPass': (threshold - correct).clamp(0, threshold),
      'allAnswers': questions
          .map(
            (question) => {
              'questionId': question['questionId'],
              'selectedOptionId':
                  question['selectedChoiceId'] ?? question['selectedOptionId'],
              'userAnswerOptionId':
                  question['selectedChoiceId'] ??
                  question['selectedOptionId'] ??
                  question['userAnswerOptionId'],
              'correctOptionId':
                  question['correctChoiceId'] ?? question['correctOptionId'],
              'correctAnswerOptionId':
                  question['correctChoiceId'] ??
                  question['correctOptionId'] ??
                  question['correctAnswerOptionId'],
              'isCorrect': question['isCorrect'],
              'wasTimeout':
                  question['wasTimeout'] ?? (question['answered'] == false),
              'contentImageUrl':
                  question['signImagePath'] ?? json['signImagePath'],
              'categoryCode': question['signCode'] ?? json['signCode'],
              'difficulty': question['difficulty'],
              for (final language in ['En', 'Nl', 'Fr', 'Ar']) ...{
                'questionText$language': _firstNonBlankValues([
                  question['question$language'],
                  question['questionText$language'],
                  question['question'],
                ]),
                'selectedOptionText$language': _firstNonBlank(
                  question['selectedChoice$language'],
                  question['selectedText$language'],
                ),
                'correctOptionText$language': _firstNonBlank(
                  question['correctChoice$language'],
                  question['correctText$language'],
                ),
                'explanation$language': _firstNonBlank(
                  question['explanation$language'],
                  question['explanation'],
                ),
              },
            },
          )
          .toList(),
    });
  }

  Map<String, dynamic> toJson() => {
    if (examId != null) 'examId': examId,
    if (userId != null) 'userId': userId,
    if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
    if (totalQuestions != null) 'totalQuestions': totalQuestions,
    if (correctAnswers != null) 'correctAnswers': correctAnswers,
    if (wrongAnswers != null) 'wrongAnswers': wrongAnswers,
    if (scorePercentage != null) 'scorePercentage': scorePercentage,
    'passed': passed,
    if (passingScore != null) 'passingScore': passingScore,
    if (timeTakenSeconds != null) 'timeTakenSeconds': timeTakenSeconds,
    if (averageTimePerQuestion != null)
      'averageTimePerQuestion': averageTimePerQuestion,
    if (durationMinutes != null) 'durationMinutes': durationMinutes,
    if (answeredCount != null) 'answeredCount': answeredCount,
    if (unansweredCount != null) 'unansweredCount': unansweredCount,
    if (resultStatus != null) 'resultStatus': resultStatus,
    if (passingThreshold != null) 'passingThreshold': passingThreshold,
    if (pointsToPass != null) 'pointsToPass': pointsToPass,
    'weakCategories': weakCategories,
    if (recommendedAction != null) 'recommendedAction': recommendedAction,
    'categoryBreakdown': categoryBreakdown
        .map((item) => item.toJson())
        .toList(),
    'allAnswers': answers.map((item) => item.toJson()).toList(),
  };
}

class ExamCategoryBreakdown {
  final String? categoryId;
  final String? categoryNameEn;
  final String? categoryNameNl;
  final String? categoryNameFr;
  final String? categoryNameAr;
  final int? totalQuestions;
  final int? correctAnswers;
  final int? wrongAnswers;
  final double? accuracyPercentage;
  final String? categoryCode;
  final String? performanceLevel;
  final bool isWeakArea;

  const ExamCategoryBreakdown({
    this.categoryId,
    this.categoryNameEn,
    this.categoryNameNl,
    this.categoryNameFr,
    this.categoryNameAr,
    this.totalQuestions,
    this.correctAnswers,
    this.wrongAnswers,
    this.accuracyPercentage,
    this.categoryCode,
    this.performanceLevel,
    this.isWeakArea = false,
  });

  factory ExamCategoryBreakdown.fromJson(Map<String, dynamic> json) =>
      ExamCategoryBreakdown(
        categoryId: json['categoryId']?.toString(),
        categoryNameEn: json['categoryNameEn']?.toString(),
        categoryNameNl: json['categoryNameNl']?.toString(),
        categoryNameFr: json['categoryNameFr']?.toString(),
        categoryNameAr: json['categoryNameAr']?.toString(),
        totalQuestions: _intValue(json['totalQuestions']),
        correctAnswers: _intValue(json['correctAnswers']),
        wrongAnswers: _intValue(json['wrongAnswers']),
        accuracyPercentage: _doubleValue(json['accuracyPercentage']),
        categoryCode: json['categoryCode']?.toString(),
        performanceLevel: json['performanceLevel']?.toString(),
        isWeakArea: _boolValue(json['isWeakArea']),
      );

  Map<String, dynamic> toJson() => {
    if (categoryId != null) 'categoryId': categoryId,
    if (categoryNameEn != null) 'categoryNameEn': categoryNameEn,
    if (categoryNameNl != null) 'categoryNameNl': categoryNameNl,
    if (categoryNameFr != null) 'categoryNameFr': categoryNameFr,
    if (categoryNameAr != null) 'categoryNameAr': categoryNameAr,
    if (totalQuestions != null) 'totalQuestions': totalQuestions,
    if (correctAnswers != null) 'correctAnswers': correctAnswers,
    if (wrongAnswers != null) 'wrongAnswers': wrongAnswers,
    if (accuracyPercentage != null) 'accuracyPercentage': accuracyPercentage,
    if (categoryCode != null) 'categoryCode': categoryCode,
    if (performanceLevel != null) 'performanceLevel': performanceLevel,
    'isWeakArea': isWeakArea,
  };

  String? localizedName(String language) {
    final requested = switch (language) {
      'ar' => categoryNameAr,
      'nl' => categoryNameNl,
      'fr' => categoryNameFr,
      _ => categoryNameEn,
    };
    for (final value in [
      requested,
      categoryNameEn,
      categoryNameNl,
      categoryNameFr,
      categoryNameAr,
    ]) {
      if (value != null && value.trim().isNotEmpty) return value.trim();
    }
    return null;
  }
}

class ExamAnswerReview {
  final int? questionId;
  final String? questionText;
  final String? questionTextEn;
  final String? questionTextNl;
  final String? questionTextFr;
  final String? questionTextAr;
  final int? selectedOptionId;
  final int? userAnswerOptionId;
  final String? selectedOptionText;
  final String? selectedOptionTextEn;
  final String? selectedOptionTextNl;
  final String? selectedOptionTextFr;
  final String? selectedOptionTextAr;
  final int? correctOptionId;
  final int? correctAnswerOptionId;
  final String? correctOptionText;
  final String? correctOptionTextEn;
  final String? correctOptionTextNl;
  final String? correctOptionTextFr;
  final String? correctOptionTextAr;
  final String? explanationEn;
  final String? explanationNl;
  final String? explanationFr;
  final String? explanationAr;
  final String? explanation;
  final String? categoryName;
  final String? categoryNameEn;
  final String? categoryNameNl;
  final String? categoryNameFr;
  final String? categoryNameAr;
  final String? categoryCode;
  final String? contentImageUrl;
  final bool isCorrect;
  final bool wasTimeout;
  final String? difficulty;
  final String? typicalErrorType;

  const ExamAnswerReview({
    this.questionId,
    this.questionText,
    this.questionTextEn,
    this.questionTextNl,
    this.questionTextFr,
    this.questionTextAr,
    this.selectedOptionId,
    this.userAnswerOptionId,
    this.selectedOptionText,
    this.selectedOptionTextEn,
    this.selectedOptionTextNl,
    this.selectedOptionTextFr,
    this.selectedOptionTextAr,
    this.correctOptionId,
    this.correctAnswerOptionId,
    this.correctOptionText,
    this.correctOptionTextEn,
    this.correctOptionTextNl,
    this.correctOptionTextFr,
    this.correctOptionTextAr,
    this.explanationEn,
    this.explanationNl,
    this.explanationFr,
    this.explanationAr,
    this.explanation,
    this.categoryName,
    this.categoryNameEn,
    this.categoryNameNl,
    this.categoryNameFr,
    this.categoryNameAr,
    this.categoryCode,
    this.contentImageUrl,
    this.isCorrect = false,
    this.wasTimeout = false,
    this.difficulty,
    this.typicalErrorType,
  });

  factory ExamAnswerReview.fromJson(Map<String, dynamic> json) =>
      ExamAnswerReview(
        questionId: _intValue(json['questionId']),
        questionText: json['questionText']?.toString(),
        questionTextEn: json['questionTextEn']?.toString(),
        questionTextNl: json['questionTextNl']?.toString(),
        questionTextFr: json['questionTextFr']?.toString(),
        questionTextAr: json['questionTextAr']?.toString(),
        selectedOptionId: _intValue(json['selectedOptionId']),
        userAnswerOptionId: _intValue(json['userAnswerOptionId']),
        selectedOptionText: json['selectedOptionText']?.toString(),
        selectedOptionTextEn: json['selectedOptionTextEn']?.toString(),
        selectedOptionTextNl: json['selectedOptionTextNl']?.toString(),
        selectedOptionTextFr: json['selectedOptionTextFr']?.toString(),
        selectedOptionTextAr: json['selectedOptionTextAr']?.toString(),
        correctOptionId: _intValue(json['correctOptionId']),
        correctAnswerOptionId: _intValue(json['correctAnswerOptionId']),
        correctOptionText: json['correctOptionText']?.toString(),
        correctOptionTextEn: json['correctOptionTextEn']?.toString(),
        correctOptionTextNl: json['correctOptionTextNl']?.toString(),
        correctOptionTextFr: json['correctOptionTextFr']?.toString(),
        correctOptionTextAr: json['correctOptionTextAr']?.toString(),
        explanationEn: json['explanationEn']?.toString(),
        explanationNl: json['explanationNl']?.toString(),
        explanationFr: json['explanationFr']?.toString(),
        explanationAr: json['explanationAr']?.toString(),
        explanation: json['explanation']?.toString(),
        categoryName: json['categoryName']?.toString(),
        categoryNameEn: json['categoryNameEn']?.toString(),
        categoryNameNl: json['categoryNameNl']?.toString(),
        categoryNameFr: json['categoryNameFr']?.toString(),
        categoryNameAr: json['categoryNameAr']?.toString(),
        categoryCode: json['categoryCode']?.toString(),
        contentImageUrl: json['contentImageUrl']?.toString(),
        isCorrect: _boolValue(json['isCorrect']),
        wasTimeout: _boolValue(json['wasTimeout']),
        difficulty: json['difficulty']?.toString(),
        typicalErrorType: json['typicalErrorType']?.toString(),
      );

  Map<String, dynamic> toJson() => {
    if (questionId != null) 'questionId': questionId,
    if (questionText != null) 'questionText': questionText,
    if (questionTextEn != null) 'questionTextEn': questionTextEn,
    if (questionTextNl != null) 'questionTextNl': questionTextNl,
    if (questionTextFr != null) 'questionTextFr': questionTextFr,
    if (questionTextAr != null) 'questionTextAr': questionTextAr,
    if (selectedOptionId != null) 'selectedOptionId': selectedOptionId,
    if (userAnswerOptionId != null) 'userAnswerOptionId': userAnswerOptionId,
    if (selectedOptionText != null) 'selectedOptionText': selectedOptionText,
    if (selectedOptionTextEn != null)
      'selectedOptionTextEn': selectedOptionTextEn,
    if (selectedOptionTextNl != null)
      'selectedOptionTextNl': selectedOptionTextNl,
    if (selectedOptionTextFr != null)
      'selectedOptionTextFr': selectedOptionTextFr,
    if (selectedOptionTextAr != null)
      'selectedOptionTextAr': selectedOptionTextAr,
    if (correctOptionId != null) 'correctOptionId': correctOptionId,
    if (correctAnswerOptionId != null)
      'correctAnswerOptionId': correctAnswerOptionId,
    if (correctOptionText != null) 'correctOptionText': correctOptionText,
    if (correctOptionTextEn != null) 'correctOptionTextEn': correctOptionTextEn,
    if (correctOptionTextNl != null) 'correctOptionTextNl': correctOptionTextNl,
    if (correctOptionTextFr != null) 'correctOptionTextFr': correctOptionTextFr,
    if (correctOptionTextAr != null) 'correctOptionTextAr': correctOptionTextAr,
    if (explanationEn != null) 'explanationEn': explanationEn,
    if (explanationNl != null) 'explanationNl': explanationNl,
    if (explanationFr != null) 'explanationFr': explanationFr,
    if (explanationAr != null) 'explanationAr': explanationAr,
    if (explanation != null) 'explanation': explanation,
    if (categoryName != null) 'categoryName': categoryName,
    if (categoryNameEn != null) 'categoryNameEn': categoryNameEn,
    if (categoryNameNl != null) 'categoryNameNl': categoryNameNl,
    if (categoryNameFr != null) 'categoryNameFr': categoryNameFr,
    if (categoryNameAr != null) 'categoryNameAr': categoryNameAr,
    if (categoryCode != null) 'categoryCode': categoryCode,
    if (contentImageUrl != null) 'contentImageUrl': contentImageUrl,
    'isCorrect': isCorrect,
    'wasTimeout': wasTimeout,
    if (difficulty != null) 'difficulty': difficulty,
    if (typicalErrorType != null) 'typicalErrorType': typicalErrorType,
  };

  String? localized(String prefix, String language) {
    final requestedSuffix = switch (language) {
      'ar' => 'Ar',
      'nl' => 'Nl',
      'fr' => 'Fr',
      _ => 'En',
    };
    final values = toJson();
    for (final suffix in <String>[requestedSuffix, 'En', 'Nl', 'Fr', 'Ar']) {
      final localized = values['$prefix$suffix']?.toString();
      if (localized != null && localized.trim().isNotEmpty) {
        return localized.trim();
      }
    }
    final fallback = values[prefix]?.toString();
    return fallback == null || fallback.trim().isEmpty ? null : fallback.trim();
  }
}

class ExamHistoryResponse {
  final int totalExams;
  final List<ExamHistoryItem> exams;

  const ExamHistoryResponse({required this.totalExams, required this.exams});

  factory ExamHistoryResponse.fromJson(Map<String, dynamic> json) {
    final exams = _mapList(
      json['exams'],
    ).map(ExamHistoryItem.fromJson).toList();
    return ExamHistoryResponse(
      totalExams: _intValue(json['totalExams']) ?? exams.length,
      exams: exams,
    );
  }

  Map<String, dynamic> toJson() => {
    'totalExams': totalExams,
    'exams': exams.map((exam) => exam.toJson()).toList(),
  };
}

class ExamHistoryItem {
  final int? examId;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final String? status;
  final double? scorePercentage;
  final int? totalQuestions;
  final int? correctAnswers;
  final bool passed;

  const ExamHistoryItem({
    this.examId,
    this.startedAt,
    this.completedAt,
    this.status,
    this.scorePercentage,
    this.totalQuestions,
    this.correctAnswers,
    this.passed = false,
  });

  factory ExamHistoryItem.fromJson(Map<String, dynamic> json) =>
      ExamHistoryItem(
        examId: _intValue(json['examId']),
        startedAt: _dateValue(json['startedAt']),
        completedAt: _dateValue(json['completedAt']),
        status: json['status']?.toString(),
        scorePercentage: _doubleValue(json['scorePercentage']),
        totalQuestions: _intValue(json['totalQuestions']),
        correctAnswers: _intValue(json['correctAnswers']),
        passed: _boolValue(json['passed']),
      );

  Map<String, dynamic> toJson() => {
    if (examId != null) 'examId': examId,
    if (startedAt != null) 'startedAt': startedAt!.toIso8601String(),
    if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
    if (status != null) 'status': status,
    if (scorePercentage != null) 'scorePercentage': scorePercentage,
    if (totalQuestions != null) 'totalQuestions': totalQuestions,
    if (correctAnswers != null) 'correctAnswers': correctAnswers,
    'passed': passed,
  };
}

int? _intValue(Object? value) {
  if (value is num) return value.toInt();
  final parsed = int.tryParse(value?.toString() ?? '');
  return parsed;
}

double? _doubleValue(Object? value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '');
}

bool _boolValue(Object? value) => value == true || value == 'true';

DateTime? _dateValue(Object? value) =>
    DateTime.tryParse(value?.toString() ?? '');

List<Map<String, dynamic>> _mapList(Object? value) {
  if (value is! List) return const [];
  return value
      .whereType<Map>()
      .map((item) => Map<String, dynamic>.from(item))
      .toList();
}

List<Map<String, dynamic>> _firstNonEmptyMapList(Iterable<Object?> values) {
  for (final value in values) {
    final mapped = _mapList(value);
    if (mapped.isNotEmpty) return mapped;
  }
  return const [];
}

List<String> _stringList(Object? value) {
  if (value is! List) return const [];
  return value
      .map((item) => item.toString())
      .where((item) => item.trim().isNotEmpty)
      .toList();
}

String? _firstNonBlank(Object? first, Object? second) {
  return _firstNonBlankValues([first, second]);
}

String? _firstNonBlankValues(Iterable<Object?> values) {
  for (final value in values) {
    final text = value?.toString().trim();
    if (text != null && text.isNotEmpty) return text;
  }
  return null;
}

String formatExamDuration(int seconds) {
  final safeSeconds = seconds < 0 ? 0 : seconds;
  final hours = safeSeconds ~/ 3600;
  final minutes = (safeSeconds % 3600) ~/ 60;
  final remainingSeconds = safeSeconds % 60;
  if (hours > 0) {
    return '${hours.toString().padLeft(2, '0')}:'
        '${minutes.toString().padLeft(2, '0')}:'
        '${remainingSeconds.toString().padLeft(2, '0')}';
  }
  return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
}

/// Client for the persistent theory-exam workflow used by web_app.
/// The backend owns question selection, access mode, correctness, and scoring.
class ExamQuestionService {
  final AuthenticatedApiClient _apiClient;

  ExamQuestionService(this._apiClient);

  Future<Map<String, dynamic>> getActiveExam() async {
    final response = await _apiClient.get(
      '${ApiConstants.apiVersion}/exams/simulations/active',
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to load active exam');
    }
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> startExam() async {
    final response = await _apiClient.post(
      '${ApiConstants.apiVersion}/exams/simulations/start',
    );
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('Failed to start exam');
    }
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> submitAnswer({
    required int examId,
    required int questionId,
    required int selectedOptionId,
    int? timeTakenSeconds,
  }) async {
    final response = await _apiClient.post(
      '${ApiConstants.apiVersion}/exams/simulations/$examId/questions/$questionId/answer',
      data: {
        'selectedOptionId': selectedOptionId,
        'timeTakenSeconds': ?timeTakenSeconds,
      },
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to submit answer');
    }
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> recordPresented(int examId, int questionId) async {
    await _apiClient.post(
      '${ApiConstants.apiVersion}/exams/simulations/$examId/questions/$questionId/presented',
    );
  }

  Future<void> recordTimeout(int examId, int questionId) async {
    await _apiClient.post(
      '${ApiConstants.apiVersion}/exams/simulations/$examId/questions/$questionId/timeout',
    );
  }

  Future<void> completeExam(int examId) async {
    final response = await _apiClient.post(
      '${ApiConstants.apiVersion}/exams/simulations/$examId/submit',
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to submit exam');
    }
  }

  Future<ExamResults> getResults(int examId) async {
    final response = await _apiClient.get(
      '${ApiConstants.apiVersion}/exams/simulations/$examId/results',
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to load exam results');
    }
    return ExamResults.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<ExamHistoryResponse> getHistory() async {
    final response = await _apiClient.get(
      '${ApiConstants.apiVersion}/exams/simulations/history',
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to load exam history');
    }
    return ExamHistoryResponse.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<void> abandonExam(int examId) async {
    await _apiClient.post(
      '${ApiConstants.apiVersion}/exams/simulations/$examId/abandon',
    );
  }
}
