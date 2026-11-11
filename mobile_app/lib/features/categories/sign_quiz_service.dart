import '../../core/network/authenticated_api_client.dart';

class SignChoice {
  final int id;
  final String textNl;
  final String textEn;
  final String textFr;
  final String textAr;

  const SignChoice({
    required this.id,
    required this.textNl,
    required this.textEn,
    required this.textFr,
    required this.textAr,
  });

  factory SignChoice.fromJson(Map<String, dynamic> json) => SignChoice(
    id: _asInt(json['id']),
    textNl: _asString(json['textNl']),
    textEn: _asString(json['textEn']),
    textFr: _asString(json['textFr']),
    textAr: _asString(json['textAr']),
  );

  String textFor(String language) =>
      _localized(language, ar: textAr, en: textEn, nl: textNl, fr: textFr);
}

class SignQuizQuestion {
  final int id;
  final String questionEn;
  final String questionAr;
  final String questionFr;
  final String questionNl;
  final String? signImagePath;
  final String difficulty;
  final String? signCode;
  final List<SignChoice> choices;

  const SignQuizQuestion({
    required this.id,
    required this.questionEn,
    required this.questionAr,
    required this.questionFr,
    required this.questionNl,
    required this.signImagePath,
    required this.difficulty,
    required this.signCode,
    required this.choices,
  });

  factory SignQuizQuestion.fromJson(Map<String, dynamic> json) =>
      SignQuizQuestion(
        id: _asInt(json['id']),
        questionEn: _asString(json['questionEn']),
        questionAr: _asString(json['questionAr']),
        questionFr: _asString(json['questionFr']),
        questionNl: _asString(json['questionNl']),
        signImagePath: _asNullableString(json['signImagePath']),
        difficulty: _asString(json['difficulty']).isEmpty
            ? 'MEDIUM'
            : _asString(json['difficulty']),
        signCode: _asNullableString(json['signCode']),
        choices: _asMapList(json['choices']).map(SignChoice.fromJson).toList(),
      );

  String questionFor(String language) => _localized(
    language,
    ar: questionAr,
    en: questionEn,
    nl: questionNl,
    fr: questionFr,
  );
}

class SignPracticeSession {
  final int sessionId;
  final String status;
  final List<SignQuizQuestion> questions;
  final int totalQuestions;
  final int correctCount;

  const SignPracticeSession({
    required this.sessionId,
    required this.status,
    required this.questions,
    this.totalQuestions = 0,
    this.correctCount = 0,
  });

  factory SignPracticeSession.fromJson(Map<String, dynamic> json) =>
      SignPracticeSession(
        sessionId: _asInt(json['sessionId']),
        status: _asString(json['status']),
        questions: _asMapList(
          json['questions'],
        ).map(SignQuizQuestion.fromJson).toList(),
        totalQuestions: _asInt(json['totalQuestions']),
        correctCount: _asInt(json['correctCount']),
      );
}

class SignExamSession {
  final String signCode;
  final int examNumber;
  final int passingScore;
  final List<SignQuizQuestion> questions;

  const SignExamSession({
    required this.signCode,
    required this.examNumber,
    required this.passingScore,
    required this.questions,
  });

  factory SignExamSession.fromJson(Map<String, dynamic> json) =>
      SignExamSession(
        signCode: _asString(json['signCode']),
        examNumber: _asInt(json['examNumber'], fallback: 1),
        passingScore: _asInt(json['passingScore']),
        questions: _asMapList(
          json['questions'],
        ).map(SignQuizQuestion.fromJson).toList(),
      );
}

class SignPracticeFeedback {
  final bool isCorrect;
  final int questionsAnswered;
  final int totalQuestions;
  final bool sessionCompleted;
  final String explanationEn;
  final String explanationAr;
  final String explanationFr;
  final String explanationNl;
  final int? selectedChoiceId;
  final int? correctChoiceId;
  final String selectedTextEn;
  final String selectedTextAr;
  final String selectedTextNl;
  final String selectedTextFr;
  final String correctTextEn;
  final String correctTextAr;
  final String correctTextNl;
  final String correctTextFr;
  final int? signTotalAttempts;
  final double? signAccuracyPercentage;

