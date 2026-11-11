import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/navigation/web_route_registry.dart';

void main() {
  test('web aliases preserve query and fragment', () {
    expect(
      WebRouteRegistry.normalize('/ar/exam/results?examId=19').toString(),
      '/exam/results?examId=19',
    );
    expect(WebRouteRegistry.normalize('/nl/privacy').path, '/privacy-policy');
    expect(WebRouteRegistry.normalize('/admin').path, '/admin/dashboard');
    expect(WebRouteRegistry.normalize('/#pricing').fragment, 'pricing');
    expect(
      WebRouteRegistry.normalize('/#/ar/exam/results?examId=19').toString(),
      '/exam/results?examId=19',
    );
  });
  test(
    'public learning entry and protected attempts follow web access rules',
    () {
      for (final path in [
        '/',
        '/lessons',
        '/lessons/les-1',
        '/traffic-signs',
        '/traffic-signs/B1',
        '/practice',
        '/practice/random',
        '/exam',
        '/exam?category=invalid',
        '/blog',
        '/videos',
        '/traffic-signs/favorites',
      ]) {
        expect(
          WebRouteRegistry.requiresAuthentication(Uri.parse(path)),
          isFalse,
          reason: path,
        );
      }
      for (final path in [
        '/exam?category=TH01',
        '/exam?category=%20th01%20',
        '/exam/123',
        '/exam/results',
        '/practice/B',
        '/traffic-signs/B1/practice',
        '/traffic-signs/B1/exam/1',
        '/dashboard',
        '/profile',
        '/assessment',
        '/checkout/success',
        '/admin/dashboard',
      ]) {
        expect(
          WebRouteRegistry.requiresAuthentication(Uri.parse(path)),
          isTrue,
          reason: path,
        );
      }
    },
  );
  test('auth return targets stay inside the application', () {
    for (final invalid in [
      null,
      '',
      'https://evil.example',
      '//evil.example',
      '/login',
      '/register',
    ]) {
      expect(WebRouteRegistry.safeReturn(invalid), '/dashboard');
    }
    expect(
      WebRouteRegistry.safeReturn('/ar/exam/14?resume=true'),
      '/exam/14?resume=true',
    );
    expect(WebRouteRegistry.normalize('https://evil.example').path, '/404');
  });
}
