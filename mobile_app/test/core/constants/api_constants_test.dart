import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/core/constants/api_constants.dart';

void main() {
  test('routes legacy public storage media through the local backend', () {
    const legacyUrl =
        'https://project.supabase.co/storage/v1/object/public/rijvia-public/'
        'images/lessons/les-0/page%201.png';

    expect(
      ApiConstants.resolveMediaUrl(legacyUrl),
      'http://10.0.2.2:8890/images/lessons/les-0/page%201.png',
    );
  });

  test('preserves unrelated absolute media URLs', () {
    const externalUrl = 'https://cdn.example.com/assets/logo.png';
    const unrelatedSignUrl = 'https://cdn.example.com/images/signs/logo.png';

    expect(ApiConstants.resolveMediaUrl(externalUrl), externalUrl);
    expect(ApiConstants.resolveMediaUrl(unrelatedSignUrl), unrelatedSignUrl);
  });
}
