import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../shared/models/content_item.dart';
import 'favorites_api_gateway.dart';

/// Server-owned favorites with one-time preservation of the pre-05E local list.
/// A failed network write never changes the displayed or persisted canonical list.
class FavoritesProvider extends ChangeNotifier {
  FavoritesProvider({required FavoritesRemoteGateway gateway}) : _gateway = gateway;

  final FavoritesRemoteGateway _gateway;
  final Set<int> _favoriteIds = {};
  String? _userId;
  int _epoch = 0;
  bool _isLoaded = false;
  bool _isLoading = false;
  String? _syncError;
  Future<void> _writeTail = Future<void>.value();

  Set<int> get favoriteIds => Set<int>.unmodifiable(_favoriteIds);
  bool get isLoaded => _isLoaded;
  String? get syncError => _syncError;
  String? get boundUserId => _userId;
  int get bindingVersion => _epoch;
  int get favoritesCount => _favoriteIds.length;
  bool isFavorite(int contentId) => _favoriteIds.contains(contentId);

  /// Switching accounts clears the visible list immediately. Every async
  /// continuation checks the epoch to avoid leaking another account's values.
  Future<void> bindToUser(String? userId) async {
    final next = userId == null || userId.trim().isEmpty ? null : userId.trim();
    if (next == _userId && (_isLoaded || _isLoading)) return;
    _epoch++;
    final currentEpoch = _epoch;
    _userId = next;
    _favoriteIds.clear();
    _isLoaded = false;
    _isLoading = next != null;
    _syncError = null;
    notifyListeners();
    if (next == null) {
      // Anonymous favorites were never synchronized and are not loaded into
      // an authenticated session without explicit user ownership.
      _isLoaded = true;
      notifyListeners();
      return;
    }
    try {
      await _loadFromServer(next, currentEpoch);
    } catch (error) {
      if (!_stillBound(next, currentEpoch)) return;
      _syncError = error.toString();
      _isLoaded = false;
      _isLoading = false;
      notifyListeners();
    }
  }

  bool _stillBound(String userId, int epoch) =>
      _userId == userId && _epoch == epoch;

  /// Explicit retry always reloads; no local values are shown as server data.
  Future<void> refresh() async {
    final userId = _userId;
    final epoch = _epoch;
    if (userId == null) return;
    try {
      await _serialize(() => _loadFromServer(userId, epoch));
    } catch (error) {
      if (_stillBound(userId, epoch)) {
        _syncError = error.toString();
        notifyListeners();
      }
      rethrow;
    }
  }

  Future<void> _loadFromServer(String userId, int epoch) async {
    final server = await _gateway.load(userId);
    if (!_stillBound(userId, epoch)) return;
    final prefs = await SharedPreferences.getInstance();
    if (!_stillBound(userId, epoch)) return;
    final migrationKey = 'favorites.synced.v1.$userId';
    Set<int> canonical = server;
    if (!(prefs.getBool(migrationKey) ?? false)) {
      // Import only this user's previous local favorites, never anonymous or
      // another account's list. PUT is idempotent so retries cannot duplicate.
      final legacy = (prefs.getStringList('favorites.$userId') ?? <String>[])
          .map(int.tryParse)
          .whereType<int>()
          .where((id) => id > 0)
          .toSet();
      for (final id in legacy.difference(canonical)) {
        if (!_stillBound(userId, epoch)) return;
        await _gateway.add(userId, id);
      }
      if (!_stillBound(userId, epoch)) return;
      canonical = await _gateway.load(userId);
      if (!_stillBound(userId, epoch)) return;
      // A failed PUT/GET does not set the migration flag or erase local data.
      final written = await prefs.setBool(migrationKey, true);
      if (!written) throw StateError('Could not save favorites migration marker');
    }
    if (!_stillBound(userId, epoch)) return;
    _favoriteIds
      ..clear()
      ..addAll(canonical);
    _isLoaded = true;
    _isLoading = false;
    _syncError = null;
    notifyListeners();
    // Best-effort cache only; server data remains valid if disk cache fails.
    try {
      await prefs.setStringList('favorites.$userId',
          canonical.map((e) => '$e').toList());
    } catch (_) { /* Backend is the source of truth. */ }
  }

  Future<void> _serialize(Future<void> Function() action) {
    final completer = Completer<void>();
    _writeTail = _writeTail.then((_) async {
      try {
        await action();
        completer.complete();
      } catch (error, stackTrace) {
        completer.completeError(error, stackTrace);
      }
    });
    return completer.future;
  }

  Future<void> toggleFavorite(int signId) {
    final expectedUserId = _userId;
    final expectedEpoch = _epoch;
    return _serialize(() async {
      _requireSameUser(expectedUserId, expectedEpoch);
      await _edit(signId, add: !_favoriteIds.contains(signId),
          expectedUserId: expectedUserId!, expectedEpoch: expectedEpoch);
    });
  }

  Future<void> addFavorite(int signId) {
    final expectedUserId = _userId;
    final expectedEpoch = _epoch;
    return _serialize(() => _edit(signId, add: true,
        expectedUserId: expectedUserId, expectedEpoch: expectedEpoch));
  }

  Future<void> removeFavorite(int signId) {
    final expectedUserId = _userId;
    final expectedEpoch = _epoch;
    return _serialize(() => _edit(signId, add: false,
        expectedUserId: expectedUserId, expectedEpoch: expectedEpoch));
  }

  void _requireSameUser(String? userId, int epoch) {
    if (userId == null || !_stillBound(userId, epoch) || !_isLoaded) {
      throw StateError('Account changed or favorites not synchronized');
    }
  }

  Future<void> _edit(int signId, {required bool add,
      required String? expectedUserId, required int expectedEpoch}) async {
    if (signId <= 0) throw ArgumentError.value(signId, 'signId');
    _requireSameUser(expectedUserId, expectedEpoch);
    final userId = expectedUserId!;
    if (_favoriteIds.contains(signId) == add) return;
    try {
      if (add) {
        await _gateway.add(userId, signId);
      } else {
        await _gateway.remove(userId, signId);
      }
      if (!_stillBound(userId, expectedEpoch)) return;
      if (add) {
        _favoriteIds.add(signId);
      } else {
        _favoriteIds.remove(signId);
      }
      _syncError = null;
      notifyListeners();
      // The server write has already succeeded. A failed cache update must
      // never be reported as a failed sync or revert the server-owned value.
      try {
        final prefs = await SharedPreferences.getInstance();
        if (_stillBound(userId, expectedEpoch)) {
          await prefs.setStringList('favorites.$userId',
              _favoriteIds.map((id) => '$id').toList());
        }
      } catch (_) { /* Best-effort device cache only. */ }
    } catch (error) {
      if (_stillBound(userId, expectedEpoch)) {
        _syncError = error.toString();
        notifyListeners();
      }
      rethrow;
    }
  }

  Future<void> clearFavorites() {
    final expectedUserId = _userId;
    final expectedEpoch = _epoch;
    return _serialize(() async {
      _requireSameUser(expectedUserId, expectedEpoch);
      final userId = expectedUserId!;
      for (final id in _favoriteIds.toList()) {
        if (!_stillBound(userId, expectedEpoch)) return;
        await _gateway.remove(userId, id);
      }
      if (!_stillBound(userId, expectedEpoch)) return;
      await _loadFromServer(userId, expectedEpoch);
    });
  }

  List<ContentItem> filterFavorites(List<ContentItem> content) =>
      content.where((item) => _favoriteIds.contains(item.id)).toList();
}
