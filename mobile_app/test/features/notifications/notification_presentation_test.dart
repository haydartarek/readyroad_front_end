import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/localization/app_localizations.dart';
import 'package:mobile_app/features/notifications/notification_presentation.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  for (final entry in const {
    'ar': 'الأولوية',
    'en': 'Priority',
    'nl': 'Voorrang',
    'fr': 'Priorité',
  }.entries) {
    test(
      'notification templates and localized names match web: ${entry.key}',
      () async {
        final t = AppLocalizations(Locale(entry.key));
        await t.load();
        final message = NotificationPresentation({
          'type': 'WEAK_AREA',
          'title': 'Untranslated backend title',
          'message': 'Untranslated backend message',
          'messageKey': 'notif.msg.weak_area',
          'messageParams': jsonEncode({
            'category': 'generic category',
            'categoryAr': 'الأولوية',
            'categoryEn': 'Priority',
            'categoryNl': 'Voorrang',
            'categoryFr': 'Priorité',
          }),
        });
        expect(message.title(t), t.t('notif.type.weak_area'));
        expect(message.message(t), contains(entry.value));
        expect(message.message(t), isNot(contains('{category}')));
        for (final type in ['LESSON_PROGRESS', 'NEXT_STEP']) {
          final lesson = NotificationPresentation({
            'type': type,
            'messageKey': type == 'NEXT_STEP'
                ? 'notif.msg.next_step'
                : 'notif.msg.lesson_progress',
            'messageParams': jsonEncode({
              'lessonAr': 'الأولوية',
              'lessonEn': 'Priority',
              'lessonNl': 'Voorrang',
              'lessonFr': 'Priorité',
            }),
          });
          expect(lesson.message(t), contains(entry.value));
        }
        final score = NotificationPresentation({
          'type': 'EXAM_PASSED',
          'messageKey': 'notif.msg.exam_passed',
          'messageParams': '{"score":42,"total":50,"pct":84}',
        });
        expect(score.message(t), contains('42/50'));
        expect(score.message(t), contains('84'));
        expect(score.title(t), t.t('notif.type.exam_passed'));
      },
    );
  }
  test(
    'legacy or malformed notifications keep the actual server message',
    () async {
      final t = AppLocalizations(const Locale('ar'));
      await t.load();
      for (final params in ['invalid json', '[1,2]']) {
        final notification = NotificationPresentation({
          'type': 'CUSTOM',
          'title': 'Actual title',
          'message': 'Actual message',
          'messageKey': 'notif.msg.weak_area',
          'messageParams': params,
        });
        expect(notification.title(t), 'Actual title');
        expect(notification.message(t), 'Actual message');
      }
      expect(
        NotificationPresentation({'message': 'Actual message'}).message(t),
        'Actual message',
      );
      expect(
        NotificationPresentation({
          'message': 'Actual message',
          'messageKey': 'unknown',
        }).message(t),
        'Actual message',
      );
    },
  );
  test('relative time uses the selected language', () async {
    final t = AppLocalizations(const Locale('fr'));
    await t.load();
    final now = DateTime.utc(2026, 10, 14, 12);
    final notification = NotificationPresentation({
      'createdAt': now.subtract(const Duration(hours: 2)).toIso8601String(),
    });
    expect(
      notification.timeAgo(t, now),
      t.t('notif.time_hours').replaceAll('{n}', '2'),
    );
  });
}
