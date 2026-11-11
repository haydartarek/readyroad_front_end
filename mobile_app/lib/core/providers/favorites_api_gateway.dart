import 'package:dio/dio.dart';
import '../network/authenticated_api_client.dart';

abstract class FavoritesRemoteGateway {
  Future<Set<int>> load(String expectedUserId);
  Future<void> add(String expectedUserId, int signId);
  Future<void> remove(String expectedUserId, int signId);
}

/// User-scoped requests: JWT determines account and expectedUserId prevents
/// a request issued just before logout/login from mutating a different user.
class FavoritesApiGateway implements FavoritesRemoteGateway {
  final AuthenticatedApiClient _client;
  FavoritesApiGateway(this._client);

  static const path = '/api/users/me/favorites';
  Options _options(String userId) => Options(headers: {
    'X-Expected-User-Id': userId,
  });

  @override
  Future<Set<int>> load(String expectedUserId) async {
    final result = await _client.get(path, options: _options(expectedUserId));
    if (result.data is! List) {
      throw const FormatException('Invalid favorites response');
    }
    final ids = <int>{};
    for (final value in result.data as List) {
      if (value is! num || value.toInt() != value || value <= 0) {
        throw const FormatException('Invalid favorite sign ID');
      }
      ids.add(value.toInt());
    }
    return ids;
  }

  @override
  Future<void> add(String expectedUserId, int signId) async {
    await _client.put('$path/$signId', options: _options(expectedUserId));
  }

  @override
  Future<void> remove(String expectedUserId, int signId) async {
    await _client.delete('$path/$signId', options: _options(expectedUserId));
  }
}
