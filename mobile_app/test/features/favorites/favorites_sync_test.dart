import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app/core/providers/favorites_api_gateway.dart';
import 'package:mobile_app/core/providers/favorites_provider.dart';

class _FakeGateway implements FavoritesRemoteGateway {
  final Map<String, Set<int>> byUser = {};
  bool offline = false;
  Completer<Set<int>>? delayedLoad;
  int additions = 0;
  int removals = 0;
  @override
  Future<Set<int>> load(String userId) async {
    if (offline) throw Exception('offline');
    if (delayedLoad != null) return delayedLoad!.future;
    return {...byUser[userId] ?? <int>{}};
  }
  @override
  Future<void> add(String userId, int id) async {
    if (offline) throw Exception('offline');
    additions++;
    byUser.putIfAbsent(userId, () => <int>{}).add(id);
  }
  @override
  Future<void> remove(String userId, int id) async {
    if (offline) throw Exception('offline');
    removals++;
    byUser.putIfAbsent(userId, () => <int>{}).remove(id);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));
  test('fetches canonical list from server', () async {
    final fake = _FakeGateway()..byUser['1'] = {12, 13};
    final provider = FavoritesProvider(gateway: fake);
    await provider.bindToUser('1');
    expect(provider.favoriteIds, {12, 13});
    expect(provider.isLoaded, true);
  });
  test('imports existing user favorites once without duplicate inserts', () async {
    SharedPreferences.setMockInitialValues({'favorites.1': ['12', '13']});
    final fake = _FakeGateway()..byUser['1'] = {12};
    final provider = FavoritesProvider(gateway: fake);
    await provider.bindToUser('1');
    expect(provider.favoriteIds, {12, 13});
    expect(fake.additions, 1);
    await provider.refresh();
    expect(fake.additions, 1);
  });
  test('migrates only the correct user, never anonymous values', () async {
    SharedPreferences.setMockInitialValues({
      'favorites.anonymous': ['99'], 'favorites.2': ['7'],
    });
    final fake = _FakeGateway();
    final provider = FavoritesProvider(gateway: fake);
    await provider.bindToUser('2');
    expect(provider.favoriteIds, {7});
    expect(fake.byUser['2'], {7});
  });
  test('offline loading does not display local list as synchronized', () async {
    SharedPreferences.setMockInitialValues({'favorites.1': ['55']});
    final fake = _FakeGateway()..offline = true;
    final provider = FavoritesProvider(gateway: fake);
    await provider.bindToUser('1');
    expect(provider.isLoaded, false);
    expect(provider.favoriteIds, isEmpty);
    expect(provider.syncError, isNotNull);
  });
  test('failed server write does not optimistically persist', () async {
    final fake = _FakeGateway()..byUser['1'] = {12};
    final provider = FavoritesProvider(gateway: fake);
    await provider.bindToUser('1');
    fake.offline = true;
    await expectLater(provider.toggleFavorite(12), throwsException);
    expect(provider.favoriteIds, {12});
  });
  test('add, remove and clear are backed by remote calls', () async {
    final fake = _FakeGateway();
    final provider = FavoritesProvider(gateway: fake);
    await provider.bindToUser('1');
    await provider.addFavorite(10);
    expect(fake.byUser['1'], {10});
    await provider.removeFavorite(10);
    expect(fake.byUser['1'], isEmpty);
    await provider.addFavorite(10);
    await provider.addFavorite(11);
    await provider.clearFavorites();
    expect(fake.byUser['1'], isEmpty);
    expect(provider.favoriteIds, isEmpty);
  });
  test('switching users removes previous account values immediately', () async {
    final fake = _FakeGateway()
      ..byUser['1'] = {10}
      ..byUser['2'] = {20};
    final provider = FavoritesProvider(gateway: fake);
    await provider.bindToUser('1');
    final waiting = provider.bindToUser('2');
    expect(provider.favoriteIds, isEmpty);
    await waiting;
    expect(provider.favoriteIds, {20});
  });
  test('late response from prior user cannot overwrite new user', () async {
    final fake = _FakeGateway();
    final held = Completer<Set<int>>();
    fake.delayedLoad = held;
    final provider = FavoritesProvider(gateway: fake);
    final old = provider.bindToUser('1');
    await Future<void>.delayed(Duration.zero);
    fake.delayedLoad = null;
    fake.byUser['2'] = {20};
    await provider.bindToUser('2');
    held.complete({10});
    await old;
    expect(provider.favoriteIds, {20});
  });
  test('queued old-account mutation never targets newly signed-in user', () async {
    final fake = _FakeGateway()..byUser['1'] = {10};
    final provider = FavoritesProvider(gateway: fake);
    await provider.bindToUser('1');
    final first = provider.addFavorite(11);
    final firstExpectation = expectLater(first, throwsStateError);
    final stale = provider.addFavorite(12);
    final expectedStale = expectLater(stale, throwsStateError);
    await provider.bindToUser('2');
    await firstExpectation;
    await expectedStale;
    expect(fake.byUser['2'], isNull);
  });
}
