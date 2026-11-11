import 'package:flutter/material.dart';

/// Brand and semantic colors from web_app/src/app/globals.css.
class AppColors {
  static const primary = Color(0xFFBC3D1A);
  static const primaryDark = primary;
  static const primaryLight = Color(0xFFDF5830);
  static const secondary = Color(0xFF2C3E50);
  static const secondaryDark = Color(0xFF152132);
  static const secondaryLight = Color(0xFF3F5973);
  static const background = Color(0xFFFFFFFF);
  static const surface = Color(0xFFFFFFFF);
  static const muted = Color(0xFFF5F5F5);
  static const border = Color(0xFFE6E6E6);
  static const textPrimary = Color(0xFF171717);
  static const textSecondary = Color(0xFF6B6B6B);
  static const success = Color(0xFF27AE60);
  static const error = Color(0xFFE74D3C);
  static const warning = Color(0xFFF39C12);
  static const info = Color(0xFF3498DB);
  static const darkBackground = Color(0xFF16181D);
  static const darkSurface = Color(0xFF1F2228);
  static const darkCard = darkSurface;
  static const darkMuted = Color(0xFF282C34);
  static const darkBorder = Color(0xFF31363F);
  static const darkText = Color(0xFFF5F5F5);
  static const darkTextSecondary = Color(0xFF999999);
}

class AppTheme {
  static const String fontFamily = 'Tajawal';
  // rounded-2xl cards; --radius-md and --radius-xl in the web theme.
  static const double cardRadius = 16;
  static const double fieldRadius = 22;
  static const double buttonRadius = 28;
  static const double readingMaxWidth = 704; // --rv-reading-max: 44rem
  static const double contentMaxWidth = 1280; // --rv-content-max: 80rem

