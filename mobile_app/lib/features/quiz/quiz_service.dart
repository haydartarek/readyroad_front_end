import '../../core/network/api_client.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../shared/models/quiz_models.dart';

class PracticeAnswerFeedback {
  final bool isCorrect;
  final int? correctOptionId;
  final String explanationEn;
  final String explanationAr;
  final String explanationNl;
  final String explanationFr;

  const PracticeAnswerFeedback({
    required this.isCorrect,
    required this.correctOptionId,
    required this.explanationEn,
    required this.explanationAr,
    required this.explanationNl,
    required this.explanationFr,
  });

  factory PracticeAnswerFeedback.fromJson(Map<String, dynamic> json) {
    return PracticeAnswerFeedback(
      isCorrect: json['isCorrect'] == true,
      correctOptionId: _asNullableInt(json['correctOptionId']),
      explanationEn: _asString(json['explanationEn']),
      explanationAr: _asString(json['explanationAr']),
      explanationNl: _asString(json['explanationNl']),
      explanationFr: _asString(json['explanationFr']),
    );
  }

  String explanationFor(String language) => switch (language) {
    'ar' => explanationAr,
    'nl' => explanationNl,
    'fr' => explanationFr,
    _ => explanationEn,
  };
}

/// Thin client for the backend question bank and answer endpoint.
class QuizService {
  final AuthenticatedApiClient _authenticatedApiClient;

  // Keep the current DI signature while sending quiz-content requests with auth.
  QuizService(ApiClient _, this._authenticatedApiClient);

  Future<List<QuizQuestion>> generateQuiz({
    int? categoryId,
    int questionCount = 10,
  }) async {
    final path = categoryId == null
        ? '/api/quiz/random'
        : '/api/quiz/category/$categoryId';
    final response = await _authenticatedApiClient.get(
      path,
      queryParameters: {'count': questionCount.clamp(1, 50)},
    );
    _ensureSuccess(response.statusCode);
    return _asMapList(response.data).map(QuizQuestion.fromJson).toList();
  }

  Future<PracticeAnswerFeedback> submitAnswer(
    int questionId,
    int selectedOptionId,
    Duration timeTaken,
  ) async {
    final response = await _authenticatedApiClient.post(
      '/api/quiz/questions/$questionId/answer',
      data: {
        'selectedOptionId': selectedOptionId,
        'timeTakenSeconds': timeTaken.inSeconds.clamp(1, 300),
      },
    );
    _ensureSuccess(response.statusCode);
    return PracticeAnswerFeedback.fromJson(_asMap(response.data));
  }
}

void _ensureSuccess(int? statusCode) {
  if (statusCode == null || statusCode < 200 || statusCode >= 300) {
    throw Exception('Quiz request failed ($statusCode)');
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

int? _asNullableInt(Object? value) => value == null
    ? null
    : value is num
    ? value.toInt()
    : int.tryParse(value.toString());

String _asString(Object? value) =>
    value is String ? value : value?.toString() ?? '';
