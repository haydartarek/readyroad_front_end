import 'package:dio/dio.dart';
import '../../../../core/network/authenticated_api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/auth_response_model.dart';
import '../models/user_model.dart';

/// Auth Remote Data Source
/// Handles all authentication API calls
class AuthRemoteDataSource {
  final AuthenticatedApiClient apiClient;

  AuthRemoteDataSource(this.apiClient);

  /// Login
  Future<AuthResponseModel> login(String email, String password) async {
    try {
      final response = await apiClient.post(
        '${ApiConstants.apiVersion}/auth/login',
        data: {
          if (email.contains('@')) 'email': email else 'username': email,
          'password': password,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return AuthResponseModel.fromJson(response.data);
      } else {
        throw Exception('Login failed: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Invalid email or password');
      } else if (e.response?.statusCode == 400) {
        throw Exception('Invalid request. Please check your input.');
      }
      throw Exception('Login failed: ${e.message}');
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  /// Register
  Future<AuthResponseModel> register(
    String username,
    String email,
    String password,
    String name,
  ) async {
    try {
      final response = await apiClient.post(
        '${ApiConstants.apiVersion}/auth/register',
        data: {
          'username': username,
          'email': email,
          'fullName': name,
          'password': password,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return AuthResponseModel.fromJson(response.data);
      } else {
        throw Exception('Registration failed: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        throw Exception('Email already exists');
      } else if (e.response?.statusCode == 400) {
        throw Exception('Invalid registration data');
      }
      throw Exception('Registration failed: ${e.message}');
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }

  /// Get current user. Preserve DioException and its HTTP status so the
  /// repository can distinguish server-rejected credentials from connectivity.
  Future<UserModel> getCurrentUser() async {
    final response = await apiClient.get('${ApiConstants.apiVersion}/users/me');
    if (response.statusCode != 200) {
      throw StateError(
        'Unexpected current-user status: ${response.statusCode}',
      );
    }
    return UserModel.fromJson(Map<String, dynamic>.from(response.data as Map));
  }

  /// Token refresh errors must retain their status, just like profile reads.
  Future<AuthResponseModel> refreshToken(String refreshToken) async {
    final response = await apiClient.post(
      '${ApiConstants.apiVersion}/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    if (response.statusCode != 200) {
      throw StateError(
        'Unexpected token-refresh status: ${response.statusCode}',
      );
    }
    return AuthResponseModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<void> logout() async {
    try {
      final response = await apiClient.post(
        '${ApiConstants.apiVersion}/auth/logout',
      );
      if (response.statusCode != 204 && response.statusCode != 200) {
        throw Exception('Logout failed: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) return;
      throw Exception('Logout failed: ${e.message}');
    }
  }

  Future<AuthResponseModel> exchangeGoogleCode({
    required String code,
    required String redirectUri,
    required String codeVerifier,
    String? preferredLanguage,
  }) async {
    final response = await apiClient.post(
      '${ApiConstants.apiVersion}/auth/google/exchange',
      data: {
        'code': code,
        'redirectUri': redirectUri,
        'codeVerifier': codeVerifier,
        'preferredLanguage': ?preferredLanguage,
      },
    );
    if (response.statusCode != 200) {
      throw Exception('Google sign-in failed: ${response.statusMessage}');
    }
    return AuthResponseModel.fromJson(response.data);
  }

  Future<UserModel> linkGoogleIdentity({
    required String code,
    required String redirectUri,
    required String codeVerifier,
  }) async {
    final response = await apiClient.post(
      '${ApiConstants.apiVersion}/users/me/auth-identities/google/link',
      data: {
        'code': code,
        'redirectUri': redirectUri,
        'codeVerifier': codeVerifier,
      },
    );
    if (response.statusCode != 200) {
      throw Exception(
        'Google account linking failed: ${response.statusMessage}',
      );
    }
    return UserModel.fromJson(Map<String, dynamic>.from(response.data as Map));
  }
}