  const SignPracticeFeedback({
    required this.isCorrect,
    required this.questionsAnswered,
    required this.totalQuestions,
    required this.sessionCompleted,
    required this.explanationEn,
    required this.explanationAr,
    required this.explanationFr,
    required this.explanationNl,
    this.selectedChoiceId,
    this.correctChoiceId,
    this.selectedTextEn = '',
    this.selectedTextAr = '',
    this.selectedTextNl = '',
    this.selectedTextFr = '',
    this.correctTextEn = '',
    this.correctTextAr = '',
    this.correctTextNl = '',
    this.correctTextFr = '',
    this.signTotalAttempts,
    this.signAccuracyPercentage,
  });

  factory SignPracticeFeedback.fromJson(Map<String, dynamic> json) =>
      SignPracticeFeedback(
        isCorrect: json['isCorrect'] == true,
        questionsAnswered: _asInt(json['questionsAnswered']),
        totalQuestions: _asInt(json['totalQuestions']),
        sessionCompleted: json['sessionCompleted'] == true,
        explanationEn: _asString(json['explanationEn']),
        explanationAr: _asString(json['explanationAr']),
        explanationFr: _asString(json['explanationFr']),
        explanationNl: _asString(json['explanationNl']),
        selectedChoiceId: _asNullableInt(json['selectedChoiceId']),
        correctChoiceId: _asNullableInt(json['correctChoiceId']),
        selectedTextEn: _asString(json['selectedTextEn']),
        selectedTextAr: _asString(json['selectedTextAr']),
        selectedTextNl: _asString(json['selectedTextNl']),
        selectedTextFr: _asString(json['selectedTextFr']),
        correctTextEn: _asString(json['correctTextEn']),
        correctTextAr: _asString(json['correctTextAr']),
        correctTextNl: _asString(json['correctTextNl']),
        correctTextFr: _asString(json['correctTextFr']),
        signTotalAttempts: _asNullableInt(json['signTotalAttempts']),
        signAccuracyPercentage: _asNullableDouble(
          json['signAccuracyPercentage'],
        ),
      );

  String explanationFor(String language) => _localized(
    language,
    ar: explanationAr,
    en: explanationEn,
    nl: explanationNl,
    fr: explanationFr,
  );

  String selectedTextFor(String language) => _localized(
    language,
    ar: selectedTextAr,
    en: selectedTextEn,
    nl: selectedTextNl,
    fr: selectedTextFr,
  );

  String correctTextFor(String language) => _localized(
    language,
    ar: correctTextAr,
    en: correctTextEn,
    nl: correctTextNl,
    fr: correctTextFr,
  );
}

class SignPracticeResultQuestion {
  final int questionId;
  final String questionEn;
  final String questionAr;
  final String questionNl;
  final String questionFr;
  final String difficulty;
  final String? signImagePath;
  final bool isCorrect;
  final int? selectedChoiceId;
  final int? correctChoiceId;
  final String selectedTextEn;
  final String selectedTextAr;
  final String selectedTextNl;
  final String selectedTextFr;
  final String correctTextEn;
  final String correctTextAr;
  final String correctTextNl;
  final String correctTextFr;
  final String explanationEn;
  final String explanationAr;
  final String explanationNl;
  final String explanationFr;

  const SignPracticeResultQuestion({
    required this.questionId,
    required this.questionEn,
    required this.questionAr,
    required this.questionNl,
    required this.questionFr,
    required this.difficulty,
    required this.signImagePath,
    required this.isCorrect,
    required this.selectedChoiceId,
    required this.correctChoiceId,
    required this.selectedTextEn,
    required this.selectedTextAr,
    required this.selectedTextNl,
    required this.selectedTextFr,
    required this.correctTextEn,
    required this.correctTextAr,
    required this.correctTextNl,
    required this.correctTextFr,
    required this.explanationEn,
    required this.explanationAr,
    required this.explanationNl,
    required this.explanationFr,
  });

