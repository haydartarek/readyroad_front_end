import '../../domain/entities/session_validation_failure.dart';
import '../../domain/entities/user.dart';

/// Auth states. A stored token is never treated as proof of server validation.
abstract class AuthState {}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

/// The user was verified by the server in this or a previous session.
/// When [validationIssue] is non-null, only the encrypted verified snapshot
/// is available; the client must not assume server-dependent writes succeeded.
class Authenticated extends AuthState {
  final User user;
  final SessionValidationIssue? validationIssue;

  Authenticated(this.user, {this.validationIssue});
}

class Unauthenticated extends AuthState {}

/// A token still exists, but connectivity prevented verification and there is
/// no verified cached user to display. Do not redirect to login automatically.
class AuthRevalidationRequired extends AuthState {
  final SessionValidationIssue issue;
  AuthRevalidationRequired(this.issue);
}

class AuthError extends AuthState {
  final String message;
  final String? messageKey;
  AuthError(this.message, {this.messageKey});
}
