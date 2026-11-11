import 'dart:convert';

import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';

/// Same notification types, message keys and localized parameters as web.
class NotificationPresentation {
  NotificationPresentation(this.item);
  final Map<String, dynamic> item;

  static const _types = {
    'EXAM_PASSED': (
      'exam_passed',
      Icons.emoji_events_outlined,
      Color(0xFF16A34A),
    ),
    'EXAM_FAILED': ('exam_failed', Icons.menu_book_outlined, Color(0xFFEF4444)),
    'EXAM_RESULT': (
      'exam_result',
      Icons.emoji_events_outlined,
      Color(0xFF2563EB),
    ),
    'WEAK_AREA': ('weak_area', Icons.warning_amber_outlined, Color(0xFFF59E0B)),
    'STREAK_ACHIEVED': (
      'streak',
      Icons.local_fire_department_outlined,
      Color(0xFFF97316),
    ),
    'ACHIEVEMENT': ('achievement', Icons.star_border, Color(0xFFEAB308)),
    'STUDY_REMINDER': ('reminder', Icons.notifications_none, Color(0xFF3B82F6)),
    'SYSTEM': ('system', Icons.info_outline, Color(0xFF64748B)),
    'ADMIN_NEW_USER': (
      'admin_new_user',
      Icons.person_add_outlined,
      Color(0xFF059669),
    ),
    'ADMIN_EXAM_STATS': (
      'admin_exam_stats',
      Icons.bar_chart_outlined,
      Color(0xFF7C3AED),
    ),
    'ADMIN_PLATFORM_ALERT': (
      'admin_alert',
      Icons.campaign_outlined,
      Color(0xFFF43F5E),
    ),
    'LESSON_PROGRESS': (
      'lesson_progress',
      Icons.menu_book_outlined,
      Color(0xFF0D9488),
    ),
    'NEXT_STEP': ('next_step', Icons.arrow_forward, Color(0xFF0891B2)),
  };

  String get type => item['type']?.toString() ?? '';
  IconData get icon => _types[type]?.$2 ?? Icons.info_outline;
  Color get color => _types[type]?.$3 ?? const Color(0xFF64748B);

  String title(AppLocalizations t) {
    final known = _types[type];
    if (known == null) return item['title']?.toString() ?? '';
    final key = 'notif.type.${known.$1}';
    final translated = t.t(key);
    return translated == key ? item['title']?.toString() ?? '' : translated;
  }

  String message(AppLocalizations t) {
    final fallback = item['message']?.toString() ?? '';
    final key = item['messageKey']?.toString();
    if (key == null || key.isEmpty) return fallback;
    final template = t.t(key);
    if (template == key) return fallback;
    try {
      final raw = item['messageParams'];
      final decoded = raw is String && raw.isNotEmpty ? jsonDecode(raw) : raw;
      if (decoded != null && decoded is! Map) return fallback;
      final params = decoded is Map
          ? Map<String, dynamic>.from(decoded)
          : <String, dynamic>{};
      final suffix = switch (t.locale.languageCode) {
        'ar' => 'Ar',
        'nl' => 'Nl',
        'fr' => 'Fr',
        _ => 'En',
      };
      if (type == 'WEAK_AREA' && params['category$suffix'] != null) {
        params['category'] = params['category$suffix'];
      }
      if ((type == 'LESSON_PROGRESS' || type == 'NEXT_STEP') &&
          params['lesson$suffix'] != null) {
        params['lesson'] = params['lesson$suffix'];
      }
      final formatted = template.replaceAllMapped(
        RegExp(r'\{([^}]+)\}'),
        (match) => params[match[1]]?.toString() ?? match[0]!,
      );
      return RegExp(r'\{[^}]+\}').hasMatch(formatted) ? fallback : formatted;
    } on FormatException {
      return fallback;
    } on TypeError {
      return fallback;
    }
  }

  String timeAgo(AppLocalizations t, DateTime now) {
    final created = DateTime.tryParse(item['createdAt']?.toString() ?? '');
    if (created == null) return '';
    final seconds = now.difference(created).inSeconds;
    if (seconds < 60) return t.t('notif.time_just_now');
    final (key, count) = seconds < 3600
        ? ('notif.time_minutes', seconds ~/ 60)
        : seconds < 86400
        ? ('notif.time_hours', seconds ~/ 3600)
        : ('notif.time_days', seconds ~/ 86400);
    return t.t(key).replaceAll('{n}', '$count');
  }
}
