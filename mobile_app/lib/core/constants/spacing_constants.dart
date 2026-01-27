/// ReadyRoad App Spacing Constants
/// Based on design tokens from NEXTJS_COMPLETE_ARCHITECTURE.md
class AppSpacing {
  // Standard spacing scale
  static const double xs = 4.0; // Extra small
  static const double sm = 8.0; // Small
  static const double md = 16.0; // Medium (base unit)
  static const double lg = 24.0; // Large
  static const double xl = 32.0; // Extra large
  static const double xxl = 48.0; // 2X large
  static const double xxxl = 64.0; // 3X large

  // Common padding values
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;

  // Common margin values
  static const double marginSmall = 8.0;
  static const double marginMedium = 16.0;
  static const double marginLarge = 24.0;

  // Card/Container spacing
  static const double cardPadding = 16.0;
  static const double cardMargin = 16.0;
  static const double cardRadius = 24.0; // ReadyRoad Standard

  // Button spacing
  static const double buttonPaddingHorizontal = 24.0;
  static const double buttonPaddingVertical = 12.0;
  static const double buttonRadius = 24.0; // ReadyRoad Standard

  // Input field spacing
  static const double inputPadding = 16.0;
  static const double inputRadius = 12.0;

  // List item spacing
  static const double listItemPadding = 16.0;
  static const double listItemSpacing = 12.0;

  // Screen padding
  static const double screenPaddingHorizontal = 16.0;
  static const double screenPaddingVertical = 16.0;
}

/// ReadyRoad App Border Radius Constants
class AppRadius {
  static const double none = 0.0;
  static const double small = 6.0;
  static const double medium = 12.0;
  static const double large = 18.0;
  static const double xlarge = 24.0; // ReadyRoad Standard
  static const double full = 9999.0;

  // Component-specific radius
  static const double button = 24.0;
  static const double card = 24.0;
  static const double dialog = 24.0;
  static const double input = 12.0;
  static const double chip = 9999.0;
}
