import 'package:flutter/material.dart';

/// Full-width, responsive Rijvia hero for compact screens.
///
/// Existing account, language and notification widgets are supplied
/// by HomeScreen so their real behavior is preserved.
class RijviaArcHero extends StatelessWidget {
  const RijviaArcHero({
    super.key,
    required this.account,
    required this.language,
    required this.headline,
    required this.headlineHighlight,
    required this.subtitle,
    required this.ctaLabel,
    required this.onCta,
    this.notifications,
  });

  final Widget account;
  final Widget language;
  final Widget? notifications;
  final String headline;
  final String headlineHighlight;

  // Retained for API compatibility; not displayed or measured.
  final String subtitle;

  final String ctaLabel;
  final VoidCallback onCta;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final safeTop = MediaQuery.paddingOf(context).top;
    final scaler = MediaQuery.textScalerOf(context);

    final headlineStyle = theme.textTheme.headlineMedium?.copyWith(
      color: colors.onPrimary,
      fontSize: 26,
      fontWeight: FontWeight.w900,
      height: 1.2,
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final textWidth = constraints.maxWidth > 80
            ? constraints.maxWidth - 40
            : 120.0;

        final heading = TextSpan(
          style: headlineStyle,
          children: [
            TextSpan(text: '$headline '),
            TextSpan(
              text: headlineHighlight,
              style: TextStyle(color: colors.secondary),
            ),
          ],
        );

        final headingPainter = TextPainter(
          text: heading,
          textDirection: Directionality.of(context),
          textAlign: TextAlign.center,
          textScaler: scaler,
        )..layout(maxWidth: textWidth);

        final headingHeight = headingPainter.height;
        headingPainter.dispose();

        // No subtitle or subtitle spacing.
        // Keep 38px below the title for the curved lower edge.
        // Keep enough breathing room below the translated headline.
        // The curve itself stays shallow.
        final arcHeight = safeTop +
            12 +
            52 +
            10 +
            headingHeight +
            56;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              height: arcHeight,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: CustomPaint(
                      painter: _RijviaArcBackgroundPainter(
                        fill: colors.primary,
                        border: colors.secondary,
                        shadow: colors.shadow,
                      ),
                    ),
                  ),
                  Positioned(
                    top: safeTop + 12,
                    left: 16,
                    right: 16,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Directionality(
                          textDirection: TextDirection.rtl,
                          child: Row(
                            children: [
                              _ArcCircle(child: account),
                              const Spacer(),
                              _ArcCircle(child: language),
                              if (notifications != null) ...[
                                const SizedBox(width: 8),
                                _ArcCircle(
                                  child: notifications!,
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                          ),
                          child: Text.rich(
                            heading,
                            textAlign: TextAlign.center,
                            softWrap: true,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Transform.translate(
              offset: const Offset(0, -24),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(
                    maxWidth: 660,
                  ),
                  child: _RijviaTrialCard(
                    ctaLabel: ctaLabel,
                    onCta: onCta,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
class _ArcCircle extends StatelessWidget {
  const _ArcCircle({
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      width: 52,
      height: 52,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: colors.surface,
        shape: BoxShape.circle,
        border: Border.all(
          color: colors.onPrimary.withValues(alpha: .30),
        ),
      ),
      child: IconTheme(
        data: IconThemeData(
          color: colors.onSurface,
          size: 22,
        ),
        child: child,
      ),
    );
  }
}

class _RijviaTrialCard extends StatelessWidget {
  const _RijviaTrialCard({
    required this.ctaLabel,
    required this.onCta,
  });

  final String ctaLabel;
  final VoidCallback onCta;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: .8),
        ),
        boxShadow: [
          BoxShadow(
            color: colors.shadow.withValues(alpha: .12),
            blurRadius: 16,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: onCta,
          icon: const Icon(
            Icons.play_arrow_rounded,
            size: 22,
          ),
          label: Text(
            ctaLabel,
            textAlign: TextAlign.center,
          ),
          style: FilledButton.styleFrom(
            backgroundColor: colors.primary,
            foregroundColor: colors.onPrimary,
            minimumSize: const Size.fromHeight(54),
            padding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 13,
            ),
            textStyle: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
      ),
    );
  }
}
class _RijviaArcBackgroundPainter extends CustomPainter {
  const _RijviaArcBackgroundPainter({
    required this.fill,
    required this.border,
    required this.shadow,
  });

  final Color fill;
  final Color border;
  final Color shadow;

  @override
  void paint(Canvas canvas, Size size) {
    final edgeY = size.height - 60;

    // A shallower arc: 60px from edges to lower center.
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width, edgeY)
      ..quadraticBezierTo(
        size.width / 2,
        size.height + 52,
        0,
        edgeY,
      )
      ..close();

    canvas.drawShadow(
      path,
      shadow.withValues(alpha: .12),
      6,
      false,
    );

    canvas.drawPath(
      path,
      Paint()
        ..color = fill
        ..style = PaintingStyle.fill,
    );

    canvas.drawPath(
      path,
      Paint()
        ..color = border.withValues(alpha: .20)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2,
    );
  }

  @override
  bool shouldRepaint(
    covariant _RijviaArcBackgroundPainter oldDelegate,
  ) {
    return oldDelegate.fill != fill ||
        oldDelegate.border != border ||
        oldDelegate.shadow != shadow;
  }
}