  static final ThemeData lightTheme = _build(Brightness.light);
  static final ThemeData darkTheme = _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final surface = dark ? AppColors.darkSurface : AppColors.surface;
    final background = dark ? AppColors.darkBackground : AppColors.background;
    final foreground = dark ? AppColors.darkText : AppColors.textPrimary;
    final muted = dark ? AppColors.darkMuted : AppColors.muted;
    final secondaryText = dark
        ? AppColors.darkTextSecondary
        : AppColors.textSecondary;
    final border = dark ? AppColors.darkBorder : AppColors.border;
    final secondary = dark ? AppColors.secondaryLight : AppColors.secondary;
    final selected = Color.alphaBlend(
      AppColors.primary.withValues(alpha: 0.10),
      surface,
    );
    final colors =
        ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          brightness: brightness,
        ).copyWith(
          primary: AppColors.primary,
          onPrimary: Colors.white,
          primaryContainer: selected,
          onPrimaryContainer: foreground,
          secondary: secondary,
          onSecondary: Colors.white,
          secondaryContainer: AppColors.secondary,
          onSecondaryContainer: Colors.white,
          tertiary: secondary,
          onTertiary: Colors.white,
          tertiaryContainer: muted,
          onTertiaryContainer: foreground,
          surface: surface,
          onSurface: foreground,
          onSurfaceVariant: secondaryText,
          surfaceContainerLowest: background,
          surfaceContainerLow: surface,
          surfaceContainer: surface,
          surfaceContainerHigh: muted,
          surfaceContainerHighest: muted,
          outline: border,
          outlineVariant: border,
          error: AppColors.error,
          onError: Colors.white,
          errorContainer: Color.alphaBlend(
            AppColors.error.withValues(alpha: 0.10),
            surface,
          ),
          onErrorContainer: foreground,
          surfaceTint: Colors.transparent,
        );
    final buttonShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(buttonRadius),
    );
    final buttonStyle = FilledButton.styleFrom(
      minimumSize: const Size(80, 48),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      textStyle: const TextStyle(
        fontFamily: fontFamily,
        fontSize: 16,
        height: 1.4,
        fontWeight: FontWeight.w700,
      ),
      shape: buttonShape,
    );
    final fieldBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(fieldRadius),
      borderSide: BorderSide(color: border),
    );
    return ThemeData(
      useMaterial3: true,
      fontFamily: fontFamily,
      brightness: brightness,
      colorScheme: colors,
      scaffoldBackgroundColor: background,
      focusColor: AppColors.primaryLight.withValues(alpha: 0.18),
      hoverColor: muted,
      textTheme:
          const TextTheme(
            displayLarge: TextStyle(
              fontSize: 40,
              height: 1.25,
              fontWeight: FontWeight.w700,
            ),
            displayMedium: TextStyle(
              fontSize: 36,
              height: 1.25,
              fontWeight: FontWeight.w700,
            ),
            displaySmall: TextStyle(
              fontSize: 32,
              height: 1.3,
              fontWeight: FontWeight.w700,
            ),
            headlineLarge: TextStyle(
              fontSize: 32,
              height: 1.3,
              fontWeight: FontWeight.w700,
            ),
            headlineMedium: TextStyle(
              fontSize: 28,
              height: 1.35,
              fontWeight: FontWeight.w700,
            ),
            headlineSmall: TextStyle(
              fontSize: 24,
              height: 1.4,
              fontWeight: FontWeight.w700,
            ),
            titleLarge: TextStyle(
              fontSize: 22,
              height: 1.4,
              fontWeight: FontWeight.w700,
            ),
            titleMedium: TextStyle(
              fontSize: 18,
              height: 1.5,
              fontWeight: FontWeight.w700,
            ),
            titleSmall: TextStyle(
              fontSize: 16,
              height: 1.5,
              fontWeight: FontWeight.w700,
            ),
            bodyLarge: TextStyle(
              fontSize: 16,
              height: 1.6,
              fontWeight: FontWeight.w500,
            ),
            bodyMedium: TextStyle(
              fontSize: 14,
              height: 1.5,
              fontWeight: FontWeight.w500,
            ),
            bodySmall: TextStyle(
              fontSize: 12,
              height: 1.5,
              fontWeight: FontWeight.w500,
            ),
            labelLarge: TextStyle(
              fontSize: 16,
              height: 1.4,
              fontWeight: FontWeight.w700,
            ),
            labelMedium: TextStyle(
              fontSize: 14,
              height: 1.4,
              fontWeight: FontWeight.w500,
            ),
            labelSmall: TextStyle(
              fontSize: 12,
              height: 1.4,
              fontWeight: FontWeight.w500,
            ),
          ).apply(
            fontFamily: fontFamily,
            bodyColor: foreground,
            displayColor: foreground,
          ),
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: foreground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        toolbarHeight: 64,
        titleTextStyle: TextStyle(
          fontFamily: fontFamily,
          color: foreground,
          fontSize: 20,
          height: 1.4,
          fontWeight: FontWeight.w700,
        ),
        iconTheme: IconThemeData(color: foreground, size: 24),
      ),
      iconTheme: IconThemeData(color: foreground, size: 24),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(minimumSize: const Size(48, 48)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: buttonStyle.copyWith(
          backgroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.disabled)
                ? muted
                : AppColors.primary,
          ),
          foregroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.disabled)
                ? secondaryText
                : Colors.white,
          ),
          elevation: const WidgetStatePropertyAll(0),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(style: buttonStyle),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: buttonStyle.copyWith(
          side: WidgetStatePropertyAll(BorderSide(color: border)),
          foregroundColor: WidgetStatePropertyAll(foreground),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          minimumSize: const Size(48, 48),
          foregroundColor: dark ? foreground : AppColors.primary,
          textStyle: const TextStyle(
            fontFamily: fontFamily,
            fontSize: 16,
            height: 1.4,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: background,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        errorMaxLines: 4,
        border: fieldBorder,
        enabledBorder: fieldBorder,
        focusedBorder: fieldBorder.copyWith(
          borderSide: const BorderSide(color: AppColors.primaryLight, width: 2),
        ),
      ),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 80,
        backgroundColor: surface,
        indicatorColor: selected,
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: 24,
            color: states.contains(WidgetState.selected)
                ? foreground
                : secondaryText,
          ),
        ),
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(
            fontFamily: fontFamily,
            fontSize: 14,
            height: 1.4,
            fontWeight: FontWeight.w700,
            color: foreground,
          ),
        ),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: surface,
        indicatorColor: selected,
        minWidth: 80,
        useIndicator: true,
        selectedIconTheme: IconThemeData(size: 24, color: foreground),
        unselectedIconTheme: IconThemeData(size: 24, color: secondaryText),
        selectedLabelTextStyle: TextStyle(
          fontFamily: fontFamily,
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: foreground,
        ),
        unselectedLabelTextStyle: TextStyle(
          fontFamily: fontFamily,
          fontSize: 14,
          color: secondaryText,
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
        ),
      ),
      dividerTheme: DividerThemeData(color: border, space: 1),
      chipTheme: ChipThemeData(
        backgroundColor: muted,
        selectedColor: selected,
        labelStyle: TextStyle(fontFamily: fontFamily, color: foreground),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: BorderSide.none,
      ),
      expansionTileTheme: ExpansionTileThemeData(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        childrenPadding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
        ),
        collapsedShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
        ),
        iconColor: foreground,
        collapsedIconColor: secondaryText,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: dark ? AppColors.primaryLight : AppColors.primary,
        linearTrackColor: selected,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: surface,
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
          side: BorderSide(color: border),
        ),
      ),
    );
  }
}
