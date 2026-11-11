import 'package:dio/dio.dart';

import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/network/authenticated_api_client.dart';

class LessonSummary {
  final int id;
  final String lessonCode;
  final String icon;
  final String titleNl;
  final String titleEn;
  final String titleFr;
  final String titleAr;
  final String descriptionNl;
  final String descriptionEn;
  final String descriptionFr;
  final String descriptionAr;
  final int displayOrder;
  final int estimatedMinutes;
  final int totalPages;

  const LessonSummary({
    required this.id,
    required this.lessonCode,
    required this.icon,
    required this.titleNl,
    required this.titleEn,
    required this.titleFr,
    required this.titleAr,
    required this.descriptionNl,
    required this.descriptionEn,
    required this.descriptionFr,
    required this.descriptionAr,
    required this.displayOrder,
    required this.estimatedMinutes,
    required this.totalPages,
  });

  factory LessonSummary.fromJson(Map<String, dynamic> json) {
    return LessonSummary(
      id: _asInt(json['id']),
      lessonCode: _asString(json['lessonCode']),
      icon: _asString(json['icon']),
      titleNl: _asString(json['titleNl']),
      titleEn: _asString(json['titleEn']),
      titleFr: _asString(json['titleFr']),
      titleAr: _asString(json['titleAr']),
      descriptionNl: _asString(json['descriptionNl']),
      descriptionEn: _asString(json['descriptionEn']),
      descriptionFr: _asString(json['descriptionFr']),
      descriptionAr: _asString(json['descriptionAr']),
      displayOrder: _asInt(json['displayOrder']),
      estimatedMinutes: _asInt(json['estimatedMinutes']),
      totalPages: _asInt(json['totalPages']),
    );
  }

  String titleFor(String language) =>
      _localized(language, ar: titleAr, nl: titleNl, fr: titleFr, en: titleEn);

  String descriptionFor(String language) => _localized(
    language,
    ar: descriptionAr,
    nl: descriptionNl,
    fr: descriptionFr,
    en: descriptionEn,
  );
}

class LessonPage {
  final int id;
  final int pageNumber;
  final String titleNl;
  final String titleEn;
  final String titleFr;
  final String titleAr;
  final String contentNl;
  final String contentEn;
  final String contentFr;
  final String contentAr;
  final String? imageUrl;

  const LessonPage({
    required this.id,
    required this.pageNumber,
    required this.titleNl,
    required this.titleEn,
    required this.titleFr,
    required this.titleAr,
    required this.contentNl,
    required this.contentEn,
    required this.contentFr,
    required this.contentAr,
    this.imageUrl,
  });

  factory LessonPage.fromJson(Map<String, dynamic> json) {
    final rawImageUrl = _asNullableString(json['imageUrl']);
    return LessonPage(
      id: _asInt(json['id']),
      pageNumber: _asInt(json['pageNumber']),
      titleNl: _asString(json['titleNl']),
      titleEn: _asString(json['titleEn']),
      titleFr: _asString(json['titleFr']),
      titleAr: _asString(json['titleAr']),
      contentNl: _asString(json['contentNl']),
      contentEn: _asString(json['contentEn']),
      contentFr: _asString(json['contentFr']),
      contentAr: _asString(json['contentAr']),
      imageUrl: rawImageUrl == null ? null : _resolveImageUrl(rawImageUrl),
    );
  }

  String titleFor(String language) =>
      _localized(language, ar: titleAr, nl: titleNl, fr: titleFr, en: titleEn);

  String contentFor(String language) => _localized(
    language,
    ar: contentAr,
    nl: contentNl,
    fr: contentFr,
    en: contentEn,
  );
}

class LessonDetail extends LessonSummary {
  final List<LessonPage> pages;

  const LessonDetail({
    required super.id,
    required super.lessonCode,
    required super.icon,
    required super.titleNl,
    required super.titleEn,
    required super.titleFr,
    required super.titleAr,
    required super.descriptionNl,
    required super.descriptionEn,
    required super.descriptionFr,
    required super.descriptionAr,
    required super.displayOrder,
    required super.estimatedMinutes,
    required this.pages,
  }) : super(totalPages: pages.length);

