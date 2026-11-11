import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/constants/api_constants.dart';

void main() {
  test(
    'store API rejects development, insecure and credential-bearing URLs',
    () {
      for (final url in [
        '',
        'http://api.example.org',
        'https://localhost',
        'https://127.0.0.1',
        'https://[::1]',
        'https://10.0.2.2',
        'https://app.localhost',
        'https://name:password@api.example.org',
        'https://api.example.org?token=private',
        'https://api.example.org#token',
      ]) {
        expect(ApiConstants.isSecureReleaseEndpoint(url), isFalse, reason: url);
      }
      expect(
        ApiConstants.isSecureReleaseEndpoint('https://api.example.org'),
        isTrue,
      );
      expect(
        ApiConstants.isSecureReleaseEndpoint('https://example.org/backend'),
        isTrue,
      );
    },
  );

  test('debug config remains usable but cannot be used for release', () {
    expect(
      () => ApiConstants.validateConfiguration(release: false),
      returnsNormally,
    );
    expect(
      () => ApiConstants.validateConfiguration(release: true),
      throwsStateError,
    );
  });
}
