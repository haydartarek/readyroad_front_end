import 'package:flutter/material.dart';
import 'home_screen.dart';

/// All primary web destinations share the navbar and named-route registry.
/// Timed sessions stay on separate routes so their exit guards remain active.
class RijviaAppShell extends StatelessWidget {
  const RijviaAppShell({super.key, this.initialSection});
  final String? initialSection;
  @override
  Widget build(BuildContext context) => HomeScreen(
    initialSection: initialSection,
    onShowLessons: () => Navigator.pushNamed(context, '/lessons'),
    onShowPractice: () => Navigator.pushNamed(context, '/practice'),
  );
}
