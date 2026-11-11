import 'package:flutter/material.dart';

import '../rijvia_tokens.dart';

/// Presentation widgets receive localized strings from their callers.
class RijviaSectionHeading extends StatelessWidget {
  const RijviaSectionHeading({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final typography = Theme.of(context).textTheme;
    final heading = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: typography.titleLarge),
        if (subtitle != null && subtitle!.isNotEmpty)
          Text(subtitle!, style: typography.bodyMedium),
      ],
    );
    return Padding(
      padding: const EdgeInsets.only(bottom: RijviaDesignSpace.sm),
      child: LayoutBuilder(
        builder: (context, box) {
          if (box.maxWidth < 640 ||
              MediaQuery.textScalerOf(context).scale(1) > 1.4) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                heading,
                if (trailing != null) ...[
                  const SizedBox(height: 8),
                  Align(
                    alignment: AlignmentDirectional.centerEnd,
                    child: trailing,
                  ),
                ],
              ],
            );
          }
          return Row(
            children: [
              Expanded(child: heading),
              if (trailing != null) ...[
                const SizedBox(width: RijviaDesignSpace.sm),
                trailing!,
              ],
            ],
          );
        },
      ),
    );
  }
}

class RijviaPanel extends StatelessWidget {
  const RijviaPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(RijviaDesignSpace.md),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(padding: padding, child: child),
  );
}

