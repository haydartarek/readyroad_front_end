import '../repositories/auth_repository.dart';

/// Logout Use Case
/// Single responsibility: handle logout business logic
class LogoutUseCase {
  final AuthRepository repository;

  LogoutUseCase(this.repository);

  Future<void> call() async {
    await repository.logout();
  }
}
