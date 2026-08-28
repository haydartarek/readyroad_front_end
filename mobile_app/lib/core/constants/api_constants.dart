/// API Constants for RijVia Backend
class ApiConstants {
  // Local development defaults to the Android emulator host.
  // Production builds inject API_BASE_URL via --dart-define.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8890',
  );

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

  // Timeout durations
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
