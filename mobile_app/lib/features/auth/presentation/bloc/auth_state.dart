import '../../domain/entities/user.dart';

/// Auth States
abstract class AuthState {}

/// Initial state
class AuthInitial extends AuthState {}

/// Loading state
class AuthLoading extends AuthState {}

/// Authenticated state (logged in)
class Authenticated extends AuthState {
  final User user;

  Authenticated(this.user);
}

/// Unauthenticated state (logged out)
class Unauthenticated extends AuthState {}

/// Auth error state
class AuthError extends AuthState {
  final String message;

  AuthError(this.message);
}
