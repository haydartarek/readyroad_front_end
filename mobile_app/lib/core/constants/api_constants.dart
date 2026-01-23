/// API Constants for ReadyRoad Backend
class ApiConstants {
  // Base URL - Change this to match your backend
  // For Android Emulator use: 10.0.2.2
  // For real device use: your computer's IP address
  static const String baseUrl = 'http://10.0.2.2:8888';

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

