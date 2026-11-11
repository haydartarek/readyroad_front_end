import 'package:flutter/material.dart';

class RijviaLessonCardData {
  const RijviaLessonCardData({
    required this.number,
    required this.title,
    required this.readLabel,
    required this.onRead,
    required this.colorIndex,
    this.categoryKey,
  });

  final String number;
  final String title;
  final String readLabel;
  final VoidCallback onRead;
  final int colorIndex;

  /// Retained for lesson metadata only.
  /// Category text itself is not displayed.
  final String? categoryKey;
}

class RijviaLessonGrid extends StatelessWidget {
  const RijviaLessonGrid({
    super.key,
    required this.lessons,
  });

  final List<RijviaLessonCardData> lessons;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const gap = 10.0;

        final columns = constraints.maxWidth >= 1000
            ? 4
            : constraints.maxWidth >= 700
                ? 3
                : 2;

        final cardWidth =
            (constraints.maxWidth - gap * (columns - 1)) / columns;

        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: [
            for (final lesson in lessons)
              SizedBox(
                width: cardWidth,
                child: RijviaLessonCard(data: lesson),
              ),
          ],
        );
      },
    );
  }
}

class RijviaLessonCard extends StatelessWidget {
  const RijviaLessonCard({
    super.key,
    required this.data,
  });

  final RijviaLessonCardData data;

  Color _background(BuildContext context) {
    return switch (data.colorIndex) {
      0 => const Color(0xFFB8401C),
      1 => const Color(0xFF1B2A5E),
      2 => const Color(0xFFB8401C),
      3 => const Color(0xFF2F7D5B),
      _ => const Color(0xFF1B2A5E),
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final background = _background(context);

    final textScale =
        MediaQuery.textScalerOf(context).scale(1.0);

    final extraScale =
        (textScale - 1.0).clamp(0.0, 1.0);

    // Taller normal card for improved title/number spacing.
    // Still expands for enlarged accessibility text.
    final cardHeight =
        172.0 + (75.0 * extraScale);

    return Semantics(
      button: true,
      label: data.title,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: data.onRead,
          borderRadius: BorderRadius.circular(20),
          hoverColor: Colors.transparent,
          focusColor: Colors.transparent,
          splashColor: Colors.white12,
          highlightColor: Colors.transparent,
          child: Ink(
            height: cardHeight,
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: .16),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(
                children: [
                  Positioned(
                    left: -30,
                    bottom: -34,
                    child: Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: .09),
                      ),
                    ),
                  ),

                  Positioned(
                    top: 12,
                    left: 8,
                    child: IgnorePointer(
                      child: Text(
                        data.number,
                        textDirection: TextDirection.ltr,
                        style: const TextStyle(
                          color: Color.fromRGBO(
                            255,
                            255,
                            255,
                            .22,
                          ),
                          fontSize: 48,
                          fontWeight: FontWeight.w500,
                          height: 1,
                        ),
                      ),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(
                              left: 30,
                              top: 18,
                            ),
                            child: Text(
                              data.title,
                              maxLines: 4,
                              overflow: TextOverflow.ellipsis,
                              style: theme
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 8),

                        Material(
                          color:
                              Colors.black.withValues(alpha: .24),
                          borderRadius:
                              BorderRadius.circular(999),
                          child: InkWell(
                            onTap: data.onRead,
                            borderRadius:
                                BorderRadius.circular(999),
                            hoverColor: Colors.transparent,
                            focusColor: Colors.transparent,
                            highlightColor: Colors.transparent,
                            child: ConstrainedBox(
                              constraints:
                                  const BoxConstraints(
                                minHeight: 34,
                              ),
                              child: Padding(
                                padding:
                                    const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 7,
                                ),
                                child: Center(
                                  child: Text(
                                    data.readLabel,
                                    maxLines: 2,
                                    overflow:
                                        TextOverflow.ellipsis,
                                    textAlign:
                                        TextAlign.center,
                                    style: theme
                                        .textTheme
                                        .labelMedium
                                        ?.copyWith(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight:
                                          FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class RijviaViewAllCard extends StatelessWidget {
  const RijviaViewAllCard({
    super.key,
    required this.title,
    required this.countLabel,
    required this.onTap,
  });

  final String title;
  final String countLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final textScale =
        MediaQuery.textScalerOf(context).scale(1.0);

    final extraScale =
        (textScale - 1.0).clamp(0.0, 1.0);

    final cardHeight =
        62.0 + (36.0 * extraScale);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        hoverColor: Colors.transparent,
        focusColor: Colors.transparent,
        splashColor: Colors.white12,
        highlightColor: Colors.transparent,
        child: Ink(
          height: cardHeight,
          decoration: BoxDecoration(
            color: const Color(0xFF1B2A5E),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: .16),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Stack(
              children: [
                PositionedDirectional(
                  end: -26,
                  top: -34,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color:
                          Colors.white.withValues(alpha: .08),
                    ),
                  ),
                ),

                PositionedDirectional(
                  start: 46,
                  bottom: -44,
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color:
                          Colors.white.withValues(alpha: .07),
                    ),
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          mainAxisAlignment:
                              MainAxisAlignment.center,
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              maxLines: 2,
                              overflow:
                                  TextOverflow.ellipsis,
                              style: theme
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight:
                                    FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              countLabel,
                              maxLines: 1,
                              overflow:
                                  TextOverflow.ellipsis,
                              style: theme
                                  .textTheme
                                  .labelMedium
                                  ?.copyWith(
                                color: Colors.white
                                    .withValues(alpha: .75),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(width: 12),

                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white
                              .withValues(alpha: .20),
                        ),
                        child: const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}