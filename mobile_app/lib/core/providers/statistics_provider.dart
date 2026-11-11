import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../di/service_locator.dart';
import '../network/authenticated_api_client.dart';
import '../../shared/models/quiz_models.dart';
import '../../shared/models/statistics_models.dart';

/// A failing endpoint must not cause unrelated statistics to become zero.
enum StatisticsLoadState { notApplicable, loading, ready, unavailable }

abstract class StatisticsRemoteSource {
  Future<Map<String, dynamic>> overallProgress();
  Future<Map<String, dynamic>> theoryExamHistory();
}

class ApiStatisticsRemoteSource implements StatisticsRemoteSource {
  const ApiStatisticsRemoteSource();

  @override
  Future<Map<String, dynamic>> overallProgress() async {
    final response = await getIt<AuthenticatedApiClient>().get(
      '/api/users/me/progress/overall',
    );
    if (response.statusCode != 200 || response.data is! Map) {
      throw const FormatException('Invalid progress API response');
    }
    return Map<String, dynamic>.from(response.data as Map);
  }

  @override
  Future<Map<String, dynamic>> theoryExamHistory() async {
    final response = await getIt<AuthenticatedApiClient>().get(
      '/api/exams/simulations/history',
    );
    if (response.statusCode != 200 || response.data is! Map) {
      throw const FormatException('Invalid exam history API response');
    }
    return Map<String, dynamic>.from(response.data as Map);
  }
}

class StatisticsProvider extends ChangeNotifier {
  final StatisticsRemoteSource _remoteSource;
  String _userKey = 'anonymous';
  int _generation = 0;
  bool _disposed = false;
  Future<void> _pendingWrite = Future<void>.value();
  bool _isLoaded = false;
  List<QuizResult> _quizResults = [];

  StatisticsLoadState _progressState = StatisticsLoadState.notApplicable;
  StatisticsLoadState _historyState = StatisticsLoadState.notApplicable;
  ServerPracticeProgress? _serverProgress;
  List<ServerTheoryExam> _serverExams = const [];

  StatisticsProvider({StatisticsRemoteSource? remoteSource})
      : _remoteSource = remoteSource ?? const ApiStatisticsRemoteSource() {
    _loadLocal(++_generation);
  }

  List<QuizResult> get quizResults => List.unmodifiable(_quizResults);
  QuizStatistics get statistics => QuizStatistics(results: quizResults);
  bool get isLoaded => _isLoaded;
  bool get isAuthenticatedScope => _userKey != 'anonymous';
  StatisticsLoadState get progressState => _progressState;
  StatisticsLoadState get historyState => _historyState;
  ServerPracticeProgress? get serverProgress => _serverProgress;
  List<ServerTheoryExam> get serverExams => _serverExams;
  bool get hasRemoteProgress => _progressState == StatisticsLoadState.ready;

  Future<void> bindToUser(String? userId) async {
    final nextKey = userId == null || userId.isEmpty ? 'anonymous' : userId;
    if (_disposed || (nextKey == _userKey && _isLoaded)) return;
    _userKey = nextKey;
    final generation = ++_generation;
    _quizResults = [];
    _isLoaded = false;
    _serverProgress = null;
    _serverExams = const [];
    _progressState = StatisticsLoadState.notApplicable;
    _historyState = StatisticsLoadState.notApplicable;
    _notify();
    await _loadLocal(generation);
  }

  Future<void> _loadLocal(int generation) async {
    final key = _userKey;
    final prefs = await SharedPreferences.getInstance();
    final entries = prefs.getStringList('quiz_results.$key') ?? const [];
    final loaded = <QuizResult>[];
    for (final encoded in entries) {
      try {
        final data = jsonDecode(encoded);
        if (data is! Map) continue;
        final json = Map<String, dynamic>.from(data);
        final total = _parseInt(json['totalQuestions']);
        final correct = _parseInt(json['correctAnswers']);
        final wrong = _parseInt(json['wrongAnswers']);
        final seconds = _parseInt(json['timeInSeconds']);
        final completed = DateTime.tryParse(json['completedAt']?.toString() ?? '');
        if (total <= 0 || correct < 0 || wrong < 0 ||
            correct + wrong > total || seconds < 0 || completed == null) {
          continue;
        }
        loaded.add(QuizResult(
          totalQuestions: total,
          correctAnswers: correct,
          wrongAnswers: wrong,
          timeTaken: Duration(seconds: seconds),
          categoryId: json['categoryId'] == null ? null : _parseInt(json['categoryId']),
          completedAt: completed,
        ));
      } catch (_) {
        // One malformed device-only entry must not hide otherwise valid entries.
      }
    }
    if (_disposed || generation != _generation || key != _userKey) return;
    _quizResults = loaded;
    _isLoaded = true;
    _notify();
    await _refreshRemote(generation);
  }

