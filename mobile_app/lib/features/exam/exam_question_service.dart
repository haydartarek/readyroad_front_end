import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';

class ExamQuestionService {
  final ApiClient _apiClient;

  ExamQuestionService(this._apiClient);

  /// Get random exam questions
  Future<List<Map<String, dynamic>>> getRandomExamQuestions({int count = 50}) async {
    final response = await _apiClient.get('${ApiConstants.baseUrl}/api/exam-questions/random?count=$count');
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(response.data);
    }
    throw Exception('Failed to load exam questions');
  }

  /// Get exam question by ID
  Future<Map<String, dynamic>> getExamQuestionById(int id) async {
    final response = await _apiClient.get('${ApiConstants.baseUrl}/api/exam-questions/$id');
    if (response.statusCode == 200) {
      return response.data as Map<String, dynamic>;
    }
    throw Exception('Failed to load exam question');
  }

  /// Get exam questions by category
  Future<List<Map<String, dynamic>>> getExamQuestionsByCategory(String categoryCode) async {
    final response = await _apiClient.get('${ApiConstants.baseUrl}/api/exam-questions/by-category?category=$categoryCode');
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(response.data);
    }
    throw Exception('Failed to load exam questions by category');
  }

  /// Check answer
  Future<Map<String, dynamic>> checkAnswer(int questionId, int answer) async {
    final response = await _apiClient.post(
      '${ApiConstants.baseUrl}/api/exam-questions/check-answer',
      data: {'questionId': questionId, 'answer': answer},
    );
    if (response.statusCode == 200) {
      return response.data as Map<String, dynamic>;
    }
    throw Exception('Failed to check answer');
  }
}