  factory SignPracticeResultQuestion.fromJson(Map<String, dynamic> json) =>
      SignPracticeResultQuestion(
        questionId: _asInt(json['questionId']),
        questionEn: _asString(json['questionEn']),
        questionAr: _asString(json['questionAr']),
        questionNl: _asString(json['questionNl']),
        questionFr: _asString(json['questionFr']),
        difficulty: _asString(json['difficulty']),
        signImagePath: _asNullableString(json['signImagePath']),
        isCorrect: json['isCorrect'] == true,
        selectedChoiceId: _asNullableInt(json['selectedChoiceId']),
        correctChoiceId: _asNullableInt(json['correctChoiceId']),
        selectedTextEn: _asString(json['selectedTextEn']),
        selectedTextAr: _asString(json['selectedTextAr']),
        selectedTextNl: _asString(json['selectedTextNl']),
        selectedTextFr: _asString(json['selectedTextFr']),
        correctTextEn: _asString(json['correctTextEn']),
        correctTextAr: _asString(json['correctTextAr']),
        correctTextNl: _asString(json['correctTextNl']),
        correctTextFr: _asString(json['correctTextFr']),
        explanationEn: _asString(json['explanationEn']),
        explanationAr: _asString(json['explanationAr']),
        explanationNl: _asString(json['explanationNl']),
        explanationFr: _asString(json['explanationFr']),
      );

  String questionFor(String language) => _localized(
    language,
    ar: questionAr,
    en: questionEn,
    nl: questionNl,
    fr: questionFr,
  );

  String selectedTextFor(String language) => _localized(
    language,
    ar: selectedTextAr,
    en: selectedTextEn,
    nl: selectedTextNl,
    fr: selectedTextFr,
  );

  String correctTextFor(String language) => _localized(
    language,
    ar: correctTextAr,
    en: correctTextEn,
    nl: correctTextNl,
    fr: correctTextFr,
  );

  String explanationFor(String language) => _localized(
    language,
    ar: explanationAr,
    en: explanationEn,
    nl: explanationNl,
    fr: explanationFr,
  );
}

class SignPracticeResult {
  final int sessionId;
  final String status;
  final int totalQuestions;
  final int correctAnswers;
  final int wrongAnswers;
  final double scorePercentage;
  final bool passed;
  final List<SignPracticeResultQuestion> questions;

  const SignPracticeResult({
    required this.sessionId,
    required this.status,
    required this.totalQuestions,
    required this.correctAnswers,
    required this.wrongAnswers,
    required this.scorePercentage,
    required this.passed,
    required this.questions,
  });

  factory SignPracticeResult.fromJson(Map<String, dynamic> json) =>
      SignPracticeResult(
        sessionId: _asInt(json['sessionId']),
        status: _asString(json['status']),
        totalQuestions: _asInt(json['totalQuestions']),
        correctAnswers: _asInt(json['correctAnswers']),
        wrongAnswers: _asInt(json['wrongAnswers']),
        scorePercentage: _asDouble(json['scorePercentage']),
        passed: json['passed'] == true,
        questions: _asMapList(
          json['questionResults'],
        ).map(SignPracticeResultQuestion.fromJson).toList(),
      );
}

class SignPracticeProgress {
  final String signCode;
  final String routeCode;
  final SignCategoryCode category;
  final String imagePath;
  final String nameNl;
  final String nameEn;
  final String nameFr;
  final String nameAr;
  final bool practiceStarted;
  final bool practiceCompleted;
  final double? practiceBestScorePct;
  final bool exam1Attempted;
  final bool exam1Passed;

  const SignPracticeProgress({
    required this.signCode,
    required this.routeCode,
    required this.category,
    required this.imagePath,
    required this.nameNl,
    required this.nameEn,
    required this.nameFr,
    required this.nameAr,
    required this.practiceStarted,
    required this.practiceCompleted,
    required this.practiceBestScorePct,
    required this.exam1Attempted,
    required this.exam1Passed,
  });

