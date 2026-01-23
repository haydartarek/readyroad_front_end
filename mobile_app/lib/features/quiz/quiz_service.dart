import 'dart:math';
import '../../shared/models/content_item.dart';
import '../../shared/models/quiz_models.dart';
import '../../core/di/service_locator.dart';
import '../../shared/services/content_service.dart';

/// Quiz Service - Generates quiz questions
class QuizService {
  final ContentService _contentService = getIt<ContentService>();
  final Random _random = Random();

  /// Generate quiz questions
  Future<List<QuizQuestion>> generateQuiz({
    int? categoryId,
    int questionCount = 10,
  }) async {
    try {
      // Get all content or content by category
      List<ContentItem> allContent;
      if (categoryId != null) {
        allContent = await _contentService.getContentByCategory(categoryId);
      } else {
        allContent = await _contentService.getAllContent();
      }

      if (allContent.length < 4) {
        throw Exception('Not enough content to generate quiz');
      }

      // Limit question count to available content
      final actualQuestionCount = min(questionCount, allContent.length);

      // Shuffle and select content for questions
      final shuffled = List<ContentItem>.from(allContent)..shuffle(_random);
      final selectedContent = shuffled.take(actualQuestionCount).toList();

      // Generate questions
      final questions = <QuizQuestion>[];
      for (final content in selectedContent) {
        questions.add(_generateQuestion(content, allContent));
      }

      return questions;
    } catch (e) {
      throw Exception('Failed to generate quiz: $e');
    }
  }

  /// Generate a single question
  QuizQuestion _generateQuestion(ContentItem correctContent, List<ContentItem> allContent) {
    // Get 3 random wrong answers
    final wrongContent = List<ContentItem>.from(allContent)
      ..remove(correctContent)
      ..shuffle(_random);

    final wrongOptions = wrongContent.take(3).toList();

    // Combine correct and wrong answers
    final options = [correctContent, ...wrongOptions]..shuffle(_random);

    return QuizQuestion(
      correctContent: correctContent,
      options: options,
      questionType: 'image',
    );
  }
}

