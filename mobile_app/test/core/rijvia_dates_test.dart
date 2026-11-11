import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/localization/rijvia_dates.dart';

void main() {
  test(
    'expiry uses Brussels independently of the device zone at DST boundaries',
    () {
      final springBefore = RijviaDates.brussels(
        DateTime.parse('2026-03-29T00:59:00Z'),
      );
      final springAfter = RijviaDates.brussels(
        DateTime.parse('2026-03-29T01:00:00Z'),
      );
      expect(springBefore.hour, 1);
      expect(springAfter.hour, 3);
      final autumnBefore = RijviaDates.brussels(
        DateTime.parse('2026-10-25T00:59:00Z'),
      );
      final autumnAfter = RijviaDates.brussels(
        DateTime.parse('2026-10-25T01:00:00Z'),
      );
      expect(autumnBefore.hour, 2);
      expect(autumnAfter.hour, 2);
      expect(autumnBefore.timeZoneOffset, const Duration(hours: 2));
      expect(autumnAfter.timeZoneOffset, const Duration(hours: 1));
      expect(
        springAfter.millisecondsSinceEpoch,
        DateTime.parse('2026-03-29T01:00:00Z').millisecondsSinceEpoch,
      );
    },
  );
}
