import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage_service.dart';

/// Enhanced API Client with JWT interceptor and auth handling
class AuthenticatedApiClient {
  late final Dio _dio;
  final SecureStorageService _secureStorage;

  // Callback for unauthorized access (401/403)
  Function()? onUnauthorized;

  static bool isServiceUnavailable(Object error) {
    if (error is DioException) {
      final status = error.response?.statusCode;
      return status == 502 ||
          status == 503 ||
          status == 504 ||
          error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout;
    }
    return false;
  }

  AuthenticatedApiClient(this._secureStorage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectionTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add JWT interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(onRequest: _onRequest, onError: _onError),
    );

    // Keep network diagnostics in debug builds without exposing tokens or
    // account data in production logs.
    if (kDebugMode) {
      _dio.interceptors.add(
        LogInterceptor(requestBody: false, responseBody: false, error: true),
      );
    }
  }

  /// Attach JWT token to every request
  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Get token from secure storage
    final token = await _secureStorage.getAccessToken();

    // Attach token if available
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    handler.next(options);
  }

  /// Invalid credentials on login/register are NOT an expired session.
  /// Only a rejected authenticated request invalidates an existing token.
  static bool shouldInvalidateSession({
    required int? statusCode,
    required String requestPath,
    required bool hadBearerToken,
  }) {
    if (statusCode != 401 || !hadBearerToken) return false;
    const authActions = <String>{
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/logout',
    };
    return !authActions.contains(requestPath);
  }

  /// Handle errors while retaining the distinction between 401 and 403.
  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final authorization = err.requestOptions.headers['Authorization'];
    final hadBearerToken =
        authorization is String &&
        authorization.startsWith('Bearer ') &&
        authorization.length > 'Bearer '.length;
    if (shouldInvalidateSession(
      statusCode: err.response?.statusCode,
      requestPath: err.requestOptions.uri.path,
      hadBearerToken: hadBearerToken,
    )) {
      await _secureStorage.clearAuth();
      onUnauthorized?.call();
    }
    handler.next(err);
  }

  /// GET Request
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters, options: options);
      return response;
    } catch (e) {
      rethrow;
    }
  }

  /// POST Request
  Future<Response> post(String path, {dynamic data, Options? options}) async {
    try {
      final response = await _dio.post(path, data: data, options: options);
      return response;
    } catch (e) {
      rethrow;
    }
  }

  /// PUT Request
  Future<Response> put(String path, {dynamic data, Options? options}) async {
    try {
      final response = await _dio.put(path, data: data, options: options);
      return response;
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> patch(String path, {dynamic data}) async {
    return _dio.patch(path, data: data);
  }

  /// DELETE Request
  Future<Response> delete(String path, {Options? options}) async {
    try {
      final response = await _dio.delete(path, options: options);
      return response;
    } catch (e) {
      rethrow;
    }
  }
}