class RijviaMetricCard extends StatelessWidget {
  const RijviaMetricCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final accent =
        color ??
        (Theme.of(context).brightness == Brightness.dark
            ? RijviaDesignColors.accent
            : colors.primary);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(RijviaDesignSpace.md),
        child: Row(
          children: [
            RijviaIconBadge(icon: icon, color: accent),
            const SizedBox(width: RijviaDesignSpace.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    value,
                    textDirection: TextDirection.ltr,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Text(label, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A single icon treatment for navigation, lessons and account tiles.
class RijviaIconBadge extends StatelessWidget {
  const RijviaIconBadge({
    super.key,
    required this.icon,
    this.color,
    this.size = 44,
  });
  final IconData icon;
  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent =
        color ??
        (theme.brightness == Brightness.dark
            ? RijviaDesignColors.accent
            : theme.colorScheme.primary);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: SizedBox(
        width: size,
        height: size,
        child: Icon(icon, color: accent),
      ),
    );
  }
}

/// Each row shares its tallest card's height, including enlarged/translated text.
class RijviaAdaptiveGrid extends StatelessWidget {
  const RijviaAdaptiveGrid({
    super.key,
    required this.children,
    this.minCellWidth = 240,
    this.maxColumns = 4,
    this.columnsOverride,
    this.equalRowHeights = true,
    this.maxCellWidth = RijviaDesignLayout.maxCardWidth,
  });
  final List<Widget> children;
  final double minCellWidth;
  final int maxColumns;
  final int? columnsOverride;
  // Form fields and nested grids need normal layout, not intrinsic sizing.
  final bool equalRowHeights;

  /// Sparse desktop rows retain the normal width for this content role.
  /// Compact layouts keep the available width for long localized titles.
  final double maxCellWidth;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      if (children.isEmpty) return const SizedBox.shrink();
      const gap = RijviaDesignSpace.md;
      final columns =
          columnsOverride ??
          ((constraints.maxWidth + gap) / (minCellWidth + gap)).floor().clamp(
            1,
            maxColumns.clamp(1, children.length),
          );
      final limit = constraints.maxWidth >= RijviaDesignLayout.compactBreakpoint
          ? maxCellWidth
          : double.infinity;
      final width = ((constraints.maxWidth - gap * (columns - 1)) / columns)
          .clamp(0.0, limit);
      return Column(
        children: [
          for (var start = 0; start < children.length; start += columns) ...[
            if (start > 0) const SizedBox(height: gap),
            _row(
              Row(
                crossAxisAlignment: equalRowHeights
                    ? CrossAxisAlignment.stretch
                    : CrossAxisAlignment.start,
                children: [
                  for (var offset = 0; offset < columns; offset++) ...[
                    if (offset > 0) const SizedBox(width: gap),
                    SizedBox(
                      width: width,
                      child: start + offset < children.length
                          ? children[start + offset]
                          : null,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      );
    },
  );

  Widget _row(Widget child) =>
      equalRowHeights ? IntrinsicHeight(child: child) : child;
}

class RijviaTopicCard extends StatelessWidget {
  const RijviaTopicCard({
    super.key,
    required this.title,
    this.icon,
    this.image,
    required this.onTap,
    this.subtitle,
    this.progress,
    this.selected = false,
    this.compact = false,
  });
  final String title;
  final String? subtitle;
  final IconData? icon;
  final Widget? image;
  final VoidCallback onTap;
  final double? progress;
  final bool selected;
  final bool compact;

  @override
  Widget build(BuildContext context) => Card(
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(RijviaDesignLayout.signCardRadius),
      side: BorderSide(
        color: selected
            ? Theme.of(context).colorScheme.primary
            : Theme.of(context).colorScheme.outlineVariant,
        width: selected ? 2 : 1,
      ),
    ),
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: RijviaDesignSpace.md,
          vertical: compact ? RijviaDesignSpace.xs : RijviaDesignSpace.md,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (image != null || icon != null) ...[
                  if (image != null) image! else RijviaIconBadge(icon: icon!),
                  const SizedBox(width: RijviaDesignSpace.md),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      if (subtitle != null && subtitle!.isNotEmpty) ...[
                        const SizedBox(height: RijviaDesignSpace.micro),
                        Text(
                          subtitle!,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            if (progress != null) ...[
              const Spacer(),
              SizedBox(
                height: compact ? RijviaDesignSpace.xs : RijviaDesignSpace.sm,
              ),
              LinearProgressIndicator(value: progress!.clamp(0, 1)),
            ],
          ],
        ),
      ),
    ),
  );
}

/// Every indicator is an actual navigation control, with a 48px touch target.
class RijviaPagerIndicator extends StatelessWidget {
  final int count;
  final int selected;
  final ValueChanged<int> onSelected;
  const RijviaPagerIndicator({
    super.key,
    required this.count,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      for (var index = 0; index < count; index++)
        IconButton(
          key: ValueKey('story-page-$index'),
          tooltip: '${index + 1}/$count',
          isSelected: index == selected,
          onPressed: () => onSelected(index),
          icon: Icon(
            Icons.circle,
            size: index == selected ? 10 : 8,
            color: index == selected
                ? Theme.of(context).colorScheme.primary
                : Theme.of(context).colorScheme.outlineVariant,
          ),
        ),
    ],
  );
}

class RijviaProgressRing extends StatelessWidget {
  const RijviaProgressRing({
    super.key,
    required this.value,
    required this.label,
    this.caption,
    this.color,
    this.size = 150,
  });
  final double value;
  final String label;
  final String? caption;
  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final labelStyle = Theme.of(
      context,
    ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800);
    final captionStyle = Theme.of(context).textTheme.bodySmall;
    final scaler = MediaQuery.textScalerOf(context);
    TextPainter measure(String text, TextStyle? style) => TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: Directionality.of(context),
      textScaler: scaler,
    )..layout();
    final labelSize = measure(label, labelStyle).size;
    final captionSize = caption == null
        ? Size.zero
        : measure(caption!, captionStyle).size;
    // The circle grows with its contents, including accessibility text scaling.
    final dimension = [
      size,
      labelSize.width + 36,
      captionSize.width + 36,
      labelSize.height + captionSize.height + 36,
    ].reduce((a, b) => a > b ? a : b);
    return Semantics(
      label: [label, ?caption].join(' '),
      child: SizedBox.square(
        dimension: dimension,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned.fill(
              child: CircularProgressIndicator(
                value: value.clamp(0, 1),
                strokeWidth: 9,
                strokeCap: StrokeCap.round,
                color: color ?? Theme.of(context).colorScheme.primary,
                backgroundColor: Theme.of(context).colorScheme.outlineVariant,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(label, textAlign: TextAlign.center, style: labelStyle),
                  if (caption != null)
                    Text(
                      caption!,
                      textDirection: RegExp(r'^[\d\s/%.]+$').hasMatch(caption!)
                          ? TextDirection.ltr
                          : null,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class RijviaStatusBadge extends StatelessWidget {
  const RijviaStatusBadge({
    super.key,
    required this.label,
    required this.icon,
    required this.color,
  });

  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class RijviaNotice extends StatelessWidget {
  const RijviaNotice({
    super.key,
    required this.message,
    this.icon = Icons.info_outline,
  });

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(RijviaDesignLayout.cardRadius),
      ),
      child: Padding(
        padding: const EdgeInsets.all(RijviaDesignSpace.md),
        child: Row(
          children: [
            Icon(icon, size: 20, color: colors.onSurfaceVariant),
            const SizedBox(width: RijviaDesignSpace.sm),
            Expanded(child: Text(message)),
          ],
        ),
      ),
    );
  }
}

class RijviaEmptyState extends StatelessWidget {
  const RijviaEmptyState({
    super.key,
    required this.title,
    required this.description,
    required this.icon,
    this.action,
  });

  final String title;
  final String description;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final typography = Theme.of(context).textTheme;
    final colors = Theme.of(context).colorScheme;
    return RijviaPanel(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: colors.primary, size: 32),
              const SizedBox(width: RijviaDesignSpace.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: typography.titleMedium),
                    const SizedBox(height: RijviaDesignSpace.xs),
                    Text(description, style: typography.bodyMedium),
                  ],
                ),
              ),
            ],
          ),
          if (action != null) ...[
            const SizedBox(height: RijviaDesignSpace.md),
            action!,
          ],
        ],
      ),
    );
  }
}
