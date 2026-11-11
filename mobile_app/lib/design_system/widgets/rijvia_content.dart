import 'package:flutter/material.dart';

import '../rijvia_tokens.dart';

/// Constrains broad layouts without affecting the app's global navigation.
/// Place inside the current screen's existing scrollable when necessary.
class RijviaContent extends StatelessWidget {
  const RijviaContent({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact =
            constraints.maxWidth < RijviaDesignLayout.compactBreakpoint;
        return Align(
          alignment: AlignmentDirectional.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              maxWidth: RijviaDesignLayout.maxContentWidth,
            ),
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: compact
                    ? RijviaDesignSpace.md
                    : RijviaDesignSpace.lg,
              ),
              child: child,
            ),
          ),
        );
      },
    );
  }
}

/// Keeps scrollable page bodies readable on wide screens without changing
/// their existing scroll physics or data flow.
class RijviaScrollFrame extends StatelessWidget {
  const RijviaScrollFrame({
    super.key,
    required this.child,
    this.maxWidth = RijviaDesignLayout.maxContentWidth,
  });

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth.clamp(0.0, maxWidth);
        return Align(
          alignment: AlignmentDirectional.topCenter,
          child: SizedBox(
            width: width,
            height: constraints.hasBoundedHeight ? constraints.maxHeight : null,
            child: child,
          ),
        );
      },
    );
  }
}
