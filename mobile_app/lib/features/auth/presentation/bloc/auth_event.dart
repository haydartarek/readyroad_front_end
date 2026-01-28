/// Auth Events
abstract class AuthEvent {}

/// Login event
class LoginEvent extends AuthEvent {
  final String email;
  final String password;

  LoginEvent({required this.email, required this.password});
}

/// Register event
class RegisterEvent extends AuthEvent {
  final String email;
  final String password;
  final String name;

  RegisterEvent({
    required this.email,
    required this.password,
    required this.name,
  });
}

/// Logout event
class LogoutEvent extends AuthEvent {}

/// Check auth status event
class CheckAuthEvent extends AuthEvent {}

/// Get current user event
class GetCurrentUserEvent extends AuthEvent {}
