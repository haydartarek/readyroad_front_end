import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:mobile_app/core/localization/app_localizations.dart';
import 'package:mobile_app/features/dashboard/progress_presentation.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  for (final language in ['ar', 'en', 'nl', 'fr']) {
    test('fourth analytics copy, units and local date $language', () async {
      await initializeDateFormatting(language);
      final t = AppLocalizations(Locale(language));
      await t.load();
      final web =
          jsonDecode(
                File(
                  '../web_app/src/messages/$language.json',
                ).readAsStringSync(),
              )
              as Map;
      for (final suffix in ProgressPresentation.patterns.values) {
        for (final prefix in ['pattern', 'desc']) {
          final key = 'error_patterns.${prefix}_$suffix';
          expect(t.t(key), web[key]);
        }
      }
      for (final status in [
        'ABANDONED',
        'EXPIRED',
        'COMPLETED',
        'IN_PROGRESS',
      ]) {
        final label = ProgressPresentation.status(status, t);
        expect(label, web['dashboard.activity_status_${status.toLowerCase()}']);
        expect(label, isNot(status));
      }
      for (final code in [
        'THEORY_EXAM',
        'SIGN_PRACTICE',
        'SIGN_EXAM',
        'RANDOM_SIGN_EXAM',
        'UNKNOWN_INTERNAL_CODE',
      ]) {
        expect(ProgressPresentation.activityType(code, t), isNot(code));
      }
      expect(
        ProgressPresentation.patternTitle('UNKNOWN_INTERNAL_CODE', t),
        t.t('error_patterns.pattern_other'),
      );
      final data = {
        'scorePercentage': 88,
        'activityType': 'THEORY_EXAM',
        'status': 'ABANDONED',
        'startedAt': '2026-10-13T20:02:48.622573Z',
      };
      final before = jsonEncode(data);
      expect(ProgressPresentation.activityScore(data, t), contains('%'));
      expect(
        ProgressPresentation.activityScore({'score': 88}, t),
        isNot(contains('%')),
      );
      expect(
        ProgressPresentation.activityScore({
          'correctAnswers': 42,
          'totalQuestions': 50,
        }, t),
        contains('42/50'),
      );
      expect(ProgressPresentation.activityScore({}, t), isEmpty);
      final local = DateTime(2026, 10, 14, 0, 30);
      final date = ProgressPresentation.date(
        local.toUtc().toIso8601String(),
        language,
      );
      expect(date, contains('2026'));
      expect(date, contains('00:30'));
      expect(date, isNot(contains('T20:')));
      expect(ProgressPresentation.date('broken-date', language), '—');
      expect(jsonEncode(data), before);
      expect(
        ProgressPresentation.subject({
          'questionText${language[0].toUpperCase()}${language.substring(1)}':
              'unchanged question',
          'signCode': 'B22',
        }, t),
        '${t.t('dashboard.question_text')}: unchanged question',
      );
    });
  }
}