  factory SignPracticeProgress.fromJson(Map<String, dynamic> json) =>
      SignPracticeProgress(
        signCode: _asString(json['signCode']),
        routeCode: _asString(json['routeCode']),
        category: SignCategoryCode.fromValue(json['category']),
        imagePath: _asString(json['imagePath']),
        nameNl: _asString(json['nameNl']),
        nameEn: _asString(json['nameEn']),
        nameFr: _asString(json['nameFr']),
        nameAr: _asString(json['nameAr']),
        practiceStarted: json['practiceStarted'] == true,
        practiceCompleted: json['practiceCompleted'] == true,
        practiceBestScorePct: _asNullableDouble(json['practiceBestScorePct']),
        exam1Attempted: json['exam1Attempted'] == true,
        exam1Passed: json['exam1Passed'] == true,
      );

  String nameFor(String language) =>
      _localized(language, ar: nameAr, en: nameEn, nl: nameNl, fr: nameFr);
}

enum SignCategoryCode {
  a,
  b,
  c,
  d,
  e,
  f,
  fm,
  g,
  m,
  t,
  z,
  other;

  static SignCategoryCode fromValue(Object? value) {
    final normalized = (value?.toString() ?? '').split('.').last.toLowerCase();
    final backendCategory = switch (normalized) {
      'danger' => SignCategoryCode.a,
      'priority' => SignCategoryCode.b,
      'prohibition' => SignCategoryCode.c,
      'mandatory' => SignCategoryCode.d,
      'parking' => SignCategoryCode.e,
      'information' => SignCategoryCode.f,
      'road_management' => SignCategoryCode.f,
      'additional' => SignCategoryCode.g,
      'cyclist' => SignCategoryCode.m,
      'delineation' => SignCategoryCode.m,
      'zone' => SignCategoryCode.z,
      _ => null,
    };
    if (backendCategory != null) return backendCategory;
    return SignCategoryCode.values.firstWhere(
      (item) => item.name == normalized,
      orElse: () => SignCategoryCode.other,
    );
  }
}

class SignExamResult {
  final bool passed;
  final double scorePercentage;
  final int correctAnswers;
  final int totalLinked;
  final int passingThreshold;

  const SignExamResult({
    required this.passed,
    required this.scorePercentage,
    required this.correctAnswers,
    required this.totalLinked,
    required this.passingThreshold,
  });

  factory SignExamResult.fromJson(Map<String, dynamic> json) => SignExamResult(
    passed: json['passed'] == true,
    scorePercentage: _asDouble(json['scorePercentage']),
    correctAnswers: _asInt(json['correctAnswers']),
    totalLinked: _asInt(json['totalLinked']),
    passingThreshold: _asInt(json['passingThreshold']),
  );
}

class SignRandomPracticeSession {
  final int sessionId;
  final String status;
  final int totalQuestions;
  final int passingScore;
  final DateTime? startedAt;
  final DateTime? expiresAt;
  final List<SignQuizQuestion> questions;

  const SignRandomPracticeSession({
    required this.sessionId,
    required this.status,
    required this.totalQuestions,
    required this.passingScore,
    required this.startedAt,
    required this.expiresAt,
    required this.questions,
  });

  factory SignRandomPracticeSession.fromJson(Map<String, dynamic> json) =>
      SignRandomPracticeSession(
        sessionId: _asInt(json['sessionId']),
        status: _asString(json['status']),
        totalQuestions: _asInt(json['totalQuestions']),
        passingScore: _asInt(json['passingScore']),
        startedAt: _asDateTime(json['startedAt']),
        expiresAt: _asDateTime(json['expiresAt']),
        questions: _asMapList(
          json['questions'],
        ).map(SignQuizQuestion.fromJson).toList(),
      );
}

class SignRandomPracticeQuestionResult {
  final int questionId;
  final int? selectedChoiceId;
  final int? correctChoiceId;
  final String? selectedChoiceEn;
  final String? selectedChoiceNl;
  final String? selectedChoiceFr;
  final String? selectedChoiceAr;
  final String? correctChoiceEn;
  final String? correctChoiceNl;
  final String? correctChoiceFr;
  final String? correctChoiceAr;
  final bool isCorrect;
  final bool wasTimeout;
  final String questionEn;
  final String questionAr;
  final String questionFr;
  final String questionNl;
  final String? signCode;
  final String? signImagePath;
  final String difficulty;
  final String explanationEn;
  final String explanationAr;
  final String explanationFr;
  final String explanationNl;

