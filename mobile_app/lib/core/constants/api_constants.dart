import 'package:flutter/foundation.dart';

/// API Constants for RijVia Backend
class ApiConstants {
  // Chrome runs on the host machine, while the Android emulator reaches the
  // host through 10.0.2.2. Production builds inject API_BASE_URL explicitly.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:8890' : 'http://10.0.2.2:8890',
  );

  static bool isSecureReleaseEndpoint(String value) {
    final uri = Uri.tryParse(value);
    return uri != null &&
        uri.scheme == 'https' &&
        uri.host.isNotEmpty &&
        uri.userInfo.isEmpty &&
        uri.query.isEmpty &&
        uri.fragment.isEmpty &&
        !{'localhost', '127.0.0.1', '::1', '10.0.2.2'}.contains(uri.host) &&
        !uri.host.endsWith('.localhost');
  }

  static void validateConfiguration({bool release = kReleaseMode}) {
    if (release && !isSecureReleaseEndpoint(baseUrl)) {
      throw StateError(
        'Release requires an explicit HTTPS API_BASE_URL. Local development endpoints cannot be used in a store build.',
      );
    }
  }

  // API Endpoints
  static const String apiVersion = '/api';

  // Categories
  static const String categories = '$apiVersion/categories';

  // Traffic Signs
  static const String trafficSigns = '$apiVersion/traffic-signs';

  // Helper method to get full URL
  static String getFullUrl(String endpoint) {
    return '$baseUrl$endpoint';
  }

  /// Normalizes media paths returned by the API without duplicating host joins
  /// in every feature. Legacy Supabase public-media URLs are routed through
  /// the local backend only for local API builds; unrelated absolute URLs stay
  /// untouched.
  static String? resolveMediaUrl(String? path) {
    final value = path?.trim();
    if (value == null || value.isEmpty) return null;
    if (value.startsWith('data:')) {
      return value;
    }

    final localMediaUrl = _localMediaUrl(value);
    if (localMediaUrl != null) return localMediaUrl;

    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    return '$baseUrl${value.startsWith('/') ? '' : '/'}$value';
  }

  static String? _localMediaUrl(String value) {
    if (!_isLocalApiBaseUrl()) return null;

    final uri = Uri.tryParse(value);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) return null;

    if (!uri.host.toLowerCase().endsWith('.supabase.co')) return null;

    const publicPath = '/storage/v1/object/public/rijvia-public/images/';
    if (!uri.path.startsWith(publicPath)) return null;

    const mediaFamilies = <String>{'lessons', 'quiz', 'signs', 'articles'};
    for (final family in mediaFamilies) {
      final marker = '/images/$family/';
      final markerIndex = value.indexOf(marker);
      if (markerIndex >= 0) {
        final mediaPath = value.substring(markerIndex);
        final queryIndex = mediaPath.indexOf('?');
        final fragmentIndex = mediaPath.indexOf('#');
        final endIndex = [queryIndex, fragmentIndex]
            .where((index) => index >= 0)
            .fold<int>(
              mediaPath.length,
              (current, index) => index < current ? index : current,
            );
        return '$baseUrl${mediaPath.substring(0, endIndex)}';
      }
    }
    return null;
  }

  static bool _isLocalApiBaseUrl() {
    final uri = Uri.tryParse(baseUrl);
    final host = uri?.host.toLowerCase();
    return host == 'localhost' || host == '127.0.0.1' || host == '10.0.2.2';
  }

  // Timeout durations
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
