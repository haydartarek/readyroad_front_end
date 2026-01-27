import 'package:flutter/material.dart';

/// App Theme Colors - ReadyRoad Brand Identity
class AppColors {
  // Primary Colors - ReadyRoad Orange (#DF5830)
  static const Color primary = Color(0xFFDF5830); // ReadyRoad Orange
  static const Color primaryDark = Color(0xFFC74621);
  static const Color primaryLight = Color(0xFFF17347);

  // Secondary Colors - Dark Blue (#2C3E50)
  static const Color secondary = Color(0xFF2C3E50); // Dark Blue
  static const Color secondaryDark = Color(0xFF23313E);
  static const Color secondaryLight = Color(0xFF4A6486);

  // Background
  static const Color background = Color(0xFFF5F5F5);
  static const Color surface = Color(0xFFFFFFFF);

  // Text
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);

  // Status - ReadyRoad Standard Colors
  static const Color success = Color(0xFF27AE60); // #27AE60
  static const Color error = Color(0xFFE74C3C); // #E74C3C
  static const Color warning = Color(0xFFF39C12); // #F39C12
  static const Color info = Color(0xFF3498DB); // #3498DB

  // Dark Mode Colors
  static const Color darkBackground = Color(0xFF121212);
  static const Color darkSurface = Color(0xFF1E1E1E);
  static const Color darkCard = Color(0xFF2C2C2C);
}

/// App Theme Configuration
class AppTheme {
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.light,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24), // ReadyRoad Standard: 24px
        ),
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24), // ReadyRoad Standard: 24px
      ),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.dark,
      surface: AppColors.darkSurface,
    ),
    scaffoldBackgroundColor: AppColors.darkBackground,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.darkSurface,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24), // ReadyRoad Standard: 24px
        ),
      ),
    ),
    cardTheme: CardThemeData(
      color: AppColors.darkCard,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24), // ReadyRoad Standard: 24px
      ),
    ),
  );
}