  const SignRandomPracticeQuestionResult({
    required this.questionId,
    required this.selectedChoiceId,
    required this.correctChoiceId,
    this.selectedChoiceEn,
    this.selectedChoiceNl,
    this.selectedChoiceFr,
    this.selectedChoiceAr,
    this.correctChoiceEn,
    this.correctChoiceNl,
    this.correctChoiceFr,
    this.correctChoiceAr,
    required this.isCorrect,
    required this.wasTimeout,
    required this.questionEn,
    required this.questionAr,
    required this.questionFr,
    required this.questionNl,
    required this.signCode,
    required this.signImagePath,
    required this.difficulty,
    required this.explanationEn,
    required this.explanationAr,
    required this.explanationFr,
    required this.explanationNl,
  });

  factory SignRandomPracticeQuestionResult.fromJson(
    Map<String, dynamic> json,
  ) => SignRandomPracticeQuestionResult(
    questionId: _asInt(json['questionId']),
    selectedChoiceId: _asNullableInt(json['selectedChoiceId']),
    correctChoiceId: _asNullableInt(json['correctChoiceId']),
    selectedChoiceEn: _asNullableString(json['selectedChoiceEn']),
    selectedChoiceNl: _asNullableString(json['selectedChoiceNl']),
    selectedChoiceFr: _asNullableString(json['selectedChoiceFr']),
    selectedChoiceAr: _asNullableString(json['selectedChoiceAr']),
    correctChoiceEn: _asNullableString(json['correctChoiceEn']),
    correctChoiceNl: _asNullableString(json['correctChoiceNl']),
    correctChoiceFr: _asNullableString(json['correctChoiceFr']),
    correctChoiceAr: _asNullableString(json['correctChoiceAr']),
    isCorrect: json['isCorrect'] == true,
    wasTimeout: json['wasTimeout'] == true,
    questionEn: _asString(json['questionEn']),
    questionAr: _asString(json['questionAr']),
    questionFr: _asString(json['questionFr']),
    questionNl: _asString(json['questionNl']),
    signCode: _asNullableString(json['signCode']),
    signImagePath: _asNullableString(json['signImagePath']),
    difficulty: _asString(json['difficulty']),
    explanationEn: _asString(json['explanationEn']),
    explanationAr: _asString(json['explanationAr']),
    explanationFr: _asString(json['explanationFr']),
    explanationNl: _asString(json['explanationNl']),
  );

  String questionFor(String language) => switch (language) {
    'ar' => questionAr,
    'nl' => questionNl,
    'fr' => questionFr,
    _ => questionEn,
  };

  String explanationFor(String language) => switch (language) {
    'ar' => explanationAr,
    'nl' => explanationNl,
    'fr' => explanationFr,
    _ => explanationEn,
  };

  Map<String, dynamic> toJson() => {
    'questionId': questionId,
    'selectedChoiceId': selectedChoiceId,
    'correctChoiceId': correctChoiceId,
    'selectedChoiceEn': selectedChoiceEn,
    'selectedChoiceNl': selectedChoiceNl,
    'selectedChoiceFr': selectedChoiceFr,
    'selectedChoiceAr': selectedChoiceAr,
    'correctChoiceEn': correctChoiceEn,
    'correctChoiceNl': correctChoiceNl,
    'correctChoiceFr': correctChoiceFr,
    'correctChoiceAr': correctChoiceAr,
    'questionEn': questionEn,
    'questionNl': questionNl,
    'questionFr': questionFr,
    'questionAr': questionAr,
    'explanationEn': explanationEn,
    'explanationNl': explanationNl,
    'explanationFr': explanationFr,
    'explanationAr': explanationAr,
    'signCode': signCode,
    'signImagePath': signImagePath,
    'difficulty': difficulty,
    'isCorrect': isCorrect,
    'wasTimeout': wasTimeout,
  };
}