  Future<void> refreshRemote() async {
    if (_disposed || !_isLoaded) return;
    await _refreshRemote(++_generation);
  }

  Future<void> _refreshRemote(int generation) async {
    if (_userKey == 'anonymous') {
      _progressState = StatisticsLoadState.notApplicable;
      _historyState = StatisticsLoadState.notApplicable;
      _serverProgress = null;
      _serverExams = const [];
      _notify();
      return;
    }
    // Clear stale values before fetching. Never silently show device-only data
    // as a replacement for an unavailable authenticated API.
    _serverProgress = null;
    _serverExams = const [];
    _progressState = StatisticsLoadState.loading;
    _historyState = StatisticsLoadState.loading;
    _notify();

    await Future.wait([
      _fetchProgress(generation),
      _fetchHistory(generation),
    ]);
  }

  Future<void> _fetchProgress(int generation) async {
    try {
      final progress = ServerPracticeProgress.fromJson(
        await _remoteSource.overallProgress(),
      );
      if (_disposed || generation != _generation) return;
      _serverProgress = progress;
      _progressState = StatisticsLoadState.ready;
    } catch (_) {
      if (_disposed || generation != _generation) return;
      _serverProgress = null;
      _progressState = StatisticsLoadState.unavailable;
    }
    _notify();
  }

  Future<void> _fetchHistory(int generation) async {
    try {
      final history = ServerTheoryExam.completedFromHistory(
        await _remoteSource.theoryExamHistory(),
      );
      if (_disposed || generation != _generation) return;
      _serverExams = history;
      _historyState = StatisticsLoadState.ready;
    } catch (_) {
      if (_disposed || generation != _generation) return;
      _serverExams = const [];
      _historyState = StatisticsLoadState.unavailable;
    }
    _notify();
  }

  /// Device-only session history; server already persists each practice answer.
  Future<void> saveResult(QuizResult result) async {
    final key = _userKey;
    // Navigating back to an existing result must not count it twice.
    if (_quizResults.any((existing) =>
        existing.completedAt.isAtSameMomentAs(result.completedAt) &&
        existing.categoryId == result.categoryId)) {
      return;
    }
    final updated = List<QuizResult>.of(_quizResults)..add(result);
    _quizResults = updated;
    _notify();
    await _writeLocal(key, updated);
    if (_userKey == key && _isLoaded) await refreshRemote();
  }

  Future<void> clearStatistics() async {
    final key = _userKey;
    _quizResults = [];
    _notify();
    await _writeLocal(key, const []);
    // Server-owned answer history, exam results and progress are never cleared.
  }

  Future<void> _writeLocal(String key, List<QuizResult> items) async {
    final entries = items.map((r) => jsonEncode({
      'totalQuestions': r.totalQuestions,
      'correctAnswers': r.correctAnswers,
      'wrongAnswers': r.wrongAnswers,
      'timeInSeconds': r.timeTaken.inSeconds,
      'categoryId': r.categoryId,
      'completedAt': r.completedAt.toIso8601String(),
    })).toList(growable: false);
    // Serialize writes so rapid session completions cannot overwrite a newer
    // per-account cache with an older in-flight write.
    final previous = _pendingWrite;
    final write = previous.then((_) async {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('quiz_results.$key', entries);
    });
    _pendingWrite = write.catchError((Object _) {});
    await write;
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    super.dispose();
  }

  static int _parseInt(Object? value) =>
      value is num ? value.toInt() : int.tryParse(value?.toString() ?? '') ?? -1;
}
