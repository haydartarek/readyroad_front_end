import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show DateFormat, NumberFormat;

import '../../core/localization/app_localizations.dart';

/// View-only mapping. Backend identifiers, scores and dates stay untouched.
abstract final class ProgressPresentation {
  static const patterns = {
    'SIGN_CONFUSION': 'sign_confusion',
    'SUPPLEMENTARY_IGNORED': 'supplementary_ignored',
    'PRIORITY_MISUNDERSTANDING': 'priority_misunderstanding',
    'SPEED_LIMIT_ERROR': 'speed_limit_error',
    'ZONE_CONFUSION': 'zone_confusion',
    'RULE_OVERGENERALIZATION': 'rule_overgeneralization',
  };

  static String patternTitle(Object? code, AppLocalizations t) =>
      t.t('error_patterns.pattern_${patterns[code] ?? 'other'}');
  static String patternDescription(Object? code, AppLocalizations t) =>
      t.t('error_patterns.desc_${patterns[code] ?? 'default'}');

  static String activityType(Object? code, AppLocalizations t) =>
      t.t(switch (code) {
        'THEORY_EXAM' => 'dashboard.activity_exam_label',
        'SIGN_PRACTICE' => 'dashboard.activity_practice_label',
        'SIGN_EXAM' => 'signs.exam',
        'RANDOM_SIGN_EXAM' => 'dashboard.activity_sign_exam_label',
        _ => 'dashboard.activity_other',
      });

  static String status(Object? code, AppLocalizations t) {
    const known = ['IN_PROGRESS', 'EXPIRED', 'ABANDONED', 'COMPLETED'];
    return t.t(
      known.contains(code)
          ? 'dashboard.activity_status_${code.toString().toLowerCase()}'
          : 'dashboard.activity_status_other',
    );
  }

  static String dataStatus(Object? code, AppLocalizations t) => t.t(
    code == 'LIMITED'
        ? 'dashboard.data_status_limited'
        : 'dashboard.data_status_other',
  );

  static String date(Object? value, String language) {
    final parsed = value is DateTime
        ? value
        : DateTime.tryParse(value?.toString() ?? '');
    if (parsed == null) return '—';
    return DateFormat.yMMMd(language).add_Hm().format(parsed.toLocal());
  }

  static String percentage(Object? value, String language) =>
      value is num ? '${NumberFormat('0.#', language).format(value)}%' : '—';

  static String subject(Map<String, dynamic> data, AppLocalizations t) {
    final language = t.locale.languageCode;
    final suffix = language[0].toUpperCase() + language.substring(1);
    for (final field in [
      'categoryName$suffix',
      'signName$suffix',
      'name$suffix',
      'categoryName',
    ]) {
      final text = data[field]?.toString();
      if (text != null && text.isNotEmpty) return text;
    }
    final question =
        data['questionText$suffix'] ??
        data['questionTextEn'] ??
        data['questionText'];
    return question == null
        ? (data['signCode']?.toString() ?? '—')
        : '${t.t('dashboard.question_text')}: $question';
  }

  static String? localizedText(
    Map<String, dynamic> data,
    String base,
    String language,
  ) {
    final suffix = language[0].toUpperCase() + language.substring(1);
    for (final field in [
      '$base$suffix',
      '${base}En',
      '${base}Nl',
      '${base}Fr',
      '${base}Ar',
      base,
    ]) {
      final value = data[field];
      if (value is String && value.isNotEmpty) return value;
    }
    return null;
  }

  static String activityScore(Map<String, dynamic> data, AppLocalizations t) {
    if (data['scorePercentage'] is num) {
      return '${t.t('exam.score')}: ${percentage(data['scorePercentage'], t.locale.languageCode)}';
    }
    if (data['correctAnswers'] is num && data['totalQuestions'] is num) {
      return '${t.t('exam.correct_answers')}: ${data['correctAnswers']}/${data['totalQuestions']}';
    }
    return data['score'] == null
        ? ''
        : '${t.t('exam.score')}: ${data['score']}';
  }
}

/// Keep a value, its subject and code adjacent even in a wide layout.
class ProgressDetail extends StatelessWidget {
  const ProgressDetail({
    super.key,
    required this.title,
    this.percentage,
    this.code,
    this.description,
  });
  final String title;
  final Object? percentage;
  final String? code;
  final String? description;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        Wrap(
          spacing: 12,
          runSpacing: 8,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            if (code != null && code!.isNotEmpty)
              Text(
                code!,
                textDirection: TextDirection.ltr,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            if (percentage is num)
              Text(
                ProgressPresentation.percentage(
                  percentage,
                  Localizations.localeOf(context).languageCode,
                ),
                textDirection: TextDirection.ltr,
                style: Theme.of(context).textTheme.titleSmall,
              ),
          ],
        ),
        if (description != null && description!.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(description!),
        ],
      ],
    ),
  );
}

class ErrorPatternTile extends StatelessWidget {
  const ErrorPatternTile({super.key, required this.pattern});
  final Map<String, dynamic> pattern;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.warning_amber_outlined),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      ProgressPresentation.patternTitle(
                        pattern['patternType'],
                        t,
                      ),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    Text(
                      '${pattern['currentCount'] ?? pattern['count'] ?? '—'} ${t.t('error_patterns.errors_label')}',
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  ProgressPresentation.patternDescription(
                    pattern['patternType'],
                    t,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
