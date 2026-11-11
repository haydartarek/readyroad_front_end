import 'package:mobile_app/features/auth/domain/entities/user.dart';
import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/network/authenticated_api_client.dart';
import 'package:mobile_app/core/storage/secure_storage_service.dart';
import 'package:mobile_app/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:mobile_app/features/auth/data/services/google_oauth_browser_stub.dart';
import 'package:mobile_app/features/auth/data/services/google_oauth_service.dart';
import 'package:mobile_app/features/auth/data/services/social_auth_service.dart';
import 'package:mobile_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:mobile_app/features/auth/domain/usecases/get_current_user_usecase.dart';
import 'package:mobile_app/features/auth/domain/usecases/login_usecase.dart';
import 'package:mobile_app/features/auth/domain/usecases/logout_usecase.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_event.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_state.dart';

class _Browser extends GoogleOAuthBrowser {
  String? pending;
  bool clearedUrl = false;
  @override
  bool get supported => true;
  @override
  String? readPending() => pending;
  @override
  void savePending(String value) => pending = value;
  @override
  void clearPending() => pending = null;
  @override
  void clearCallbackUrl() => clearedUrl = true;
}

class _Storage extends SecureStorageService {
  String? token;
  String? snapshot;
  Completer<void>? writingToken;
  @override
  Future<void> clearAuth() async {
    token = null;
    snapshot = null;
  }

  @override
  Future<void> saveAccessToken(String value) async {
    if (writingToken != null) await writingToken!.future;
    token = value;
  }

  @override
  Future<void> saveVerifiedUserSnapshot(String value) async {
    snapshot = value;
  }

  @override
  Future<void> saveUserId(String value) async {}
  @override
  Future<void> saveUserEmail(String value) async {}
}

class _Client extends AuthenticatedApiClient {
  _Client(super.storage);
  String? path;
  Map<String, dynamic>? body;
  Completer<void>? network;
  Object? error;
  int requests = 0;
  @override
  Future<Response> post(String path, {dynamic data, Options? options}) async {
    requests++;
    this.path = path;
    body = Map<String, dynamic>.from(data as Map);
    if (network != null) await network!.future;
    if (error != null) throw error!;
    return Response(
      requestOptions: RequestOptions(path: path),
      statusCode: 200,
      data: {
        'token': 'verified-backend-token',
        'userId': 42,
        'username': 'google_learner',
        'email': 'learner@example.test',
        'fullName': 'Test Learner',
        'emailVerified': true,
        'googleLinked': true,
        'linkedProviders': ['GOOGLE'],
        'preferredLanguage': data['preferredLanguage'],
        'role': 'USER',
      },
    );
  }
}