class SignRandomPracticeResult {
  final int sessionId;
  final String status;
  final int totalQuestions;
  final int answeredCount;
  final int correctAnswers;
  final int wrongAnswers;
  final int unanswered;
  final double scorePercentage;
  final bool passed;
  final int passingScore;
  final List<SignRandomPracticeQuestionResult> questions;
  final DateTime? startedAt;
  final DateTime? completedAt;

  const SignRandomPracticeResult({
    required this.sessionId,
    required this.status,
    required this.totalQuestions,
    required this.answeredCount,
    required this.correctAnswers,
    required this.wrongAnswers,
    required this.unanswered,
    required this.scorePercentage,
    required this.passed,
    required this.passingScore,
    required this.questions,
    this.startedAt,
    this.completedAt,
  });

  factory SignRandomPracticeResult.fromJson(Map<String, dynamic> json) =>
      SignRandomPracticeResult(
        sessionId: _asInt(json['sessionId']),
        status: _asString(json['status']),
        totalQuestions: _asInt(json['totalQuestions']),
        answeredCount: _asInt(json['answeredCount']),
        correctAnswers: _asInt(json['correctAnswers']),
        wrongAnswers: _asInt(json['wrongAnswers']),
        unanswered: _asInt(json['unanswered']),
        scorePercentage: _asDouble(json['scorePercentage']),
        passed: json['passed'] == true,
        passingScore: _asInt(json['passingScore']),
        startedAt: _asDateTime(json['startedAt']),
        completedAt: _asDateTime(json['completedAt']),
        questions: _asMapList(
          json['questions'],
        ).map(SignRandomPracticeQuestionResult.fromJson).toList(),
      );

  Map<String, dynamic> toJson() => {
    'sessionId': sessionId,
    'status': status,
    'totalQuestions': totalQuestions,
    'answeredCount': answeredCount,
    'correctAnswers': correctAnswers,
    'wrongAnswers': wrongAnswers,
    'unanswered': unanswered,
    'scorePercentage': scorePercentage,
    'passed': passed,
    'passingScore': passingScore,
    'startedAt': startedAt?.toIso8601String(),
    'completedAt': completedAt?.toIso8601String(),
    'questions': questions.map((question) => question.toJson()).toList(),
  };
}

class SignRandomPracticeHistoryItem {
  final int sessionId;
  final String status;
  final int totalQuestions;
  final int answeredCount;
  final int correctAnswers;
  final int wrongAnswers;
  final int unanswered;
  final double scorePercentage;
  final bool passed;
  final int passingScore;
  final DateTime? startedAt;
  final DateTime? completedAt;

  const SignRandomPracticeHistoryItem({
    required this.sessionId,
    required this.status,
    required this.totalQuestions,
    required this.answeredCount,
    required this.correctAnswers,
    required this.wrongAnswers,
    required this.unanswered,
    required this.scorePercentage,
    required this.passed,
    required this.passingScore,
    this.startedAt,
    this.completedAt,
  });

  factory SignRandomPracticeHistoryItem.fromJson(Map<String, dynamic> json) =>
      SignRandomPracticeHistoryItem(
        sessionId: _asInt(json['sessionId']),
        status: _asString(json['status']),
        totalQuestions: _asInt(json['totalQuestions']),
        answeredCount: _asInt(json['answeredCount']),
        correctAnswers: _asInt(json['correctAnswers']),
        wrongAnswers: _asInt(json['wrongAnswers']),
        unanswered: _asInt(json['unanswered']),
        scorePercentage: _asDouble(json['scorePercentage']),
        passed: json['passed'] == true,
        passingScore: _asInt(json['passingScore']),
        startedAt: _asDateTime(json['startedAt']),
        completedAt: _asDateTime(json['completedAt']),
      );
}

class SignUserProgress {
  final bool practiceStarted;
  final bool practiceCompleted;
  final double? practiceBestScorePct;
  final bool exam1Attempted;
  final bool exam1Passed;
  final double? exam1BestScorePct;
  final int? exam1TotalQuestions;
  final int? exam1PassingScore;

