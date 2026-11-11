import 'package:flutter/services.dart';
import 'package:mobile_app/core/constants/app_theme.dart';

/// Use the production font files so layout tests exercise real glyph metrics.
Future<void> loadAppFonts() async {
  final fonts = FontLoader(AppTheme.fontFamily)
    ..addFont(rootBundle.load('assets/fonts/tajawal/Tajawal-Medium.ttf'))
    ..addFont(rootBundle.load('assets/fonts/tajawal/Tajawal-Bold.ttf'));
  await fonts.load();
  // Widget captures must use Flutter's icon glyphs instead of a text fallback.
  final icons = FontLoader('MaterialIcons')
    ..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
  await icons.load();
}
