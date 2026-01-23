import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import 'dart:convert';

class PracticeQuestionService {
  final ApiClient _apiClient;

  PracticeQuestionService(this._apiClient);

  /// Get practice questions by lesson ID
  Future<List<Map<String, dynamic>>> getPracticeQuestionsByLesson(int lessonId) async {
    final response = await _apiClient.get('${ApiConstants.baseUrl}/api/practice-questions/by-lesson?lessonId=$lessonId');
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(response.data);
    }
    throw Exception('Failed to load practice questions');
  }

  /// Get practice question by ID
  Future<Map<String, dynamic>> getPracticeQuestionById(int id) async {
    final response = await _apiClient.get('${ApiConstants.baseUrl}/api/practice-questions/$id');
    if (response.statusCode == 200) {
      return response.data as Map<String, dynamic>;
    }
    throw Exception('Failed to load practice question');
  }

  /// Check answer
  Future<Map<String, dynamic>> checkAnswer(int questionId, int answer) async {
    final response = await _apiClient.post(
      '${ApiConstants.baseUrl}/api/practice-questions/check-answer',
      data: {'questionId': questionId, 'answer': answer},
    );
    if (response.statusCode == 200) {
      return response.data as Map<String, dynamic>;
    }
    throw Exception('Failed to check answer');
  }
}
