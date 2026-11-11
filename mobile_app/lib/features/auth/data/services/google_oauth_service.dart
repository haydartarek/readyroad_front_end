import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:url_launcher/url_launcher.dart';
import 'google_oauth_browser_stub.dart'
    if (dart.library.js_interop) 'google_oauth_browser_web.dart';

class GoogleAuthFailure implements Exception {
  final String messageKey;
  const GoogleAuthFailure(this.messageKey);
}

class GoogleOAuthCallback {
  final String code;
  final String redirectUri;
  final String codeVerifier;
  final String preferredLanguage;
  final String returnPath;
  final String? linkOwnerId;
  const GoogleOAuthCallback({
    required this.code,
    required this.redirectUri,
    required this.codeVerifier,
    required this.preferredLanguage,
    this.returnPath = '/dashboard',
    this.linkOwnerId,
  });
}

/// Uses the same public web client and backend exchange as Rijvia Web.
/// Client secrets and Google tokens stay on the backend.
class GoogleOAuthService {
  static const callbackPath = '/auth/google/callback';
  static const _clientId = String.fromEnvironment(
    'GOOGLE_OAUTH_CLIENT_ID',
    defaultValue:
        '961137527798-jbeigv0l2fa6l3l5v98cl1hu9peg3hbd.apps.googleusercontent.com',
  );
  final GoogleOAuthBrowser _browser;
  final Uri Function() _currentUri;
  final DateTime Function() _now;
  final Future<bool> Function(Uri) _launch;
  final String clientId;

  GoogleOAuthService({
    GoogleOAuthBrowser? browser,
    Uri Function()? currentUri,
    DateTime Function()? now,
    Future<bool> Function(Uri)? launch,
    this.clientId = _clientId,
  }) : _browser = browser ?? GoogleOAuthBrowser(),
       _currentUri = currentUri ?? (() => Uri.base),
       _now = now ?? DateTime.now,
       _launch =
           launch ?? ((uri) => launchUrl(uri, webOnlyWindowName: '_self'));

  static String challengeFor(String verifier) => base64Url
      .encode(sha256.convert(ascii.encode(verifier)).bytes)
      .replaceAll('=', '');

  String _randomValue(int length) {
    final random = Random.secure();
    return base64Url
        .encode(List<int>.generate(length, (_) => random.nextInt(256)))
        .replaceAll('=', '');
  }

  bool isCallback(Uri uri) => uri.path == callbackPath;

  void cancel() => _browser.clearPending();

  Future<void> start(String language, {String? linkOwnerId}) async {
    if (!_browser.supported) {
      throw const GoogleAuthFailure('auth.google.native_unavailable');
    }
    final current = _currentUri();
    if (clientId.isEmpty ||
        !(current.scheme == 'https' ||
            (current.scheme == 'http' &&
                ['localhost', '127.0.0.1'].contains(current.host)))) {
      throw const GoogleAuthFailure('auth.google.unavailable');
    }
    final redirect = current.resolve(callbackPath).toString();
    final state = _randomValue(32);
    final verifier = _randomValue(48);
    final preferredLanguage = ['ar', 'en', 'nl', 'fr'].contains(language)
        ? language
        : 'en';
    final local = current.fragment.startsWith('/')
        ? Uri.parse(current.fragment)
        : current;
    final requestedReturn =
        local.queryParameters['returnUrl'] ??
        (['/', '/login', '/register'].contains(local.path)
            ? '/dashboard'
            : Uri(
                path: local.path,
                query: local.hasQuery ? local.query : null,
              ).toString());
    final returnPath = _safeReturn(requestedReturn);
    try {
      _browser.savePending(
        jsonEncode({
          'state': state,
          'linkOwnerId': ?linkOwnerId,
          'verifier': verifier,
          'redirectUri': redirect,
          'language': preferredLanguage,
          'returnPath': returnPath,
          'createdAt': _now().millisecondsSinceEpoch,
        }),
      );
      final url = Uri.https('accounts.google.com', '/o/oauth2/v2/auth', {
        'client_id': clientId,
        'redirect_uri': redirect,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state,
        'code_challenge': challengeFor(verifier),
        'code_challenge_method': 'S256',
        'prompt': 'select_account',
        'hl': preferredLanguage,
      });
      if (!await _launch(url)) {
        throw const GoogleAuthFailure('auth.google.unavailable');
      }
    } catch (_) {
      _browser.clearPending();
      throw const GoogleAuthFailure('auth.google.unavailable');
    }
  }

  GoogleOAuthCallback consumeCallback(Uri uri) {
    // Remove code/state before the app renders resources or navigates elsewhere.
    _browser.clearCallbackUrl();
    try {
      final raw = _browser.readPending();
      _browser.clearPending();
      if (!isCallback(uri) || raw == null) throw const FormatException();
      final pending = jsonDecode(raw) as Map<String, dynamic>;
      final created = pending['createdAt'] as int;
      final age = _now().millisecondsSinceEpoch - created;
      final expected = Uri.parse(pending['redirectUri'] as String);
      final actual = Uri(
        scheme: uri.scheme,
        host: uri.host,
        port: uri.hasPort ? uri.port : null,
        path: uri.path,
      );
      final verifier = pending['verifier'] as String;
      final language = pending['language'] as String;
      final states = uri.queryParametersAll['state'];
      if (age < 0 ||
          age > const Duration(minutes: 10).inMilliseconds ||
          actual != expected ||
          states == null ||
          states.length != 1 ||
          states.single != pending['state'] ||
          !RegExp(r'^[A-Za-z0-9._~-]{43,128}$').hasMatch(verifier) ||
          !['ar', 'en', 'nl', 'fr'].contains(language)) {
        throw const FormatException();
      }
      if (uri.queryParameters.containsKey('error')) {
        throw GoogleAuthFailure(
          uri.queryParameters['error'] == 'access_denied'
              ? 'auth.google.cancelled'
              : 'auth.google.failed',
        );
      }
      final codes = uri.queryParametersAll['code'];
      if (codes == null || codes.length != 1 || codes.single.isEmpty) {
        throw const FormatException();
      }
      return GoogleOAuthCallback(
        code: codes.single,
        redirectUri: expected.toString(),
        codeVerifier: verifier,
        preferredLanguage: language,
        returnPath: _safeReturn(pending['returnPath']?.toString()),
        linkOwnerId: pending['linkOwnerId'] as String?,
      );
    } on GoogleAuthFailure {
      rethrow;
    } catch (_) {
      throw const GoogleAuthFailure('auth.google.invalid_callback');
    }
  }

  static String _safeReturn(String? location) {
    final value = Uri.tryParse(location ?? '');
    if (location == null ||
        !location.startsWith('/') ||
        location.startsWith('//') ||
        value == null ||
        value.hasScheme ||
        value.hasAuthority ||
        value.path == callbackPath ||
        [
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
        ].contains(value.path)) {
      return '/dashboard';
    }
    return value.toString();
  }
}
