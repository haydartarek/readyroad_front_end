import '../entities/user.dart';

/// Optional capability: only repositories backed by a verified identity cache
/// may restore a user while the server is unreachable.
abstract class VerifiedSessionCache {
  Future<User?> getCachedVerifiedUser();
}