  factory LessonDetail.fromJson(Map<String, dynamic> json) {
    final pages =
        (json['pages'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(LessonPage.fromJson)
            .toList(growable: false)
          ..sort((a, b) => a.pageNumber.compareTo(b.pageNumber));
    return LessonDetail(
      id: _asInt(json['id']),
      lessonCode: _asString(json['lessonCode']),
      icon: _asString(json['icon']),
      titleNl: _asString(json['titleNl']),
      titleEn: _asString(json['titleEn']),
      titleFr: _asString(json['titleFr']),
      titleAr: _asString(json['titleAr']),
      descriptionNl: _asString(json['descriptionNl']),
      descriptionEn: _asString(json['descriptionEn']),
      descriptionFr: _asString(json['descriptionFr']),
      descriptionAr: _asString(json['descriptionAr']),
      displayOrder: _asInt(json['displayOrder']),
      estimatedMinutes: _asInt(json['estimatedMinutes']),
      pages: pages,
    );
  }
}

class LessonProgress {
  final int lessonId;
  final int pagesRead;
  final int? totalPages;
  final int? currentPage;
  final String status;
  final bool completed;

  const LessonProgress({
    required this.lessonId,
    required this.pagesRead,
    this.totalPages,
    this.currentPage,
    required this.status,
    required this.completed,
  });

  /// Backend stores pagesRead as the highest reached page (1-based), not a
  /// zero-based PageView index. Reopening a lesson must not advance progress.
  /// A completed lesson reopens at its final page.
  int resumePageIndex(int availablePages) {
    if (availablePages <= 1 || pagesRead <= 0) return 0;
    final reachedIndex = pagesRead - 1;
    return reachedIndex >= availablePages ? availablePages - 1 : reachedIndex;
  }

  factory LessonProgress.fromJson(Map<String, dynamic> json) {
    return LessonProgress(
      lessonId: _asInt(json['lessonId']),
      pagesRead: _asInt(json['pagesRead']),
      totalPages: _asNullableInt(json['totalPages']),
      currentPage: _asNullableInt(json['currentPage']),
      status: _asString(json['status'], fallback: 'NOT_STARTED'),
      completed: json['completed'] == true,
    );
  }
}

class LessonService {
  final ApiClient _apiClient;
  final AuthenticatedApiClient _authenticatedApiClient;

  LessonService(this._apiClient, this._authenticatedApiClient);

  Future<List<Map<String, dynamic>>> getHomeOverview(String language) async {
    final response = await _apiClient.get(
      '/api/lessons/home-overview',
      queryParameters: {'lang': language},
    );
    _ensureSuccess(response);
    if (response.data is! List) {
      throw const FormatException('Invalid lesson overview response');
    }
    final rows = (response.data as List)
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
    rows.sort(
      (a, b) => (a['displayOrder'] as num).compareTo(b['displayOrder'] as num),
    );
    return rows;
  }

  Future<List<LessonSummary>> getAllLessons() async {
    final response = await _apiClient.get('/api/lessons');
    _ensureSuccess(response);
    return _asMapList(response.data).map(LessonSummary.fromJson).toList();
  }

  Future<List<LessonSummary>> searchLessons(String query) async {
    final response = await _apiClient.get(
      '/api/lessons/search',
      queryParameters: {'q': query},
    );
    _ensureSuccess(response);
    return _asMapList(response.data).map(LessonSummary.fromJson).toList();
  }

  Future<LessonDetail> getLessonByCode(String code) async {
    final response = await _apiClient.get(
      '/api/lessons/${Uri.encodeComponent(code)}',
    );
    _ensureSuccess(response);
    return LessonDetail.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<LessonProgress> getLessonProgress(String code) async {
    final response = await _authenticatedApiClient.get(
      '/api/lessons/${Uri.encodeComponent(code)}/progress',
    );
    _ensureSuccess(response);
    return LessonProgress.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<LessonProgress> markPageRead(
    String code,
    int totalPages,
    int pageNumber,
  ) async {
    final response = await _authenticatedApiClient.post(
      '/api/lessons/${Uri.encodeComponent(code)}/progress',
      data: {'totalPages': totalPages, 'pageNumber': pageNumber},
    );
    _ensureSuccess(response);
    return LessonProgress.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  static void _ensureSuccess(Response response) {
    if (response.statusCode == null ||
        response.statusCode! < 200 ||
        response.statusCode! >= 300) {
      throw Exception('Lesson request failed (${response.statusCode})');
    }
  }
}

String _localized(
  String language, {
  required String ar,
  required String nl,
  required String fr,
  required String en,
}) {
  final value = switch (language) {
    'ar' => ar,
    'nl' => nl,
    'fr' => fr,
    _ => en,
  };
  return value.isNotEmpty ? value : en;
}

int _asInt(Object? value, {int fallback = 0}) => switch (value) {
  int number => number,
  num number => number.toInt(),
  String text => int.tryParse(text) ?? fallback,
  _ => fallback,
};

int? _asNullableInt(Object? value) => value == null ? null : _asInt(value);

String _asString(Object? value, {String fallback = ''}) =>
    value is String ? value : value?.toString() ?? fallback;

String? _asNullableString(Object? value) {
  final text = _asString(value).trim();
  return text.isEmpty ? null : text;
}

List<Map<String, dynamic>> _asMapList(Object? value) => value is List
    ? value
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList()
    : const [];

String _resolveImageUrl(String url) {
  return ApiConstants.resolveMediaUrl(url) ?? url;
}
