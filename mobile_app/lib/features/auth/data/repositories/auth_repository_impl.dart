import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/user_model.dart';

/// Auth Repository Implementation (data layer)
/// Implements auth operations using remote data source and secure storage
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SecureStorageService secureStorage;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.secureStorage,
  });

  @override
  Future<User> login(String email, String password) async {
    try {
      // Call API
      final authResponse = await remoteDataSource.login(email, password);

      // Save tokens securely
      await secureStorage.saveAccessToken(authResponse.accessToken);
      if (authResponse.refreshToken != null) {
        await secureStorage.saveRefreshToken(authResponse.refreshToken!);
      }

      // Save user info
      final userModel = UserModel.fromJson(authResponse.user);
      await secureStorage.saveUserId(userModel.id);
      await secureStorage.saveUserEmail(userModel.email);

      // Return domain entity
      return userModel.toEntity();
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<User> register(String email, String password, String name) async {
    try {
      // Call API
      final authResponse = await remoteDataSource.register(
        email,
        password,
        name,
      );

      // Save tokens securely
      await secureStorage.saveAccessToken(authResponse.accessToken);
      if (authResponse.refreshToken != null) {
        await secureStorage.saveRefreshToken(authResponse.refreshToken!);
      }

      // Save user info
      final userModel = UserModel.fromJson(authResponse.user);
      await secureStorage.saveUserId(userModel.id);
      await secureStorage.saveUserEmail(userModel.email);

      // Return domain entity
      return userModel.toEntity();
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<void> logout() async {
    try {
      // Clear all auth data from secure storage
      await secureStorage.clearAuth();
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<User?> getCurrentUser() async {
    try {
      // Check if authenticated
      final isAuth = await isAuthenticated();
      if (!isAuth) {
        return null;
      }

      // Get user from API
      final userModel = await remoteDataSource.getCurrentUser();
      return userModel.toEntity();
    } catch (e) {
      // If failed, clear auth and return null
      await secureStorage.clearAuth();
      return null;
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    return await secureStorage.isAuthenticated();
  }

  @override
  Future<void> refreshToken() async {
    try {
      // Get refresh token
      final refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken == null) {
        throw Exception('No refresh token available');
      }

      // Call refresh API
      final authResponse = await remoteDataSource.refreshToken(refreshToken);

      // Save new access token
      await secureStorage.saveAccessToken(authResponse.accessToken);

      // Save new refresh token if provided
      if (authResponse.refreshToken != null) {
        await secureStorage.saveRefreshToken(authResponse.refreshToken!);
      }
    } catch (e) {
      // If refresh fails, clear auth
      await secureStorage.clearAuth();
      rethrow;
    }
  }
}
