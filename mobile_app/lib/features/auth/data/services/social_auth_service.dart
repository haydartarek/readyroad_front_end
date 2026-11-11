import 'dart:convert';
import '../../domain/entities/user.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/user_model.dart';
import '../../../../core/storage/secure_storage_service.dart';
import 'google_oauth_service.dart';

/// Google OAuth bridge for the mobile client.
///
/// The platform OAuth layer supplies the authorization code and PKCE values;
/// this service keeps the exchange and account-linking contracts identical to
/// the backend without embedding a client secret in the app.
class SocialAuthService {
  final AuthRemoteDataSource _remoteDataSource;
  final SecureStorageService _secureStorage;
  Future<User>? _sessionWrite;

  Future<void> finishSessionWrite() async {
    try {
      await _sessionWrite;
    } catch (_) {
      /* Logout will clear any partial session. */
    }
  }

  SocialAuthService(this._remoteDataSource, this._secureStorage);

  Future<User> exchangeGoogleCode({
    required String code,
    required String redirectUri,
    required String codeVerifier,
    String? preferredLanguage,
    bool Function()? isCurrent,
  }) async {
    final response = await _remoteDataSource.exchangeGoogleCode(
      code: code,
      redirectUri: redirectUri,
      codeVerifier: codeVerifier,
      preferredLanguage: preferredLanguage,
    );
    if (isCurrent != null && !isCurrent()) {
      throw const GoogleAuthFailure('auth.google.cancelled');
    }
    return _sessionWrite = _persistAuthResponse(
      response.user,
      response.accessToken,
      response.refreshToken,
      isCurrent,
    );
  }

  Future<User> linkGoogleIdentity({
    required String code,
    required String redirectUri,
    required String codeVerifier,
  }) async {
    final model = await _remoteDataSource.linkGoogleIdentity(
      code: code,
      redirectUri: redirectUri,
      codeVerifier: codeVerifier,
    );
    return model.toEntity();
  }

  Future<User> _persistAuthResponse(
    Map<String, dynamic> user,
    String accessToken,
    String? refreshToken,
    bool Function()? isCurrent,
  ) async {
    final model = UserModel.fromJson(user);
    if (accessToken.isEmpty || model.id.isEmpty || model.email.isEmpty) {
      throw const FormatException('Incomplete Google authentication response');
    }
    final writes = <Future<void> Function()>[
      _secureStorage.clearAuth,
      () => _secureStorage.saveVerifiedUserSnapshot(jsonEncode(model.toJson())),
      () => _secureStorage.saveUserId(model.id),
      () => _secureStorage.saveUserEmail(model.email),
      if (refreshToken != null && refreshToken.isNotEmpty)
        () => _secureStorage.saveRefreshToken(refreshToken),
      () => _secureStorage.saveAccessToken(accessToken),
    ];
    for (final write in writes) {
      if (isCurrent != null && !isCurrent()) {
        throw const GoogleAuthFailure('auth.google.cancelled');
      }
      await write();
    }
    return model.toEntity();
  }
}
