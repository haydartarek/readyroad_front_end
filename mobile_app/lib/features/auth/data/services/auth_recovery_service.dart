import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/authenticated_api_client.dart';

/// Client for the unauthenticated password recovery endpoints.
class AuthRecoveryService {
  final AuthenticatedApiClient _apiClient;

  AuthRecoveryService(this._apiClient);

  Future<void> requestReset(String email) async {
    try {
      await _apiClient.post(
        '${ApiConstants.apiVersion}/auth/forgot-password',
        data: {'email': email},
      );
    } on DioException catch (error) {
      throw StateError(_message(error, 'Password reset request failed'));
    }
  }

  Future<void> resetPassword(String token, String newPassword) async {
    try {
      await _apiClient.post(
        '${ApiConstants.apiVersion}/auth/reset-password',
        data: {'token': token, 'newPassword': newPassword},
      );
    } on DioException catch (error) {
      throw StateError(_message(error, 'Password reset failed'));
    }
  }

  String _message(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map && data['error'] is String) {
      return data['error'] as String;
    }
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
    return fallback;
  }
}
