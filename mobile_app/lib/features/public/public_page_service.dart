import 'package:dio/dio.dart';

import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';

/// Same published-content endpoints consumed by the web server components.
class PublicPageService {
  PublicPageService(this.api, {Dio? webClient})
    : web =
          webClient ??
          Dio(
            BaseOptions(
              baseUrl: contactOrigin,
              connectTimeout: ApiConstants.connectionTimeout,
              receiveTimeout: ApiConstants.receiveTimeout,
            ),
          );
  final ApiClient api;
  final Dio web;

  /// Only the local runner sets this; other environments retain the web URL.
  static String get contactOrigin {
    const configured = String.fromEnvironment('CONTACT_BASE_URL');
    return configured.isEmpty ? webOrigin : configured;
  }

  static String get webOrigin {
    const configured = String.fromEnvironment('WEB_BASE_URL');
    if (configured.isNotEmpty) return configured;
    final api = Uri.parse(ApiConstants.baseUrl);
    if (['localhost', '127.0.0.1', '10.0.2.2'].contains(api.host)) {
      return Uri(scheme: 'http', host: api.host, port: 3000).toString();
    }
    return 'https://rijvia.be';
  }

  Future<List<Map<String, dynamic>>> articles(String language) async {
    final response = await api.get(
      '/api/articles',
      queryParameters: {'language': language.toUpperCase()},
    );
    return (response.data as List)
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }

  Future<Map<String, dynamic>> article(String slug, String language) async {
    final response = await api.get(
      '/api/articles/${Uri.encodeComponent(slug)}',
      queryParameters: {'language': language.toUpperCase()},
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> videos({String? pageToken}) async {
    final response = await api.get(
      '/api/youtube/videos',
      queryParameters: pageToken == null ? const {} : {'pageToken': pageToken},
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> contact(Map<String, String> form, String language) async {
    final response = await web.post(
      '/api/contact',
      data: form,
      options: Options(headers: {'Accept-Language': language}),
    );
    if (response.data is! Map || response.data['success'] != true) {
      throw StateError('Contact request was not accepted');
    }
  }
}
