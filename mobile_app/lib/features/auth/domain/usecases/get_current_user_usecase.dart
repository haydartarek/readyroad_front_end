import '../entities/user.dart';
import '../repositories/auth_repository.dart';

/// Get Current User Use Case
/// Single responsibility: retrieve current authenticated user
class GetCurrentUserUseCase {
  final AuthRepository repository;

  GetCurrentUserUseCase(this.repository);

  Future<User?> call() async {
    return await repository.getCurrentUser();
  }
}
