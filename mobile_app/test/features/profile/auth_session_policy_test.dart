import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/network/authenticated_api_client.dart';

void main() {
  group('AuthenticatedApiClient.shouldInvalidateSession', () {
    test('invalidates an expired JWT on profile endpoint', () {
      expect(
        AuthenticatedApiClient.shouldInvalidateSession(
          statusCode: 401,
          requestPath: '/api/users/me',
          hadBearerToken: true,
        ),
        isTrue,
      );
    });

    test('invalidates an expired JWT on account access endpoint', () {
      expect(
        AuthenticatedApiClient.shouldInvalidateSession(
          statusCode: 401,
          requestPath: '/api/account/access',
          hadBearerToken: true,
        ),
        isTrue,
      );
    });

    test('does not invalidate a session for wrong login credentials', () {
      expect(
        AuthenticatedApiClient.shouldInvalidateSession(
          statusCode: 401,
          requestPath: '/api/auth/login',
          hadBearerToken: false,
        ),
        isFalse,
      );
    });

    test('does not invalidate a session for an anonymous request', () {
      expect(
        AuthenticatedApiClient.shouldInvalidateSession(
          statusCode: 401,
          requestPath: '/api/users/me',
          hadBearerToken: false,
        ),
        isFalse,
      );
    });

    test('does not confuse a 403 exam paywall with expired login', () {
      expect(
        AuthenticatedApiClient.shouldInvalidateSession(
          statusCode: 403,
          requestPath: '/api/exams/simulations/1/submit',
          hadBearerToken: true,
        ),
        isFalse,
      );
    });

    test('does not invalidate a valid authenticated request', () {
      expect(
        AuthenticatedApiClient.shouldInvalidateSession(
          statusCode: 200,
          requestPath: '/api/users/me',
          hadBearerToken: true,
        ),
        isFalse,
      );
    });
  });
}
