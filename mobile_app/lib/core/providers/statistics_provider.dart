import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../shared/models/quiz_models.dart';
import '../../shared/models/statistics_models.dart';

/// Statistics Provider - Manages quiz statistics
class StatisticsProvider extends ChangeNotifier {
  List<QuizResult> _quizResults = [];
  bool _isLoaded = false;

  List<QuizResult> get quizResults => _quizResults;
  bool get isLoaded => _isLoaded;

  QuizStatistics get statistics => QuizStatistics(results: _quizResults);

  StatisticsProvider() {
    _loadResults();
  }

  /// Load quiz results from storage
  Future<void> _loadResults() async {
    final prefs = await SharedPreferences.getInstance();
    final resultsJson = prefs.getStringList('quiz_results') ?? [];

    _quizResults = resultsJson.map((json) {
      final data = jsonDecode(json);
      return QuizResult(
        totalQuestions: data['totalQuestions'],
        correctAnswers: data['correctAnswers'],
        wrongAnswers: data['wrongAnswers'],
        timeTaken: Duration(seconds: data['timeInSeconds']),
        categoryId: data['categoryId'],
        completedAt: DateTime.parse(data['completedAt']),
      );
    }).toList();

    _isLoaded = true;
    notifyListeners();
  }

  /// Save a quiz result
  Future<void> saveResult(QuizResult result) async {
    _quizResults.add(result);
    await _saveResults();
    notifyListeners();
  }

  /// Save results to storage
  Future<void> _saveResults() async {
    final prefs = await SharedPreferences.getInstance();
    final resultsJson = _quizResults.map((result) {
      return jsonEncode({
        'totalQuestions': result.totalQuestions,
        'correctAnswers': result.correctAnswers,
        'wrongAnswers': result.wrongAnswers,
        'timeInSeconds': result.timeTaken.inSeconds,
        'categoryId': result.categoryId,
        'completedAt': result.completedAt.toIso8601String(),
      });
    }).toList();

    await prefs.setStringList('quiz_results', resultsJson);
  }

  /// Clear all statistics
  Future<void> clearStatistics() async {
    _quizResults.clear();
    await _saveResults();
    notifyListeners();
  }
}