class _Repository extends AuthRepository {
  final _Storage storage;
  _Repository(this.storage);
  User? currentUser;
  @override
  Future<User?> getCurrentUser() async => currentUser;
  @override
  Future<void> logout() => storage.clearAuth();
  @override
  Future<bool> isAuthenticated() async => storage.token != null;
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

const _callback = GoogleOAuthCallback(
  code: 'test-authorization-code',
  redirectUri: 'http://localhost:63783/auth/google/callback',
  codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
  preferredLanguage: 'ar',
);

Future<void> _wait(
  AuthBloc bloc,
  bool Function(AuthState) condition,
  AuthEvent event,
) async {
  final next = bloc.stream
      .firstWhere(condition)
      .timeout(const Duration(seconds: 3));
  bloc.add(event);
  await next;
}

void main() {
  test(
    'web login accepts username without changing email compatibility',
    () async {
      final client = _Client(_Storage());
      final remote = AuthRemoteDataSource(client);
      await remote.login('learner_name', 'test-only-password');
      expect(client.body, {
        'username': 'learner_name',
        'password': 'test-only-password',
      });
      await remote.login('learner@example.test', 'test-only-password');
      expect(client.body, {
        'email': 'learner@example.test',
        'password': 'test-only-password',
      });
    },
  );
  group('Google authorization and callback', () {
    late _Browser browser;
    late GoogleOAuthService oauth;
    late Uri launched;
    var time = DateTime.utc(2026, 10, 13);
    setUp(() {
      browser = _Browser();
      time = DateTime.utc(2026, 10, 13);
      oauth = GoogleOAuthService(
        browser: browser,
        currentUri: () => Uri.parse('http://localhost:63783/#/login'),
        now: () => time,
        launch: (uri) async {
          launched = uri;
          return true;
        },
      );
    });
    Uri callback({String? state, String? error}) =>
        Uri.parse(_callback.redirectUri).replace(
          queryParameters: {
            'state': state ?? launched.queryParameters['state']!,
            if (error != null) 'error': error else 'code': _callback.code,
          },
        );
    test('PKCE matches RFC 7636 SHA-256 vector', () {
      expect(
        GoogleOAuthService.challengeFor(_callback.codeVerifier),
        'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
      );
    });
    test(
      'opens Google and consumes matching callback once with locale',
      () async {
        await oauth.start('ar');
        expect(launched.host, 'accounts.google.com');
        expect(launched.queryParameters['scope'], 'openid email profile');
        expect(launched.queryParameters['code_challenge_method'], 'S256');
        expect(launched.queryParameters['redirect_uri'], _callback.redirectUri);
        final stored = jsonDecode(browser.pending!) as Map;
        expect(launched.toString(), isNot(contains(stored['verifier'])));
        expect(
          launched.queryParameters['code_challenge'],
          GoogleOAuthService.challengeFor(stored['verifier']),
        );
        final returned = callback();
        final result = oauth.consumeCallback(returned);
        expect(result.preferredLanguage, 'ar');
        expect(result.codeVerifier, stored['verifier']);
        expect(browser.pending, isNull);
        expect(browser.clearedUrl, isTrue);
        expect(
          () => oauth.consumeCallback(returned),
          throwsA(isA<GoogleAuthFailure>()),
        );
      },
    );
    test(
      'retains a safe learning destination through Google redirect',
      () async {
        for (final entry in {
          '/#/login?returnUrl=%2Fexam%2F19': '/exam/19',
          '/#/practice/B': '/practice/B',
          '/login?returnUrl=https%3A%2F%2Fevil.example': '/dashboard',
        }.entries) {
          oauth = GoogleOAuthService(
            browser: browser,
            currentUri: () => Uri.parse('http://localhost:63783${entry.key}'),
            now: () => time,
            launch: (uri) async {
              launched = uri;
              return true;
            },
          );
          await oauth.start('ar');
          expect(oauth.consumeCallback(callback()).returnPath, entry.value);
        }
      },
    );
    test('link intent is bound to saved owner, not callback query', () async {
      await oauth.start('en', linkOwnerId: '42');
      final returned = callback().replace(
        queryParameters: {...callback().queryParameters, 'linkOwnerId': '99'},
      );
      expect(oauth.consumeCallback(returned).linkOwnerId, '42');
      await oauth.start('en');
      expect(
        oauth
            .consumeCallback(
              callback().replace(
                queryParameters: {
                  ...callback().queryParameters,
                  'linkOwnerId': '99',
                },
              ),
            )
            .linkOwnerId,
        isNull,
      );
    });
    test('rejects state mismatch before code exchange', () async {
      await oauth.start('en');
      expect(
        () => oauth.consumeCallback(callback(state: 'foreign-state')),
        throwsA(isA<GoogleAuthFailure>()),
      );
      expect(browser.pending, isNull);
    });
    test('rejects a different callback origin', () async {
      await oauth.start('en');
      expect(
        () => oauth.consumeCallback(callback().replace(port: 3000)),
        throwsA(isA<GoogleAuthFailure>()),
      );
    });
    test('rejects expired callback', () async {
      await oauth.start('nl');
      time = time.add(const Duration(minutes: 11));
      expect(
        () => oauth.consumeCallback(callback()),
        throwsA(isA<GoogleAuthFailure>()),
      );
    });
    test('cancellation clears pending values and URL', () async {
      await oauth.start('fr');
      expect(
        () => oauth.consumeCallback(callback(error: 'access_denied')),
        throwsA(
          isA<GoogleAuthFailure>().having(
            (e) => e.messageKey,
            'message',
            'auth.google.cancelled',
          ),
        ),
      );
      expect(browser.pending, isNull);
      expect(browser.clearedUrl, isTrue);
    });
    test('rejects duplicate authorization codes', () async {
      await oauth.start('en');
      final returned = Uri.parse('${callback()}&code=another-code');
      expect(
        () => oauth.consumeCallback(returned),
        throwsA(isA<GoogleAuthFailure>()),
      );
    });
    test('failed browser launch clears PKCE state', () async {
      oauth = GoogleOAuthService(
        browser: browser,
        currentUri: () => Uri.parse('http://localhost:63783/'),
        launch: (_) async => false,
      );
      await expectLater(oauth.start('ar'), throwsA(isA<GoogleAuthFailure>()));
      expect(browser.pending, isNull);
    });
    test('logout cancellation invalidates a later callback', () async {
      await oauth.start('en');
      final returned = callback();
      oauth.cancel();
      expect(
        () => oauth.consumeCallback(returned),
        throwsA(isA<GoogleAuthFailure>()),
      );
    });
  });

  group('Shared backend and application session', () {
    late _Storage storage;
    late _Client client;
    late AuthBloc bloc;
    late _Repository repository;
    setUp(() {
      storage = _Storage();
      client = _Client(storage);
      repository = _Repository(storage);
      bloc = AuthBloc(
        loginUseCase: LoginUseCase(repository),
        logoutUseCase: LogoutUseCase(repository),
        getCurrentUserUseCase: GetCurrentUserUseCase(repository),
        authRepository: repository,
        socialAuth: SocialAuthService(AuthRemoteDataSource(client), storage),
      );
    });
    tearDown(() => bloc.close());
    test(
      'Google linking uses current owner and keeps existing token',
      () async {
        storage.token = 'existing-owner-token';
        repository.currentUser = User(
          id: '42',
          username: 'learner',
          email: 'learner@example.test',
          name: 'Learner',
          role: 'USER',
        );
        final linked = GoogleOAuthCallback(
          code: _callback.code,
          redirectUri: _callback.redirectUri,
          codeVerifier: _callback.codeVerifier,
          preferredLanguage: 'en',
          linkOwnerId: '42',
        );
        await _wait(
          bloc,
          (s) => s is Authenticated,
          GoogleCallbackEvent(linked),
        );
        expect(client.path, '/api/users/me/auth-identities/google/link');
        expect(storage.token, 'existing-owner-token');
        expect(client.requests, 1);
      },
    );
    test('Google linking rejects a changed owner before exchange', () async {
      repository.currentUser = User(
        id: '99',
        username: 'other',
        email: 'other@example.test',
        name: 'Other',
        role: 'USER',
      );
      final linked = GoogleOAuthCallback(
        code: _callback.code,
        redirectUri: _callback.redirectUri,
        codeVerifier: _callback.codeVerifier,
        preferredLanguage: 'en',
        linkOwnerId: '42',
      );
      await _wait(bloc, (s) => s is AuthError, GoogleCallbackEvent(linked));
      expect(client.requests, 0);
      expect(
        (bloc.state as AuthError).messageKey,
        'auth.google.invalid_callback',
      );
    });
    test(
      'Google login uses web contract and persists verified backend identity',
      () async {
        await _wait(
          bloc,
          (state) => state is Authenticated,
          GoogleCallbackEvent(_callback),
        );
        expect(client.path, '/api/auth/google/exchange');
        expect(client.body, {
          'code': _callback.code,
          'redirectUri': _callback.redirectUri,
          'codeVerifier': _callback.codeVerifier,
          'preferredLanguage': 'ar',
        });
        expect(storage.token, 'verified-backend-token');
        expect((bloc.state as Authenticated).user.id, '42');
        expect(jsonDecode(storage.snapshot!)['email'], 'learner@example.test');
      },
    );
    test(
      'account collision requires password login and does not save a token',
      () async {
        client.error = DioException(
          requestOptions: RequestOptions(path: '/api/auth/google/exchange'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/auth/google/exchange'),
            statusCode: 409,
            data: {'error': 'ACCOUNT_EXISTS_WITH_PASSWORD'},
          ),
        );
        await _wait(
          bloc,
          (state) => state is AuthError,
          GoogleCallbackEvent(_callback),
        );
        expect(
          (bloc.state as AuthError).messageKey,
          'auth.google.account_exists',
        );
        expect(storage.token, isNull);
      },
    );
    for (final type in [
      DioExceptionType.connectionError,
      DioExceptionType.connectionTimeout,
      DioExceptionType.sendTimeout,
      DioExceptionType.receiveTimeout,
    ]) {
      test(
        '$type ends Google loading without automatically retrying the code',
        () async {
          client.error = DioException(
            requestOptions: RequestOptions(path: '/api/auth/google/exchange'),
            type: type,
          );
          await _wait(
            bloc,
            (state) => state is AuthError,
            GoogleCallbackEvent(_callback),
          );
          expect(
            (bloc.state as AuthError).messageKey,
            'auth.google.server_unavailable',
          );
          expect(client.requests, 1);
          expect(storage.token, isNull);
        },
      );
    }
    for (final status in [502, 503, 504]) {
      test(
        'HTTP $status reports backend unavailable without saving a session',
        () async {
          final options = RequestOptions(path: '/api/auth/google/exchange');
          client.error = DioException(
            requestOptions: options,
            response: Response(requestOptions: options, statusCode: status),
          );
          await _wait(
            bloc,
            (state) => state is AuthError,
            GoogleCallbackEvent(_callback),
          );
          expect(
            (bloc.state as AuthError).messageKey,
            'auth.google.server_unavailable',
          );
          expect(client.requests, 1);
          expect(storage.token, isNull);
        },
      );
    }
    test(
      'missing server OAuth configuration is distinguished from a network outage',
      () async {
        final options = RequestOptions(path: '/api/auth/google/exchange');
        client.error = DioException(
          requestOptions: options,
          response: Response(
            requestOptions: options,
            statusCode: 503,
            data: {'error': 'SOCIAL_AUTH_UNAVAILABLE'},
          ),
        );
        await _wait(
          bloc,
          (state) => state is AuthError,
          GoogleCallbackEvent(_callback),
        );
        expect((bloc.state as AuthError).messageKey, 'auth.google.unavailable');
        expect(storage.token, isNull);
      },
    );
    test(
      'logout prevents a late Google response from restoring credentials',
      () async {
        client.network = Completer<void>();
        await _wait(
          bloc,
          (state) => state is AuthLoading,
          GoogleCallbackEvent(_callback),
        );
        await _wait(bloc, (state) => state is Unauthenticated, LogoutEvent());
        client.network!.complete();
        await Future<void>.delayed(const Duration(milliseconds: 10));
        expect(bloc.state, isA<Unauthenticated>());
        expect(storage.token, isNull);
      },
    );
    test('logout also clears a credential write already in progress', () async {
      storage.writingToken = Completer<void>();
      await _wait(
        bloc,
        (state) => state is AuthLoading,
        GoogleCallbackEvent(_callback),
      );
      await Future<void>.delayed(const Duration(milliseconds: 10));
      final logout = _wait(
        bloc,
        (state) => state is Unauthenticated,
        LogoutEvent(),
      );
      await Future<void>.delayed(Duration.zero);
      storage.writingToken!.complete();
      await logout;
      expect(storage.token, isNull);
      expect(storage.snapshot, isNull);
    });
  });
}
