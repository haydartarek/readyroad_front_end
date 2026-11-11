import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/entities/session_validation_failure.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/repositories/verified_session_cache.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/auth_response_model.dart';
import '../models/user_model.dart';

/// Server responses are authoritative. A verified, encrypted identity snapshot
/// is used only to keep the UI mounted while revalidation is unavailable.
class AuthRepositoryImpl implements AuthRepository, VerifiedSessionCache {
  final AuthRemoteDataSource remoteDataSource;
  final SecureStorageService secureStorage;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.secureStorage,
  });

  Future<User> _persistLogin(AuthResponseModel response) async {
    final model = UserModel.fromJson(response.user);
    if (response.accessToken.isEmpty ||
        model.id.isEmpty ||
        model.email.isEmpty) {
      throw const FormatException('Incomplete authentication response');
    }
    // A successful new login replaces every credential from the old account,
    // including a stale refresh token. Failed login leaves the old account intact.
    await secureStorage.clearAuth();
    await _saveVerifiedIdentity(model);
    if (response.refreshToken != null && response.refreshToken!.isNotEmpty) {
      await secureStorage.saveRefreshToken(response.refreshToken!);
    }
    await secureStorage.saveAccessToken(response.accessToken);
    return model.toEntity();
  }

  Future<void> _saveVerifiedIdentity(UserModel model) async {
    if (model.id.isEmpty || model.email.isEmpty) {
      throw const FormatException('Invalid verified user identity');
    }
    await secureStorage.saveVerifiedUserSnapshot(jsonEncode(model.toJson()));
    await secureStorage.saveUserId(model.id);
    await secureStorage.saveUserEmail(model.email);
  }

  @override
  Future<User> login(String email, String password) async =>
      _persistLogin(await remoteDataSource.login(email, password));

  @override
  Future<User> register(
    String username,
    String email,
    String password,
    String name,
  ) async => _persistLogin(
    await remoteDataSource.register(username, email, password, name),
  );

  @override
  Future<void> logout() async {
    try {
      await remoteDataSource.logout();
    } finally {
      // Explicit logout is the user's choice, even without network access.
      await secureStorage.clearAuth();
    }
  }

  @override
  Future<User?> getCurrentUser() async {
    if (!await isAuthenticated()) return null;
    try {
      final model = await remoteDataSource.getCurrentUser();
      // Never cache an incomplete/anonymous response as an authenticated user.
      await _saveVerifiedIdentity(model);
      return model.toEntity();
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        await secureStorage.clearAuth();
        return null;
      }
      throw SessionValidationFailure(_classify(error));
    } on FormatException {
      throw const SessionValidationFailure(SessionValidationIssue.unexpected);
    } catch (_) {
      // Unexpected network, parsing, or storage errors must not log users out.
      throw const SessionValidationFailure(SessionValidationIssue.unexpected);
    }
  }

  @override
  Future<User?> getCachedVerifiedUser() async {
    if (!await isAuthenticated()) return null;
    try {
      final encoded = await secureStorage.getVerifiedUserSnapshot();
      if (encoded == null) return null;
      final json = jsonDecode(encoded);
      if (json is! Map<String, dynamic>) return null;
      final model = UserModel.fromJson(json);
      if (model.id.isEmpty || model.email.isEmpty) return null;
      final savedId = await secureStorage.getUserId();
      final savedEmail = await secureStorage.getUserEmail();
      if (savedId != model.id || savedEmail != model.email) return null;
      return model.toEntity();
    } catch (_) {
      return null; // A corrupt cache is not proof of a valid login.
    }
  }

  @override
  Future<bool> isAuthenticated() => secureStorage.isAuthenticated();

  @override
  Future<void> refreshToken() async {
    final refresh = await secureStorage.getRefreshToken();
    if (refresh == null || refresh.isEmpty) {
      throw StateError('No refresh token available');
    }
    try {
      final response = await remoteDataSource.refreshToken(refresh);
      if (response.accessToken.isEmpty) {
        throw const FormatException('Empty refreshed access token');
      }
      if (response.refreshToken != null && response.refreshToken!.isNotEmpty) {
        await secureStorage.saveRefreshToken(response.refreshToken!);
      }
      await secureStorage.saveAccessToken(response.accessToken);
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        await secureStorage.clearAuth();
      }
      rethrow;
    }
  }

  static SessionValidationIssue _classify(DioException error) {
    if (error.response?.statusCode == 403) {
      return SessionValidationIssue.forbidden;
    }
    if (const [502, 503, 504].contains(error.response?.statusCode)) {
      return SessionValidationIssue.serverUnavailable;
    }
    if (const [
      DioExceptionType.connectionError,
      DioExceptionType.connectionTimeout,
      DioExceptionType.sendTimeout,
      DioExceptionType.receiveTimeout,
    ].contains(error.type)) {
      return SessionValidationIssue.offline;
    }
    return SessionValidationIssue.unexpected;
  }
}
