import '../entities/user.dart';
import '../repositories/auth_repository.dart';

/// Login Use Case
/// Single responsibility: handle login business logic
class LoginUseCase {
  final AuthRepository repository;

  LoginUseCase(this.repository);

  Future<User> call(String email, String password) async {
    // Validate inputs
    if (email.isEmpty) {
      throw Exception('Email is required');
    }
    if (password.isEmpty) {
      throw Exception('Password is required');
    }
    if (!_isValidEmail(email)) {
      throw Exception('Invalid email format');
    }

    // Delegate to repository
    return await repository.login(email, password);
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }
}