  const SignUserProgress({
    required this.practiceStarted,
    required this.practiceCompleted,
    required this.practiceBestScorePct,
    required this.exam1Attempted,
    required this.exam1Passed,
    this.exam1BestScorePct,
    this.exam1TotalQuestions,
    this.exam1PassingScore,
  });

  factory SignUserProgress.fromJson(Map<String, dynamic> json) =>
      SignUserProgress(
        practiceStarted: json['practiceStarted'] == true,
        practiceCompleted: json['practiceCompleted'] == true,
        practiceBestScorePct: _asNullableDouble(json['practiceBestScorePct']),
        exam1Attempted: json['exam1Attempted'] == true,
        exam1Passed: json['exam1Passed'] == true,
        exam1BestScorePct: _asNullableDouble(json['exam1BestScorePct']),
        exam1TotalQuestions: int.tryParse(
          json['exam1TotalQuestions']?.toString() ?? '',
        ),
        exam1PassingScore: int.tryParse(
          json['exam1PassingScore']?.toString() ?? '',
        ),
      );
}

class SignQuizService {
  final AuthenticatedApiClient _apiClient;

  SignQuizService(this._apiClient);

  Future<SignPracticeSession> startPractice(String signCode) async {
    final response = await _apiClient.post('/api/sign-quiz/practice/$signCode');
    _ensureSuccess(response);
    return SignPracticeSession.fromJson(_asMap(response.data));
  }

  Future<SignPracticeFeedback> submitPracticeAnswer(
    int sessionId,
    int questionId,
    int choiceId, {
    Duration? timeTaken,
  }) async {
    final response = await _apiClient.post(
      '/api/sign-quiz/practice/$sessionId/questions/$questionId/answer',
      data: {
        'choiceId': choiceId,
        if (timeTaken != null)
          'timeTakenSeconds': timeTaken.inSeconds.clamp(1, 600),
      },
    );
    _ensureSuccess(response);
    return SignPracticeFeedback.fromJson(_asMap(response.data));
  }

  Future<SignExamSession> getExamQuestions(
    String signCode, {
    int examNumber = 1,
  }) async {
    final response = await _apiClient.get(
      '/api/sign-quiz/exam/$signCode/$examNumber',
    );
    _ensureSuccess(response);
    return SignExamSession.fromJson(_asMap(response.data));
  }

  Future<SignExamResult> submitExam(
    String signCode,
    int examNumber,
    Map<int, int> answers,
  ) async {
    final response = await _apiClient.post(
      '/api/sign-quiz/exam/$signCode/$examNumber/submit',
      data: {
        'answers': answers.entries
            .map((entry) => {'questionId': entry.key, 'choiceId': entry.value})
            .toList(),
      },
    );
    _ensureSuccess(response);
    return SignExamResult.fromJson(_asMap(response.data));
  }

  Future<SignRandomPracticeSession> startRandomPractice() async {
    final response = await _apiClient.get('/api/sign-quiz/random-practice');
    _ensureSuccess(response);
    return SignRandomPracticeSession.fromJson(_asMap(response.data));
  }

  Future<SignRandomPracticeResult> submitRandomPractice(
    int sessionId,
    Map<int, int?> answers,
  ) async {
    final response = await _apiClient.post(
      '/api/sign-quiz/random-practice/check',
      data: {
        'sessionId': sessionId,
        'answers': answers.entries
            .map(
              (entry) => {
                'questionId': entry.key,
                'selectedChoiceId': entry.value,
              },
            )
            .toList(),
      },
    );
    _ensureSuccess(response);
    return SignRandomPracticeResult.fromJson(_asMap(response.data));
  }

  Future<void> abandonRandomPractice(int sessionId) async {
    final response = await _apiClient.post(
      '/api/sign-quiz/random-practice/$sessionId/abandon',
    );
    _ensureSuccess(response);
  }

  Future<List<SignRandomPracticeHistoryItem>> getRandomPracticeHistory() async {
    final response = await _apiClient.get(
      '/api/sign-quiz/random-practice/history',
    );
    _ensureSuccess(response);
    final data = _asMap(response.data);
    return _asMapList(
      data['sessions'],
    ).map(SignRandomPracticeHistoryItem.fromJson).toList();
  }

