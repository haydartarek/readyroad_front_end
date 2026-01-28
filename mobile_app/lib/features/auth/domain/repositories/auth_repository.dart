import '../entities/user.dart';

/// Authentication Repository Contract (domain layer)
/// Defines what auth operations are available, not how they work
abstract class AuthRepository {
  /// Login with email and password
  Future<User> login(String email, String password);

  /// Register new user
  Future<User> register(String email, String password, String name);

  /// Logout current user
  Future<void> logout();

  /// Get current authenticated user
  Future<User?> getCurrentUser();

  /// Check if user is authenticated
  Future<bool> isAuthenticated();

  /// Refresh access token
  Future<void> refreshToken();
}
