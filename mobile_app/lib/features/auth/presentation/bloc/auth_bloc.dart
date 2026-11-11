import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../data/services/google_oauth_service.dart';
import '../../data/services/social_auth_service.dart';
import '../../domain/entities/session_validation_failure.dart';
import '../../domain/entities/user.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/get_current_user_usecase.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/repositories/verified_session_cache.dart';
import 'auth_event.dart';
import 'auth_state.dart';

/// One application-scoped owner of login and session validation.
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase loginUseCase;
  final LogoutUseCase logoutUseCase;
  final GetCurrentUserUseCase getCurrentUserUseCase;
  final AuthRepository authRepository;
  final GoogleOAuthService? googleOAuth;
  final SocialAuthService? socialAuth;
  bool _googleSigningIn = false;

  // Prevent an older HTTP response from overwriting a newer login/logout.
  int _revision = 0;

  AuthBloc({
    required this.loginUseCase,
    required this.logoutUseCase,
    required this.getCurrentUserUseCase,
    required this.authRepository,
    this.googleOAuth,
    this.socialAuth,
  }) : super(AuthInitial()) {
    on<LoginEvent>(_onLogin);
    on<RegisterEvent>(_onRegister);
    on<LogoutEvent>(_onLogout);
    on<CheckAuthEvent>(_onCheckAuth);
    on<GetCurrentUserEvent>(_onGetCurrentUser);
    on<GoogleSignInEvent>(_onGoogleSignIn);
    on<GoogleCallbackEvent>(_onGoogleCallback);
  }

  Future<void> _onGoogleSignIn(
    GoogleSignInEvent event,
    Emitter<AuthState> emit,
  ) async {
    if (state is AuthLoading || state is Authenticated) return;
    final revision = ++_revision;
    emit(AuthLoading());
    try {
      if (googleOAuth == null) {
        throw const GoogleAuthFailure('auth.google.unavailable');
      }
      await googleOAuth!.start(event.language);
      if (revision == _revision) emit(Unauthenticated());
    } catch (error) {
      if (revision == _revision) _emitGoogleError(emit, error);
    }
  }

  Future<void> _onGoogleCallback(
    GoogleCallbackEvent event,
    Emitter<AuthState> emit,
  ) async {
    final revision = ++_revision;
    _googleSigningIn = true;
    emit(AuthLoading());
    try {
      if (event.failureKey != null) throw GoogleAuthFailure(event.failureKey!);
      final callback = event.callback!;
      if (socialAuth == null) {
        throw const GoogleAuthFailure('auth.google.unavailable');
      }
      final owner = callback.linkOwnerId;
      if (owner != null) {
        final current = await getCurrentUserUseCase();
        if (current?.id != owner || revision != _revision) {
          throw const GoogleAuthFailure('auth.google.invalid_callback');
        }
      }
      final user = owner == null
          ? await socialAuth!.exchangeGoogleCode(
              code: callback.code,
              redirectUri: callback.redirectUri,
              codeVerifier: callback.codeVerifier,
              preferredLanguage: callback.preferredLanguage,
              isCurrent: () => revision == _revision,
            )
          : await socialAuth!.linkGoogleIdentity(
              code: callback.code,
              redirectUri: callback.redirectUri,
              codeVerifier: callback.codeVerifier,
            );
      if (revision == _revision) emit(Authenticated(user));
    } catch (error) {
      if (revision == _revision) _emitGoogleError(emit, error);
    } finally {
      if (revision == _revision) _googleSigningIn = false;
    }
  }

  void _emitGoogleError(Emitter<AuthState> emit, Object error) {
    var key = error is GoogleAuthFailure
        ? error.messageKey
        : 'auth.google.failed';
    if (error is DioException && error.response?.data is Map) {
      final data = error.response!.data as Map;
      final code = data['code'] ?? data['error'];
      if (code == 'ACCOUNT_EXISTS_WITH_PASSWORD') {
        key = 'auth.google.account_exists';
      }
      if (code == 'GOOGLE_EMAIL_NOT_VERIFIED') {
        key = 'auth.google.email_unverified';
      }
      if (code == 'SOCIAL_AUTH_UNAVAILABLE') {
        key = 'auth.google.unavailable';
      }
    }
    if (error is DioException &&
        (error.type == DioExceptionType.connectionError ||
            error.type == DioExceptionType.connectionTimeout ||
            error.type == DioExceptionType.sendTimeout ||
            error.type == DioExceptionType.receiveTimeout ||
            [502, 504].contains(error.response?.statusCode) ||
            (error.response?.statusCode == 503 &&
                key != 'auth.google.unavailable'))) {
      key = 'auth.google.server_unavailable';
    }
    // Never display authorization codes, request bodies, or provider internals.
    emit(AuthError(key, messageKey: key));
  }

  Future<void> _onLogin(LoginEvent event, Emitter<AuthState> emit) async {
    final revision = ++_revision;
    emit(AuthLoading());
    try {
      final user = await loginUseCase(event.email, event.password);
      if (revision == _revision) emit(Authenticated(user));
    } catch (error) {
      if (revision == _revision) emit(AuthError(error.toString()));
    }
  }

  Future<void> _onRegister(RegisterEvent event, Emitter<AuthState> emit) async {
    final revision = ++_revision;
    emit(AuthLoading());
    try {
      final user = await authRepository.register(
        event.username,
        event.email,
        event.password,
        event.name,
      );
      if (revision == _revision) emit(Authenticated(user));
    } catch (error) {
      // Never immediately replace the visible registration error with logout.
      if (revision == _revision) emit(AuthError(error.toString()));
    }
  }

  Future<void> _onLogout(LogoutEvent event, Emitter<AuthState> emit) async {
    final revision = ++_revision;
    _googleSigningIn = false;
    googleOAuth?.cancel();
    emit(AuthLoading());
    try {
      await socialAuth?.finishSessionWrite();
      await logoutUseCase();
    } catch (_) {
      // The repository clears local credentials on explicit logout, even if
      // the server is unreachable. Never leave the UI falsely authenticated.
    }
    if (revision == _revision) emit(Unauthenticated());
  }

  Future<void> _onCheckAuth(
    CheckAuthEvent event,
    Emitter<AuthState> emit,
  ) async {
    if (_googleSigningIn) return;
    final revision = ++_revision;
    // Do not flash Login/Loading while revalidating an already visible home.
    final previousUser = state is Authenticated
        ? (state as Authenticated).user
        : null;
    if (previousUser == null) emit(AuthLoading());
    await _revalidate(emit, revision);
  }

  Future<void> _onGetCurrentUser(
    GetCurrentUserEvent event,
    Emitter<AuthState> emit,
  ) async {
    if (_googleSigningIn) return;
    final revision = ++_revision;
    await _revalidate(emit, revision);
  }

  Future<void> _revalidate(Emitter<AuthState> emit, int revision) async {
    try {
      if (!await authRepository.isAuthenticated()) {
        if (revision == _revision) emit(Unauthenticated());
        return;
      }
      final user = await getCurrentUserUseCase();
      if (revision != _revision) return;
      if (user == null) {
        // Null is reserved for no token or server-confirmed 401.
        emit(Unauthenticated());
      } else {
        emit(Authenticated(user));
      }
    } on SessionValidationFailure catch (error) {
      await _retainPendingSession(emit, revision, error.issue);
    } catch (_) {
      await _retainPendingSession(
        emit,
        revision,
        SessionValidationIssue.unexpected,
      );
    }
  }

  Future<void> _retainPendingSession(
    Emitter<AuthState> emit,
    int revision,
    SessionValidationIssue issue,
  ) async {
    // If a concurrent interceptor rejected the JWT, never restore an old user.
    User? cached;
    try {
      if (await authRepository.isAuthenticated()) {
        if (authRepository is VerifiedSessionCache) {
          cached = await (authRepository as VerifiedSessionCache)
              .getCachedVerifiedUser();
        }
      }
    } catch (_) {
      // Storage failures are not proof that the token was revoked.
    }
    if (revision != _revision) return;
    bool hasToken;
    try {
      hasToken = await authRepository.isAuthenticated();
    } catch (_) {
      emit(AuthRevalidationRequired(issue));
      return;
    }
    if (!hasToken) {
      emit(Unauthenticated());
    } else if (cached != null) {
      emit(Authenticated(cached, validationIssue: issue));
    } else {
      // Even a previous in-memory user cannot override secure storage
      // cannot confirm the same persisted identity.
      emit(AuthRevalidationRequired(issue));
    }
  }
}
