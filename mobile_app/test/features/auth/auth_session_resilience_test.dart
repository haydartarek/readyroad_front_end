import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/network/authenticated_api_client.dart';
import 'package:mobile_app/core/storage/secure_storage_service.dart';
import 'package:mobile_app/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:mobile_app/features/auth/data/models/auth_response_model.dart';
import 'package:mobile_app/features/auth/data/models/user_model.dart';
import 'package:mobile_app/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:mobile_app/features/auth/domain/entities/session_validation_failure.dart';
import 'package:mobile_app/features/auth/domain/usecases/get_current_user_usecase.dart';
import 'package:mobile_app/features/auth/domain/usecases/login_usecase.dart';
import 'package:mobile_app/features/auth/domain/usecases/logout_usecase.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_event.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_state.dart';

class _Storage extends SecureStorageService {
  String? token;
  String? refresh;
  String? userId;
  String? userEmail;
  String? snapshot;
  int clears = 0;

  @override
  Future<String?> getAccessToken() async => token;
  @override
  Future<void> saveAccessToken(String value) async { token = value; }
  @override
  Future<String?> getRefreshToken() async => refresh;
  @override
  Future<void> saveRefreshToken(String value) async { refresh = value; }
  @override
  Future<String?> getUserId() async => userId;
  @override
  Future<void> saveUserId(String value) async { userId = value; }
  @override
  Future<String?> getUserEmail() async => userEmail;
  @override
  Future<void> saveUserEmail(String value) async { userEmail = value; }
  @override
  Future<String?> getVerifiedUserSnapshot() async => snapshot;
  @override
  Future<void> saveVerifiedUserSnapshot(String value) async { snapshot = value; }
  @override
  Future<bool> isAuthenticated() async => token != null && token!.isNotEmpty;
  @override
  Future<void> clearAuth() async {
    clears++;
    token = null;
    refresh = null;
    userId = null;
    userEmail = null;
    snapshot = null;
  }
}

UserModel _user([String name = 'QA Learner']) => UserModel(
  id: '42', username: 'qa_local', email: 'qa@example.test', name: name,
);

class _Remote extends AuthRemoteDataSource {
  _Remote(_Storage storage) : super(AuthenticatedApiClient(storage));
  Object? error;
  Object? loginError;
  UserModel current = _user();
  AuthResponseModel auth = AuthResponseModel(
    accessToken: 'token-from-backend', user: _user().toJson(),
  );

  @override
  Future<UserModel> getCurrentUser() async {
    if (error != null) throw error!;
    return current;
  }

  @override
  Future<AuthResponseModel> login(String email, String password) async {
    if (loginError != null) throw loginError!;
    return auth;
  }

  @override
  Future<AuthResponseModel> register(
    String username, String email, String password, String name,
  ) async => auth;

  @override
  Future<AuthResponseModel> refreshToken(String value) async {
    if (error != null) throw error!;
    return auth;
  }

  @override
  Future<void> logout() async {
    if (error != null) throw error!;
  }
}

DioException _http(int status) {
  final req = RequestOptions(path: '/api/users/me');
  return DioException(
    requestOptions: req,
    type: DioExceptionType.badResponse,
    response: Response(requestOptions: req, statusCode: status),
  );
}

DioException _offline() => DioException(
  requestOptions: RequestOptions(path: '/api/users/me'),
  type: DioExceptionType.connectionError,
);

Future<void> _seed(_Storage storage) async {
  await storage.saveUserId('42');
  await storage.saveUserEmail('qa@example.test');
  await storage.saveVerifiedUserSnapshot(jsonEncode(_user().toJson()));
  await storage.saveAccessToken('saved-token');
  await storage.saveRefreshToken('saved-refresh');
}

AuthBloc _bloc(AuthRepositoryImpl repo) => AuthBloc(
  loginUseCase: LoginUseCase(repo),
  logoutUseCase: LogoutUseCase(repo),
  getCurrentUserUseCase: GetCurrentUserUseCase(repo),
  authRepository: repo,
);

