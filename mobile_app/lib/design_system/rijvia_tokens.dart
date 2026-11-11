import 'package:flutter/material.dart';

import '../core/constants/app_theme.dart';

/// Shared layout roles for the Flutter implementation of the design contract.
abstract final class RijviaDesignColors {
  static const Color primary = AppColors.primary;
  static const Color navy = AppColors.secondary;
  static const Color accent = AppColors.primaryLight;
  static const Color warmCanvas = AppColors.background;
}

abstract final class RijviaDesignSpace {
  static const double micro = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double section = 48;
}

abstract final class RijviaDesignLayout {
  static const double maxContentWidth = AppTheme.contentMaxWidth;
  static const double compactBreakpoint = 600;
  static const double touchTarget = 48;
  static const double cardRadius = AppTheme.cardRadius;
  // Web lesson img.rounded-xl, ExamQuestionImageFrame and practice sign cards.
  static const double lessonImageRadius = 28;
  static const double questionImageRadius = 8;
  static const double signCardRadius = 24;
  static const double maxCardWidth = AppTheme.readingMaxWidth;
  // Preserve the density of the normal desktop rows even with one item.
  static const double lessonCardMaxWidth =
      (maxContentWidth - 2 * RijviaDesignSpace.xl - 2 * RijviaDesignSpace.md) /
      3;
  static const double categoryCardMaxWidth =
      (maxContentWidth - 2 * RijviaDesignSpace.xl - 3 * RijviaDesignSpace.md) /
      4;
}

abstract final class RijviaIcons {
  static const home = Icons.home_outlined;
  static const lessons = Icons.menu_book_outlined;
  static const practice = Icons.track_changes_outlined;
  static const exam = Icons.assignment_outlined;
  static const account = Icons.person_outline;

  static IconData lesson(String type) {
    final key = type.toLowerCase();
    if (key.contains('car') || key.contains('vehicle')) {
      return Icons.directions_car_outlined;
    }
    if (key.contains('speed')) return Icons.speed_outlined;
    if (key.contains('priority')) return Icons.change_history_outlined;
    if (key.contains('sign')) return Icons.traffic_outlined;
    if (key.contains('park')) return Icons.local_parking_outlined;
    return lessons;
  }
}