  Future<SignRandomPracticeResult> getRandomPracticeResult(
    int sessionId,
  ) async {
    final response = await _apiClient.get(
      '/api/sign-quiz/random-practice/$sessionId/results',
    );
    _ensureSuccess(response);
    return SignRandomPracticeResult.fromJson(_asMap(response.data));
  }

  Future<SignUserProgress> getSignStatus(String signCode) async {
    final response = await _apiClient.get(
      '/api/sign-quiz/signs/$signCode/status',
    );
    _ensureSuccess(response);
    return SignUserProgress.fromJson(_asMap(response.data));
  }

  Future<List<Map<String, dynamic>>> getPracticeHistory() async {
    final response = await _apiClient.get('/api/sign-quiz/practice/history');
    _ensureSuccess(response);
    final data = _asMap(response.data);
    return _asMapList(data['sessions']);
  }

  Future<Map<String, dynamic>> getPracticeResult(int sessionId) async {
    final response = await _apiClient.get(
      '/api/sign-quiz/practice/$sessionId/results',
    );
    _ensureSuccess(response);
    return _asMap(response.data);
  }

  Future<SignPracticeResult> getPracticeResultModel(int sessionId) async {
    return SignPracticeResult.fromJson(await getPracticeResult(sessionId));
  }

  Future<void> abandonPractice(int sessionId) async {
    if (sessionId <= 0) return;
    final response = await _apiClient.post(
      '/api/sign-quiz/practice/$sessionId/abandon',
    );
    _ensureSuccess(response);
  }

  Future<List<SignPracticeProgress>> getAllProgress() async {
    final response = await _apiClient.get('/api/sign-quiz/user-progress');
    _ensureSuccess(response);
    final data = response.data;
    final values = data is Map
        ? (data['signs'] ?? data['progress'] ?? data['items'] ?? const [])
        : data;
    return _asMapList(values).map(SignPracticeProgress.fromJson).toList();
  }

  Future<List<Map<String, dynamic>>> getExamHistory() async {
    final response = await _apiClient.get('/api/sign-quiz/exam-history');
    _ensureSuccess(response);
    final data = _asMap(response.data);
    return _asMapList(data['results']);
  }

  Future<Map<String, dynamic>> getExamResult(int resultId) async {
    final response = await _apiClient.get(
      '/api/sign-quiz/exam-results/$resultId',
    );
    _ensureSuccess(response);
    return _asMap(response.data);
  }

  static void _ensureSuccess(dynamic response) {
    final status = response.statusCode as int?;
    if (status == null || status < 200 || status >= 300) {
      throw Exception('Sign quiz request failed ($status)');
    }
  }
}

Map<String, dynamic> _asMap(Object? value) =>
    Map<String, dynamic>.from(value as Map);

List<Map<String, dynamic>> _asMapList(Object? value) => value is List
    ? value
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList()
    : const [];

int _asInt(Object? value, {int fallback = 0}) => switch (value) {
  int number => number,
  num number => number.toInt(),
  String text => int.tryParse(text) ?? fallback,
  _ => fallback,
};

int? _asNullableInt(Object? value) => value == null ? null : _asInt(value);

DateTime? _asDateTime(Object? value) =>
    value == null ? null : DateTime.tryParse(value.toString());

double _asDouble(Object? value) => switch (value) {
  num number => number.toDouble(),
  String text => double.tryParse(text) ?? 0,
  _ => 0,
};

double? _asNullableDouble(Object? value) =>
    value == null ? null : _asDouble(value);

String _asString(Object? value) =>
    value is String ? value : value?.toString() ?? '';

String? _asNullableString(Object? value) {
  final text = _asString(value).trim();
  return text.isEmpty ? null : text;
}

String _localized(
  String language, {
  required String ar,
  required String en,
  required String nl,
  required String fr,
}) {
  final requested = switch (language) {
    'ar' => ar,
    'nl' => nl,
    'fr' => fr,
    _ => en,
  };
  for (final value in [requested, en, nl, fr, ar]) {
    if (value.trim().isNotEmpty) return value.trim();
  }
  return '';
}