void main() {
  group('Fix 05A: persisted authentication semantics', () {
    test('200 refreshes verified identity and retains token', () async {
      final store = _Storage();
      await _seed(store);
      final remote = _Remote(store)..current = _user('Updated Name');
      final repo = AuthRepositoryImpl(remoteDataSource: remote, secureStorage: store);
      final user = await repo.getCurrentUser();
      expect(user?.name, 'Updated Name');
      expect((await repo.getCachedVerifiedUser())?.name, 'Updated Name');
      expect(store.token, 'saved-token');
      expect(store.clears, 0);
    });

    test('401 clears every credential and rejects cached identity', () async {
      final store = _Storage();
      await _seed(store);
      final repo = AuthRepositoryImpl(
        remoteDataSource: _Remote(store)..error = _http(401),
        secureStorage: store,
      );
      expect(await repo.getCurrentUser(), isNull);
      expect(store.token, isNull);
      expect(store.snapshot, isNull);
      expect(store.refresh, isNull);
      expect(await repo.getCachedVerifiedUser(), isNull);
    });

    for (final variant in <(String, Object, SessionValidationIssue)>[
      ('403', _http(403), SessionValidationIssue.forbidden),
      ('502', _http(502), SessionValidationIssue.serverUnavailable),
      ('offline', _offline(), SessionValidationIssue.offline),
    ]) {
      test('${variant.$1} preserves token and verified snapshot', () async {
        final store = _Storage();
        await _seed(store);
        final repo = AuthRepositoryImpl(
          remoteDataSource: _Remote(store)..error = variant.$2,
          secureStorage: store,
        );
        await expectLater(
          repo.getCurrentUser(),
          throwsA(isA<SessionValidationFailure>()
              .having((e) => e.issue, 'issue', variant.$3)),
        );
        expect(store.token, 'saved-token');
        expect(store.refresh, 'saved-refresh');
        expect(store.clears, 0);
        expect((await repo.getCachedVerifiedUser())?.id, '42');
      });
    }

    test('500 is not an authentication denial and retains the session', () async {
      final store = _Storage();
      await _seed(store);
      final repo = AuthRepositoryImpl(
        remoteDataSource: _Remote(store)..error = _http(500),
        secureStorage: store,
      );
      await expectLater(repo.getCurrentUser(), throwsA(
        isA<SessionValidationFailure>().having(
          (e) => e.issue, 'issue', SessionValidationIssue.unexpected,
        ),
      ));
      expect(store.token, 'saved-token');
    });

    test('corrupted or cross-account snapshot is never trusted', () async {
      final store = _Storage();
      await _seed(store);
      final repo = AuthRepositoryImpl(
        remoteDataSource: _Remote(store), secureStorage: store,
      );
      store.userId = 'other-user';
      expect(await repo.getCachedVerifiedUser(), isNull);
      store.userId = '42';
      store.snapshot = '{bad json';
      expect(await repo.getCachedVerifiedUser(), isNull);
      expect(store.token, 'saved-token');
    });

    test('rejected new login leaves previously verified session untouched', () async {
      final store = _Storage();
      await _seed(store);
      final remote = _Remote(store)..loginError = _http(401);
      final repo = AuthRepositoryImpl(
        remoteDataSource: remote, secureStorage: store,
      );
      await expectLater(
        repo.login('qa@example.test', 'wrong'),
        throwsA(isA<DioException>()),
      );
      expect(store.token, 'saved-token');
      expect((await repo.getCachedVerifiedUser())?.id, '42');
    });

    test('successful login replaces old token, refresh and user', () async {
      final store = _Storage();
      await _seed(store);
      final repo = AuthRepositoryImpl(
        remoteDataSource: _Remote(store), secureStorage: store,
      );
      final user = await repo.login('qa@example.test', 'password');
      expect(user.id, '42');
      expect(store.token, 'token-from-backend');
      expect(store.refresh, isNull);
      expect((await repo.getCachedVerifiedUser())?.email, 'qa@example.test');
    });

    test('refresh 502 never removes an existing login', () async {
      final store = _Storage();
      await _seed(store);
      final repo = AuthRepositoryImpl(
        remoteDataSource: _Remote(store)..error = _http(502),
        secureStorage: store,
      );
      await expectLater(repo.refreshToken(), throwsA(isA<DioException>()));
      expect(store.token, 'saved-token');
      expect(store.refresh, 'saved-refresh');
      expect((await repo.getCachedVerifiedUser())?.id, '42');
    });

    test('refresh 403 preserves the existing token and cache', () async {
      final store = _Storage();
      await _seed(store);
      final repo = AuthRepositoryImpl(
        remoteDataSource: _Remote(store)..error = _http(403),
        secureStorage: store,
      );
      await expectLater(repo.refreshToken(), throwsA(isA<DioException>()));
      expect(store.token, 'saved-token');
      expect((await repo.getCachedVerifiedUser())?.id, '42');
    });

    test('refresh 401 removes a definitively invalid session', () async {
      final store = _Storage();
      await _seed(store);
      final repo = AuthRepositoryImpl(
        remoteDataSource: _Remote(store)..error = _http(401),
        secureStorage: store,
      );
      await expectLater(repo.refreshToken(), throwsA(isA<DioException>()));
      expect(store.token, isNull);
      expect(store.snapshot, isNull);
    });
  });

  group('Fix 05A: AuthBloc startup and recovery', () {
    test('offline startup with verified snapshot stays in Home state', () async {
      final store = _Storage();
      await _seed(store);
      final remote = _Remote(store)..error = _offline();
      final bloc = _bloc(AuthRepositoryImpl(remoteDataSource: remote, secureStorage: store));
      final future = bloc.stream.firstWhere((s) => s is Authenticated);
      bloc.add(CheckAuthEvent());
      final state = (await future) as Authenticated;
      expect(state.user.id, '42');
      expect(state.validationIssue, SessionValidationIssue.offline);
      expect(store.token, 'saved-token');
      await bloc.close();
    });

    for (final variant in <(String, Object, SessionValidationIssue)>[
      ('403', _http(403), SessionValidationIssue.forbidden),
      ('502', _http(502), SessionValidationIssue.serverUnavailable),
    ]) {
      test('BLoC keeps verified user on ${variant.$1}', () async {
        final store = _Storage();
        await _seed(store);
        final remote = _Remote(store)..error = variant.$2;
        final bloc = _bloc(AuthRepositoryImpl(
          remoteDataSource: remote, secureStorage: store,
        ));
        final pending = bloc.stream.firstWhere((s) => s is Authenticated);
        bloc.add(CheckAuthEvent());
        final state = (await pending) as Authenticated;
        expect(state.user.id, '42');
        expect(state.validationIssue, variant.$3);
        expect(store.token, 'saved-token');
        await bloc.close();
      });
    }

    test('AuthBloc exposes rejected login error instead of immediate reset', () async {
      final store = _Storage();
      final remote = _Remote(store)..loginError = _http(401);
      final bloc = _bloc(AuthRepositoryImpl(
        remoteDataSource: remote, secureStorage: store,
      ));
      final errorFuture = bloc.stream.firstWhere((s) => s is AuthError);
      bloc.add(LoginEvent(email: 'qa@example.test', password: 'wrong'));
      await errorFuture;
      expect(bloc.state, isA<AuthError>());
      await bloc.close();
    });

    test('offline startup without snapshot waits for retry, not login', () async {
      final store = _Storage()..token = 'legacy-token';
      final remote = _Remote(store)..error = _offline();
      final bloc = _bloc(AuthRepositoryImpl(remoteDataSource: remote, secureStorage: store));
      final future = bloc.stream.firstWhere((s) => s is AuthRevalidationRequired);
      bloc.add(CheckAuthEvent());
      final state = (await future) as AuthRevalidationRequired;
      expect(state.issue, SessionValidationIssue.offline);
      expect(store.token, 'legacy-token');
      await bloc.close();
    });

    test('legacy saved token revalidates after connectivity returns', () async {
      final store = _Storage()..token = 'legacy-token';
      final remote = _Remote(store)..error = _offline();
      final repo = AuthRepositoryImpl(
        remoteDataSource: remote, secureStorage: store,
      );
      final bloc = _bloc(repo);
      final pending = bloc.stream.firstWhere(
        (s) => s is AuthRevalidationRequired,
      );
      bloc.add(CheckAuthEvent());
      await pending;
      remote.error = null;
      final recovered = bloc.stream.firstWhere(
        (s) => s is Authenticated && s.validationIssue == null,
      );
      bloc.add(CheckAuthEvent());
      final state = (await recovered) as Authenticated;
      expect(state.user.id, '42');
      expect((await repo.getCachedVerifiedUser())?.id, '42');
      expect(store.token, 'legacy-token');
      await bloc.close();
    });

    test('retry after network recovery clears degraded status', () async {
      final store = _Storage();
      await _seed(store);
      final remote = _Remote(store)..error = _http(502);
      final repo = AuthRepositoryImpl(remoteDataSource: remote, secureStorage: store);
      final bloc = _bloc(repo);
      final degraded = bloc.stream.firstWhere(
        (s) => s is Authenticated && s.validationIssue != null,
      );
      bloc.add(CheckAuthEvent());
      await degraded;
      remote.error = null;
      remote.current = _user('Confirmed Again');
      final recovered = bloc.stream.firstWhere(
        (s) => s is Authenticated && s.validationIssue == null,
      );
      bloc.add(CheckAuthEvent());
      final state = (await recovered) as Authenticated;
      expect(state.user.name, 'Confirmed Again');
      expect(state.validationIssue, isNull);
      expect(store.clears, 0);
      await bloc.close();
    });

    test('server 401 logs out even after previously verified login', () async {
      final store = _Storage();
      await _seed(store);
      final remote = _Remote(store)..error = _http(401);
      final bloc = _bloc(AuthRepositoryImpl(remoteDataSource: remote, secureStorage: store));
      final loggedOut = bloc.stream.firstWhere((s) => s is Unauthenticated);
      bloc.add(CheckAuthEvent());
      await loggedOut;
      expect(store.token, isNull);
      expect(store.snapshot, isNull);
      await bloc.close();
    });

    test('explicit logout removes local session even when offline', () async {
      final store = _Storage();
      await _seed(store);
      final remote = _Remote(store)..error = _offline();
      final bloc = _bloc(AuthRepositoryImpl(remoteDataSource: remote, secureStorage: store));
      final loggedOut = bloc.stream.firstWhere((s) => s is Unauthenticated);
      bloc.add(LogoutEvent());
      await loggedOut;
      expect(store.token, isNull);
      expect(store.snapshot, isNull);
      await bloc.close();
    });
  });
}
