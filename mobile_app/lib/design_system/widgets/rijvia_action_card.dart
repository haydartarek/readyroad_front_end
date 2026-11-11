import 'package:flutter/material.dart';

import '../rijvia_tokens.dart';

/// Presentation-only action. Production screens retain their own callbacks.
class RijviaActionCard extends StatelessWidget {
  const RijviaActionCard({
    super.key,
    required this.title,
    required this.icon,
    required this.onTap,
    this.subtitle,
    this.backgroundColor,
    this.foregroundColor,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final Color? backgroundColor;
  final Color? foregroundColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final foreground = foregroundColor ?? colors.onSurface;
    final mutedForeground = foregroundColor == null
        ? colors.onSurfaceVariant
        : foreground.withValues(alpha: 0.78);

    return Card(
      clipBehavior: Clip.antiAlias,
      color: backgroundColor,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: colors.outlineVariant),
        borderRadius: BorderRadius.circular(RijviaDesignLayout.cardRadius),
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(RijviaDesignSpace.md),
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              minHeight: RijviaDesignLayout.touchTarget,
            ),
            child: Row(
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: foregroundColor == null
                        ? colors.primaryContainer
                        : foreground.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: SizedBox(
                    width: 48,
                    height: 48,
                    child: Icon(icon, color: foreground, size: 24),
                  ),
                ),
                const SizedBox(width: RijviaDesignSpace.md),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: foreground,
                        ),
                      ),
                      if (subtitle != null && subtitle!.isNotEmpty) ...[
                        const SizedBox(height: RijviaDesignSpace.xs),
                        Text(
                          subtitle!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: mutedForeground,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: RijviaDesignSpace.sm),
                Icon(
                  Icons.arrow_forward_ios,
                  textDirection: Directionality.of(context),
                  size: 16,
                  color: mutedForeground,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
