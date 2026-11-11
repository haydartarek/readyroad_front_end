import '../../core/network/authenticated_api_client.dart';

class LearningProgressData {
  const LearningProgressData({
    required this.overall,
    required this.intelligence,
    required this.categories,
    required this.coverage,
    required this.timeouts,
  });
  final Map<String, dynamic> overall;
  final Map<String, dynamic> intelligence;
  final List<Map<String, dynamic>> categories;
  final Map<String, dynamic> coverage;
  final Map<String, dynamic> timeouts;
}

class DashboardOverviewData {
  const DashboardOverviewData({
    required this.overall,
    required this.intelligence,
    required this.weakAreas,
    required this.activities,
  });
  final Map<String, dynamic> overall;
  final Map<String, dynamic> intelligence;
  final Map<String, dynamic> weakAreas;
  final List<Map<String, dynamic>> activities;
}

class DashboardData {
  final Map<String, dynamic> overall;
  final List<Map<String, dynamic>> categories;
  final Map<String, dynamic> intelligence;
  final Map<String, dynamic> theoryCoverage;
  final Map<String, dynamic> timeouts;
  final Map<String, dynamic> weakAreas;
  final List<Map<String, dynamic>> errorPatterns;
  final List<Map<String, dynamic>> recommendations;
  final List<Map<String, dynamic>> recentActivities;
  final int? lessonCount;

  const DashboardData({
    required this.overall,
    required this.categories,
    required this.intelligence,
    required this.theoryCoverage,
    required this.timeouts,
    required this.weakAreas,
    required this.errorPatterns,
    required this.recommendations,
    required this.recentActivities,
    this.lessonCount,
  });
}

class DashboardService {
  final AuthenticatedApiClient _apiClient;

  DashboardService(this._apiClient);

  Future<LearningProgressData> loadProgress() async {
    final responses = await Future.wait([
      _apiClient.get('/api/users/me/progress/overall'),
      _apiClient.get('/api/users/me/progress/intelligence'),
      _apiClient.get('/api/users/me/progress/categories'),
      _apiClient.get('/api/users/me/progress/theory-coverage'),
      _apiClient.get(
        '/api/users/me/progress/theory-timeouts',
        queryParameters: {'limit': 10},
      ),
    ]);
    return LearningProgressData(
      overall: _map(responses[0].data),
      intelligence: _map(responses[1].data),
      categories: _maps(responses[2].data),
      coverage: _map(responses[3].data),
      timeouts: _map(responses[4].data),
    );
  }

  Future<DashboardOverviewData> loadOverview() async {
    final responses = await Future.wait([
      _apiClient.get('/api/users/me/progress/overall'),
      _apiClient.get('/api/users/me/progress/intelligence'),
      _apiClient.get('/api/users/me/analytics/weak-areas'),
      _apiClient.get('/api/exams/simulations/history'),
      _apiClient.get('/api/sign-quiz/practice/history'),
      _apiClient.get('/api/sign-quiz/exam-history'),
      _apiClient.get('/api/sign-quiz/random-practice/history'),
    ]);
    return DashboardOverviewData(
      overall: _map(responses[0].data),
      intelligence: _map(responses[1].data),
      weakAreas: _map(responses[2].data),
      activities: _activities(responses.skip(3).map((r) => r.data).toList()),
    );
  }

  Future<DashboardData> load() async {
    final responses = await Future.wait([
      _apiClient.get('/api/users/me/progress/overall'),
      _apiClient.get('/api/users/me/progress/categories'),
      _apiClient.get('/api/users/me/progress/intelligence'),
      _apiClient.get('/api/users/me/progress/theory-coverage'),
      _apiClient.get(
        '/api/users/me/progress/theory-timeouts',
        queryParameters: {'limit': 10},
      ),
      _apiClient.get('/api/users/me/analytics/weak-areas'),
      _apiClient.get('/api/users/me/analytics/error-patterns'),
      _apiClient.get('/api/users/me/progress/recommendations'),
    ]);

    final activityResponses = await Future.wait([
      _safeGet('/api/exams/simulations/history'),
      _safeGet('/api/sign-quiz/practice/history'),
      _safeGet('/api/sign-quiz/exam-history'),
      _safeGet('/api/sign-quiz/random-practice/history'),
      _safeGet('/api/lessons'),
    ]);

    return DashboardData(
      overall: _map(responses[0].data),
      categories: _maps(responses[1].data),
      intelligence: _map(responses[2].data),
      theoryCoverage: _map(responses[3].data),
      timeouts: _map(responses[4].data),
      weakAreas: _map(responses[5].data),
      errorPatterns: _maps(responses[6].data),
      recommendations: _recommendations(responses[7].data),
      recentActivities: _activities(activityResponses.take(4).toList()),
      lessonCount: activityResponses[4] is List
          ? (activityResponses[4] as List).length
          : null,
    );
  }

  Future<Object?> _safeGet(String path) async {
    try {
      final response = await _apiClient.get(path);
      return response.data;
    } catch (_) {
      return null;
    }
  }

  static Map<String, dynamic> _map(Object? value) =>
      value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};

  static List<Map<String, dynamic>> _maps(Object? value) {
    if (value is List) {
      return value
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList(growable: false);
    }
    if (value is Map) {
      for (final key in const [
        'items',
        'exams',
        'sessions',
        'results',
        'categories',
        'weakAreas',
      ]) {
        final nested = value[key];
        if (nested is List) return _maps(nested);
      }
    }
    return const [];
  }

  static List<Map<String, dynamic>> _recommendations(Object? value) {
    if (value is Map && value['recommendations'] is List) {
      return _maps(value['recommendations']);
    }
    return _maps(value);
  }

  static List<Map<String, dynamic>> _activities(List<Object?> responses) {
    final activities = <Map<String, dynamic>>[];
    for (var index = 0; index < responses.length; index++) {
      for (final item in _maps(responses[index])) {
        final completed = index == 2
            ? item['completedAt'] != null
            : (item['status'] ?? (index == 0 ? 'COMPLETED' : null)) ==
                  'COMPLETED';
        if (!completed) continue;
        final activity = Map<String, dynamic>.from(item);
        activity['activityType'] ??= switch (index) {
          0 => 'THEORY_EXAM',
          1 => 'SIGN_PRACTICE',
          2 => 'SIGN_EXAM',
          _ => 'RANDOM_SIGN_EXAM',
        };
        activity['link'] = switch (index) {
          0 => '/exam/results/${item['examId']}',
          1 =>
            '/traffic-signs/${Uri.encodeComponent(item['signCode'].toString())}',
          2 =>
            '/dashboard?section=exam-results&signExamResultId=${item['resultId']}',
          _ =>
            '/dashboard?section=exam-results&randomSignExamId=${item['sessionId']}',
        };
        activities.add(activity);
      }
    }
    activities.sort((a, b) => _date(b).compareTo(_date(a)));
    return activities.take(10).toList(growable: false);
  }

  static DateTime _date(Map<String, dynamic> value) =>
      DateTime.tryParse(
        (value['completedAt'] ??
                value['createdAt'] ??
                value['startedAt'] ??
                value['updatedAt'] ??
                '')
            .toString(),
      ) ??
      DateTime.fromMillisecondsSinceEpoch(0);
}
